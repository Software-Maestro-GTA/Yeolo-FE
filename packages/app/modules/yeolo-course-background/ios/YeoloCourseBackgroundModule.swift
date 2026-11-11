/**
 * @file YeoloCourseBackgroundModule.swift
 * @description Expo bridge for task-owned iOS background execution independent of React screen mounts.
 */
import ExpoModulesCore

public final class YeoloCourseBackgroundModule: Module {
  private var currentJobId: String?

  public func definition() -> ModuleDefinition {
    Name("YeoloCourseBackground")
    Events("onExpired")
    AsyncFunction("startAsync") { (id: String, title: String, message: String, _: String, promise: Promise) in
      do {
        self.currentJobId = id
        try CourseBackgroundController.shared.begin(id: id, title: title, message: message, ready: { [weak self] error in
          if let error { self?.currentJobId = nil; promise.reject("ERR_COURSE_BACKGROUND_START", error.localizedDescription) }
          else { self?.currentJobId = id; promise.resolve(CourseBackgroundController.shared.executionMode) }
        }, expired: { [weak self] job in self?.sendEvent("onExpired", ["jobId": job]) })
      } catch { self.currentJobId = nil; promise.reject("ERR_COURSE_BACKGROUND_START", error.localizedDescription) }
    }.runOnQueue(.main)
    AsyncFunction("updateAsync") { (id: String, message: String, completed: Int, total: Int) in
      CourseBackgroundController.shared.update(id: id, message: message, completed: completed, total: total)
    }.runOnQueue(.main)
    AsyncFunction("finishAsync") { (id: String, success: Bool) in
      CourseBackgroundController.shared.finish(id: id, success: success)
      if self.currentJobId == id { self.currentJobId = nil }
    }.runOnQueue(.main)
    OnDestroy {
      let id = self.currentJobId
      self.currentJobId = nil
      if let id { DispatchQueue.main.async { CourseBackgroundController.shared.finish(id: id, success: false) } }
    }
  }
}
