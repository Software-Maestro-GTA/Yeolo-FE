/**
 * @file main.swift
 * @description Exercises foreground readiness, scheduler failures, stale callbacks and bounded expiration on the real controller.
 */
import UIKit
import BackgroundTasks

let controller = CourseBackgroundController.shared
let app = UIApplication.shared
let scheduler = BGTaskScheduler.shared
let scenario = CommandLine.arguments[1]
var readyCount = 0
var expiredCount = 0
var failed = false

if scenario == "registration" { scheduler.canRegister = false }
if let code = Int(scenario), let error = BGTaskScheduler.Error.Code(rawValue: code) {
  scheduler.submissionError = BGTaskScheduler.Error(code: error)
}
if scenario == "assertion" { app.allowsAssertion = false }
if scenario == "inactive" { app.applicationState = .inactive }

do {
  try controller.begin(id: "job", title: "test", message: "test", ready: { error in
    if error == nil { readyCount += 1 } else { failed = true }
  }, expired: { _ in expiredCount += 1 })
} catch { failed = true }

if scenario == "timeout" {
  precondition(readyCount == 0 && app.assertions == 1)
  RunLoop.main.run(until: Date().addingTimeInterval(10.2))
}

if scenario == "assertion" || scenario == "inactive" {
  precondition(failed && readyCount == 0 && app.assertions == 0)
} else if scenario == "continued" {
  precondition(readyCount == 0 && app.assertions == 1)
  let task = BGContinuedProcessingTask()
  scheduler.handler?(task)
  precondition(readyCount == 1 && controller.executionMode == "continued" && app.assertions == 0)
  controller.update(id: "job", message: "progress", completed: 1, total: 2)
  precondition(task.progress.completedUnitCount == 1)
  controller.finish(id: "job", success: true)
  precondition(task.completed == true)
} else {
  precondition(!failed && readyCount == 1 && controller.executionMode == "limited" && app.assertions == 1,
    "A valid finite assertion must allow foreground generation when continued scheduling is unavailable")
  let lateTask = BGContinuedProcessingTask()
  scheduler.handler?(lateTask)
  precondition(lateTask.completed == false && readyCount == 1 && app.assertions == 1)
  app.expirationHandler?()
  precondition(expiredCount == 1 && app.assertions == 0)
}
controller.finish(id: "job", success: false)
precondition(app.assertions == 0)
print("PASS \(scenario)")
