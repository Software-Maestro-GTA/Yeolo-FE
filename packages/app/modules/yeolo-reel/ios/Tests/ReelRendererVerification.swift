/**
 * @file ReelRendererVerification.swift
 * @description Standalone simulator verification app for actual MP4 frame decoding and cancellation cleanup. Excluded from the production pod.
 */
import UIKit
import AVFoundation

@main
final class VerifyApp: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    window = UIWindow(frame: UIScreen.main.bounds)
    window?.rootViewController = UIViewController(); window?.makeKeyAndVisible()
    DispatchQueue.global().async { self.verify() }
    return true
  }
  func verify() {
    let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let status = dir.appendingPathComponent("result.json")
    do {
      let image = UIGraphicsImageRenderer(size: CGSize(width: 900, height: 1400)).image { ctx in
        UIColor.red.setFill(); ctx.fill(CGRect(x: 0, y: 0, width: 900, height: 700))
        UIColor.blue.setFill(); ctx.fill(CGRect(x: 0, y: 700, width: 900, height: 700))
      }
      let photo = dir.appendingPathComponent("photo.jpg")
      try image.jpegData(compressionQuality: 0.9)!.write(to: photo)
      let scene: [String: Any] = ["kind":"photo", "uri":photo.absoluteString, "title":"부산에서 보낸 하루", "caption":"우리의 여행을 오래 기억하기", "seconds":3, "points":[]]
      let mapImage = UIGraphicsImageRenderer(size: CGSize(width: 720, height: 720)).image { ctx in
        UIColor.green.setFill(); ctx.fill(CGRect(x: 0, y: 0, width: 720, height: 720))
        UIColor.white.setFill(); ctx.fill(CGRect(x: 0, y: 690, width: 720, height: 30))
      }
      let mapFile = dir.appendingPathComponent("map.png")
      try mapImage.pngData()!.write(to: mapFile)
      let route: [String: Any] = ["kind":"route", "uri":mapFile.absoluteString, "title":"오늘의 발자취", "caption":"DAY 1", "seconds":2, "points":[["x":0.3,"y":0.35,"label":"1"],["x":0.7,"y":0.55,"label":"2"]]]
      let plan: [String: Any] = ["width":720,"height":1280,"fps":24,"backgroundColor":"#0D2137","accentColor":"#F59E0B","textColor":"#FFFFFF","scenes":[scene,route,scene]]
      let json = String(data: try JSONSerialization.data(withJSONObject:plan), encoding:.utf8)!
      let output = dir.appendingPathComponent("sample.mp4")
      try? FileManager.default.removeItem(at:output)
      try ReelRenderer.render(json:json, output:output, canceled:{false}, progress:{_ in})
      let asset = AVURLAsset(url:output)
      let track = asset.tracks(withMediaType:.video)[0]
      let duration = CMTimeGetSeconds(asset.duration)
      guard abs(duration-8) < 0.1, track.naturalSize == CGSize(width:720,height:1280) else { throw ReelError.encoding }
      let reader = try AVAssetReader(asset:asset)
      let frames = AVAssetReaderTrackOutput(track:track, outputSettings:[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32BGRA])
      reader.add(frames); reader.startReading()
      var count = 0; var colored = false; var mapBackground = false; var attributionStrip = false
      while let sample = frames.copyNextSampleBuffer() {
        if count == 0, let pixel = CMSampleBufferGetImageBuffer(sample) {
          CVPixelBufferLockBaseAddress(pixel, .readOnly)
          let ptr = CVPixelBufferGetBaseAddress(pixel)!.assumingMemoryBound(to:UInt8.self)
          let offset = 200*CVPixelBufferGetBytesPerRow(pixel)+360*4
          colored = ptr[offset+2] > 150 && ptr[offset] < 80
          CVPixelBufferUnlockBaseAddress(pixel,.readOnly)
        }
        if count == 84, let pixel = CMSampleBufferGetImageBuffer(sample) {
          CVPixelBufferLockBaseAddress(pixel, .readOnly)
          let ptr = CVPixelBufferGetBaseAddress(pixel)!.assumingMemoryBound(to: UInt8.self)
          let offset = 200 * CVPixelBufferGetBytesPerRow(pixel) + 360 * 4
          mapBackground = ptr[offset + 1] > 150 && ptr[offset + 2] < 80
          let strip = 830 * CVPixelBufferGetBytesPerRow(pixel) + 360 * 4
          attributionStrip = ptr[strip] > 230 && ptr[strip+1] > 230 && ptr[strip+2] > 230
          CVPixelBufferUnlockBaseAddress(pixel, .readOnly)
        }
        count += 1
      }
      guard count == 192, colored, mapBackground, attributionStrip, reader.status == .completed else { throw ReelError.encoding }
      let canceledFile = dir.appendingPathComponent("cancel.mp4")
      var canceledWorked = false
      do { try ReelRenderer.render(json:json, output:canceledFile,canceled:{true},progress:{_ in}) }
      catch ReelError.canceled { canceledWorked = !FileManager.default.fileExists(atPath:canceledFile.path) }
      guard canceledWorked else { throw ReelError.encoding }
      let result: [String:Any] = ["passed":true,"mapBackground":mapBackground,"attributionStrip":attributionStrip,"duration":duration,"frames":count,"width":track.naturalSize.width,"height":track.naturalSize.height,"firstFrameColored":colored,"cancelCleanup":canceledWorked]
      try JSONSerialization.data(withJSONObject:result).write(to:status)
    } catch { try? JSONSerialization.data(withJSONObject:["passed":false,"error":String(describing:error)]).write(to:status) }
  }
}
