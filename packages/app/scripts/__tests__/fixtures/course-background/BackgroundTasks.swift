/**
 * @file BackgroundTasks.swift
 * @description Controllable scheduler double exercising actual production controller paths without real API requests.
 */
import Foundation
import Dispatch

public class BGTask {
  public init() {}
  public var expirationHandler: (() -> Void)?
  public private(set) var completed: Bool?
  public func setTaskCompleted(success: Bool) { completed = success }
}
public final class BGContinuedProcessingTask: BGTask {
  public override init() { super.init() }
  public let progress = Progress(totalUnitCount: 0)
  public var title = "Course"
  public func updateTitle(_ title: String, subtitle: String) { self.title = title }
}
public class BGTaskRequest {
  public let identifier: String
  public init(identifier: String) { self.identifier = identifier }
}
public final class BGContinuedProcessingTaskRequest: BGTaskRequest {
  public enum Strategy { case fail, queue }
  public var strategy: Strategy = .fail
  public init(identifier: String, title: String, subtitle: String) { super.init(identifier: identifier) }
}
public final class BGTaskScheduler {
  public struct Error: Swift.Error {
    public enum Code: Int { case unavailable = 1, tooManyPendingTaskRequests, notPermitted, immediateRunIneligible }
    public let code: Code
    public init(code: Code) { self.code = code }
  }
  public static let shared = BGTaskScheduler()
  public var canRegister = true
  public var submissionError: Error?
  public var handler: ((BGTask) -> Void)?
  public private(set) var identifier: String?
  public private(set) var canceled = [String]()
  public func register(forTaskWithIdentifier identifier: String, using queue: DispatchQueue?, launchHandler: @escaping (BGTask) -> Void) -> Bool {
    self.identifier = identifier
    handler = launchHandler
    return canRegister
  }
  public func submit(_ request: BGTaskRequest) throws {
    if let error = submissionError { throw error }
  }
  public func cancel(taskRequestWithIdentifier identifier: String) { canceled.append(identifier) }
}
