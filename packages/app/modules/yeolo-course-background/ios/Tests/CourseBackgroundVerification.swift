/**
 * @file CourseBackgroundVerification.swift
 * @description Standalone simulator fixture verifying real HTTP completion after Home navigation under the production execution controller.
 */
import UIKit

@main
final class CourseBackgroundVerification: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  private var started = false
  private var backgrounded = false
  private let id = "ios-background-verification"
  private var directory: URL { FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] }

  func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    window = UIWindow(frame: UIScreen.main.bounds)
    let controller = UIViewController()
    controller.view.backgroundColor = .systemBackground
    let label = UILabel(frame: CGRect(x: 20, y: 160, width: 350, height: 100))
    label.text = "Background SSE verification"; controller.view.addSubview(label)
    window?.rootViewController = controller; window?.makeKeyAndVisible()
    return true
  }

  func applicationDidBecomeActive(_ application: UIApplication) {
    guard !started else { return }
    started = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { self.verify() }
  }
  func applicationDidEnterBackground(_ application: UIApplication) { backgrounded = true }

  private func verify() {
    do {
      try CourseBackgroundController.shared.begin(id: id, title: "Course verification", message: "Waiting for SSE", ready: { error in
        if let error { self.write(["passed": false, "error": String(describing: error)], file: "result.json"); return }
        let mode = CourseBackgroundController.shared.executionMode
        self.write(["mode": mode], file: "started.json")
        CourseBackgroundController.shared.update(id: self.id, message: "Waiting for completion", completed: 1, total: 2)
        var request = URLRequest(url: URL(string: "http://127.0.0.1:18088/api/courses")!)
        request.httpMethod = "POST"; request.httpBody = Data("{}".utf8)
        let start = Date()
        URLSession.shared.dataTask(with: request) { data, _, error in
          DispatchQueue.main.async {
            let completed = error == nil && String(data: data ?? Data(), encoding: .utf8)?.contains("device-course-complete") == true
            CourseBackgroundController.shared.finish(id: self.id, success: completed)
            self.write(["passed": completed && self.backgrounded, "backgrounded": self.backgrounded,
                        "executionMode": mode, "elapsedSeconds": Date().timeIntervalSince(start),
                        "error": error?.localizedDescription ?? ""], file: "result.json")
          }
        }.resume()
      }, expired: { _ in self.write(["passed": false, "error": "OS expired execution"], file: "result.json") })
    } catch { write(["passed": false, "error": String(describing: error)], file: "result.json") }
  }

  private func write(_ value: [String: Any], file: String) {
    try? JSONSerialization.data(withJSONObject: value).write(to: directory.appendingPathComponent(file))
  }
}
