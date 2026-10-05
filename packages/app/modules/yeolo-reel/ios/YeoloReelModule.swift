/**
 * @file YeoloReelModule.swift
 * @description Expo bridge for cancellable local reel encoding, native playback, sharing and add-only Photos save.
 */
import ExpoModulesCore
import AVKit
import Photos
import GoogleMaps

public final class YeoloReelModule: Module {
  private let lock = NSLock()
  private var running = false
  private var canceled = false
  private var directory: URL { FileManager.default.temporaryDirectory.appendingPathComponent("yeolo-reels", isDirectory: true) }

  public func definition() -> ModuleDefinition {
    Name("YeoloReel")
    Events("onProgress")
    Function("cancel") { self.lock.lock(); self.canceled = true; self.lock.unlock() }
    AsyncFunction("captureMapAsync") { (tag: Int, json: String) -> [String: Any] in
      guard let view = self.appContext?.findView(withTag: tag, ofType: UIView.self),
        let map = self.googleMap(in: view), map.bounds.width > 0, map.bounds.height > 0,
        let coordinates = try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: Any]] else { throw ReelError.invalidFile }
      // Capture only the SDK map; preserve its Google logo and copyright strip without a crop or gradient.
      let format = UIGraphicsImageRendererFormat(); format.scale = 1; format.opaque = true
      let image = UIGraphicsImageRenderer(size: CGSize(width: 720, height: 720), format: format).image { context in
        context.cgContext.scaleBy(x: 720 / map.bounds.width, y: 720 / map.bounds.height)
        map.layer.render(in: context.cgContext)
      }
      guard let data = image.pngData() else { throw ReelError.invalidPhoto }
      try FileManager.default.createDirectory(at: self.directory, withIntermediateDirectories: true)
      let file = self.directory.appendingPathComponent("map-\(UUID().uuidString).png")
      try data.write(to: file)
      let points = coordinates.map { coordinate -> [String: Any] in
        let position = map.projection.point(for: CLLocationCoordinate2D(latitude: coordinate["latitude"] as? Double ?? 0, longitude: coordinate["longitude"] as? Double ?? 0))
        return ["x": position.x / map.bounds.width, "y": 0.1 + position.y / map.bounds.height * 720 / 1280, "label": coordinate["label"] as? String ?? ""]
      }
      return ["uri": file.absoluteString, "points": points]
    }.runOnQueue(.main)
    AsyncFunction("generateAsync") { (json: String, jobId: String, promise: Promise) in
      self.lock.lock()
      if self.running { self.lock.unlock(); promise.reject("ERR_REEL_BUSY", "A reel is already being created."); return }
      self.running = true; self.canceled = false; self.lock.unlock()
      DispatchQueue.global(qos: .userInitiated).async {
        defer { self.lock.lock(); self.running = false; self.lock.unlock() }
        do {
          try FileManager.default.createDirectory(at: self.directory, withIntermediateDirectories: true)
          self.cleanExpiredFiles()
          let output = self.directory.appendingPathComponent("\(UUID().uuidString).mp4")
          try ReelRenderer.render(json: json, output: output, canceled: {
            self.lock.lock(); defer { self.lock.unlock() }; return self.canceled
          }, progress: { self.sendEvent("onProgress", ["jobId": jobId, "progress": $0]) })
          promise.resolve(output.absoluteString)
        } catch {
          promise.reject(error is ReelError && (error as? ReelError) == .canceled ? "ERR_REEL_CANCELED" : "ERR_REEL_EXPORT", "Could not create the reel. Please select the photos again.")
        }
      }
    }
    AsyncFunction("deleteAsync") { (uri: String) in try FileManager.default.removeItem(at: self.ownedFile(uri, allowMap: true)) }
    AsyncFunction("previewAsync") { (uri: String) in
      let player = AVPlayerViewController(); player.player = AVPlayer(url: try self.ownedFile(uri))
      guard let controller = self.appContext?.utilities?.currentViewController() else { throw ReelError.invalidFile }
      controller.present(player, animated: true) { player.player?.play() }
    }.runOnQueue(.main)
    AsyncFunction("shareAsync") { (uri: String, promise: Promise) in
      do {
        // The share copy remains available while another app imports it; stale copies expire next day.
        let copy = self.directory.appendingPathComponent("share-\(UUID().uuidString).mp4")
        try FileManager.default.copyItem(at: self.ownedFile(uri), to: copy)
        guard let controller = self.appContext?.utilities?.currentViewController() else { throw ReelError.invalidFile }
        let sheet = UIActivityViewController(activityItems: [copy], applicationActivities: nil)
        sheet.popoverPresentationController?.sourceView = controller.view
        sheet.popoverPresentationController?.sourceRect = CGRect(x: controller.view.bounds.midX, y: controller.view.bounds.midY, width: 1, height: 1)
        sheet.completionWithItemsHandler = { _, _, _, error in
          if let error { promise.reject("ERR_REEL_SHARE", error.localizedDescription) } else { promise.resolve(nil) }
        }
        controller.present(sheet, animated: true)
      } catch { promise.reject("ERR_REEL_SHARE", "Could not share the video.") }
    }.runOnQueue(.main)
    AsyncFunction("saveAsync") { (uri: String, promise: Promise) in
      do {
        let file = self.directory.appendingPathComponent("save-\(UUID().uuidString).mp4")
        try FileManager.default.copyItem(at: self.ownedFile(uri), to: file)
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
          guard status == .authorized || status == .limited else {
            try? FileManager.default.removeItem(at: file)
            promise.reject("ERR_REEL_PERMISSION", "Please allow adding videos to Photos."); return
          }
          PHPhotoLibrary.shared().performChanges({ PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: file) }) { success, error in
            try? FileManager.default.removeItem(at: file)
            if success { promise.resolve(true) } else { promise.reject("ERR_REEL_SAVE", "Could not save the video.") }
          }
        }
      } catch { promise.reject("ERR_REEL_SAVE", "Could not save the video.") }
    }
  }

  private func googleMap(in view: UIView) -> GMSMapView? {
    if let map = view as? GMSMapView { return map }
    for child in view.subviews { if let map = googleMap(in: child) { return map } }
    return nil
  }
  private func ownedFile(_ uri: String, allowMap: Bool = false) throws -> URL {
    guard let url = URL(string: uri), url.isFileURL, (url.pathExtension == "mp4" || (allowMap && url.pathExtension == "png" && url.lastPathComponent.hasPrefix("map-"))),
      url.resolvingSymlinksInPath().deletingLastPathComponent() == directory.resolvingSymlinksInPath(),
      FileManager.default.fileExists(atPath: url.path) else { throw ReelError.invalidFile }
    return url
  }
  private func cleanExpiredFiles() {
    for file in (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.contentModificationDateKey])) ?? [] {
      if let date = try? file.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate, date < Date().addingTimeInterval(-86400) {
        try? FileManager.default.removeItem(at: file)
      }
    }
  }
}
