/**
 * @file CourseBackgroundController.swift
 * @description Main-thread execution assertions for course SSE, including iOS 26 continued processing and expiration cleanup.
 */
import UIKit
import BackgroundTasks

final class CourseBackgroundController {
  static let shared = CourseBackgroundController()
  private var jobId: String?
  private var backgroundId: UIBackgroundTaskIdentifier = .invalid
  private var continuedTask: BGTask?
  private var taskIdentifier: String?
  private var onReady: ((Error?) -> Void)?
  private var onExpired: ((String) -> Void)?
  private var startupTimeout: DispatchWorkItem?
  private(set) var executionMode = "limited"

  enum ExecutionError: Error { case busy, inactive, unavailable, expired }

  /// Acquires execution before the shared JS request begins; callbacks execute on the main thread.
  func begin(id: String, title: String, message: String, ready: @escaping (Error?) -> Void, expired: @escaping (String) -> Void) throws {
    dispatchPrecondition(condition: .onQueue(.main))
    guard jobId == nil else { throw ExecutionError.busy }
    guard UIApplication.shared.applicationState == .active else { throw ExecutionError.inactive }
    jobId = id; onReady = ready; onExpired = expired
    executionMode = "limited"
    backgroundId = UIApplication.shared.beginBackgroundTask(withName: "YeoloCourseGeneration") { [weak self] in
      guard let self, self.continuedTask == nil else { return }
      self.expire(id: id)
    }
    guard backgroundId != .invalid else { finish(id: id, success: false); throw ExecutionError.unavailable }

    if #available(iOS 26.0, *) {
      // Register a concrete, unique identifier under the permitted wildcard. Continued tasks allow registration after app launch.
      let identifier = "\(Bundle.main.bundleIdentifier!).course-generation.\(UUID().uuidString)"
      taskIdentifier = identifier
      guard BGTaskScheduler.shared.register(forTaskWithIdentifier: identifier, using: .main, launchHandler: { [weak self] task in
        guard let self, self.jobId == id, let continued = task as? BGContinuedProcessingTask else {
          task.setTaskCompleted(success: false); return
        }
        self.continuedTask = continued
        self.executionMode = "continued"
        continued.progress.totalUnitCount = 2
        continued.progress.completedUnitCount = 0
        continued.expirationHandler = { [weak self] in DispatchQueue.main.async { self?.expire(id: id) } }
        self.startupTimeout?.cancel(); self.startupTimeout = nil
        // The continued task owns execution now. Release the short assertion so its deadline cannot cancel this task.
        self.endShortAssertion()
        let callback = self.onReady; self.onReady = nil
        callback?(nil)
      }) else { finish(id: id, success: false); throw ExecutionError.unavailable }

      let timeout = DispatchWorkItem { [weak self] in self?.expire(id: id) }
      startupTimeout = timeout
      DispatchQueue.main.asyncAfter(deadline: .now() + 10, execute: timeout)
      let request = BGContinuedProcessingTaskRequest(identifier: identifier, title: title, subtitle: message)
      // Never queue a lease: the API request must start only after execution has actually been granted.
      request.strategy = .fail
      do { try BGTaskScheduler.shared.submit(request) }
      catch {
        if let schedulerError = error as? BGTaskScheduler.Error, schedulerError.code == .unavailable {
          // Simulator and system-disabled scheduling can still use the finite UIKit assertion.
          startupTimeout?.cancel(); startupTimeout = nil
          BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier)
          taskIdentifier = nil; onReady = nil
          ready(nil)
        } else { finish(id: id, success: false); throw error }
      }
    } else {
      onReady = nil
      ready(nil)
    }
  }

  func update(id: String, message: String, completed: Int, total: Int) {
    dispatchPrecondition(condition: .onQueue(.main))
    guard jobId == id else { return }
    if #available(iOS 26.0, *), let task = continuedTask as? BGContinuedProcessingTask {
      task.progress.totalUnitCount = Int64(max(1, total))
      task.progress.completedUnitCount = Int64(min(max(0, completed), max(1, total)))
      task.updateTitle(task.title, subtitle: message)
    }
  }

  func finish(id: String, success: Bool) {
    dispatchPrecondition(condition: .onQueue(.main))
    guard jobId == id else { return }
    jobId = nil
    startupTimeout?.cancel(); startupTimeout = nil
    if #available(iOS 26.0, *), success, let task = continuedTask as? BGContinuedProcessingTask {
      task.progress.completedUnitCount = task.progress.totalUnitCount
    }
    continuedTask?.setTaskCompleted(success: success); continuedTask = nil
    if let identifier = taskIdentifier { BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier) }
    taskIdentifier = nil; onReady = nil; onExpired = nil
    endShortAssertion()
  }

  private func endShortAssertion() {
    if backgroundId != .invalid {
      UIApplication.shared.endBackgroundTask(backgroundId)
      backgroundId = .invalid
    }
  }

  private func expire(id: String) {
    guard jobId == id else { return }
    let ready = onReady; let expired = onExpired
    finish(id: id, success: false)
    ready?(ExecutionError.expired)
    expired?(id)
  }
}
