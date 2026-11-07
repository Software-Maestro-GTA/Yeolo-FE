/**
 * @file UIKit.swift
 * @description Host test double for UIKit's finite background assertion and application state.
 */
@_exported import Foundation
@_exported import Dispatch

public struct UIBackgroundTaskIdentifier: Equatable {
  public let rawValue: Int
  public static let invalid = UIBackgroundTaskIdentifier(rawValue: -1)
}

public final class UIApplication {
  public static let shared = UIApplication()
  public enum State { case active, inactive, background }
  public var applicationState: State = .active
  public var allowsAssertion = true
  public private(set) var assertions = 0
  public var expirationHandler: (() -> Void)?

  public func beginBackgroundTask(withName: String, expirationHandler: @escaping () -> Void) -> UIBackgroundTaskIdentifier {
    guard allowsAssertion else { return .invalid }
    assertions += 1
    self.expirationHandler = expirationHandler
    return UIBackgroundTaskIdentifier(rawValue: assertions)
  }

  public func endBackgroundTask(_ id: UIBackgroundTaskIdentifier) {
    assertions -= 1
    expirationHandler = nil
  }
}
