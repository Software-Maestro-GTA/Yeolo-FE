/**
 * @file ReelRenderer.swift
 * @description Bounded local-photo storyboard renderer producing silent portrait H.264 MP4.
 */
import AVFoundation
import UIKit
import ImageIO

enum ReelError: Error { case invalidPlan, invalidPhoto, encoding, canceled, invalidFile }

final class ReelRenderer {
  static func render(json: String, output: URL, canceled: () -> Bool, progress: (Double) -> Void) throws {
    guard let data = json.data(using: .utf8),
      let plan = try JSONSerialization.jsonObject(with: data) as? [String: Any],
      let scenes = plan["scenes"] as? [[String: Any]], !scenes.isEmpty, scenes.count <= 8,
      let width = plan["width"] as? Int, let height = plan["height"] as? Int,
      width == 720, height == 1280, let fps = plan["fps"] as? Int, fps == 24 else { throw ReelError.invalidPlan }
    let duration = scenes.reduce(0.0) { $0 + ($1["seconds"] as? Double ?? 0) }
    guard duration > 0, duration <= 30, scenes.allSatisfy({ ($0["seconds"] as? Double ?? 0) > 0 }) else { throw ReelError.invalidPlan }
    let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
      AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: width, AVVideoHeightKey: height,
      AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 4_000_000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel]
    ])
    input.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
      kCVPixelBufferWidthKey as String: width, kCVPixelBufferHeightKey as String: height,
      kCVPixelBufferCGImageCompatibilityKey as String: true, kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
    ])
    guard writer.canAdd(input) else { throw ReelError.encoding }
    writer.add(input)
    guard writer.startWriting() else { throw writer.error ?? ReelError.encoding }
    writer.startSession(atSourceTime: .zero)
    var frame = 0
    do {
      for scene in scenes {
        if canceled() { throw ReelError.canceled }
        let image: UIImage? = try loadPhoto(scene["uri"] as? String ?? "")
        let count = Int((scene["seconds"] as? Double ?? 0) * Double(fps))
        for localFrame in 0..<count {
          if canceled() { throw ReelError.canceled }
          let deadline = Date().addingTimeInterval(15)
          while !input.isReadyForMoreMediaData {
            if canceled() { throw ReelError.canceled }
            guard writer.status == .writing, Date() < deadline else { throw writer.error ?? ReelError.encoding }
            Thread.sleep(forTimeInterval: 0.002)
          }
          try autoreleasepool {
            var pixel: CVPixelBuffer?
            guard let pool = adaptor.pixelBufferPool,
              CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixel) == kCVReturnSuccess, let pixel else { throw ReelError.encoding }
            CVPixelBufferLockBaseAddress(pixel, [])
            defer { CVPixelBufferUnlockBaseAddress(pixel, []) }
            guard let context = CGContext(data: CVPixelBufferGetBaseAddress(pixel), width: width, height: height,
              bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixel), space: CGColorSpaceCreateDeviceRGB(),
              bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue) else { throw ReelError.encoding }
            context.translateBy(x: 0, y: CGFloat(height))
            context.scaleBy(x: 1, y: -1)
            UIGraphicsPushContext(context)
            defer { UIGraphicsPopContext() }
            draw(context, scene: scene, image: image, fraction: CGFloat(localFrame) / CGFloat(max(1, count - 1)), size: CGSize(width: width, height: height), plan: plan)
            guard adaptor.append(pixel, withPresentationTime: CMTime(value: Int64(frame), timescale: Int32(fps))) else { throw writer.error ?? ReelError.encoding }
          }
          frame += 1
          if frame % fps == 0 { progress(Double(frame) / (duration * Double(fps))) }
        }
      }
      input.markAsFinished()
      writer.endSession(atSourceTime: CMTime(value: Int64(frame), timescale: Int32(fps)))
      let finished = DispatchSemaphore(value: 0)
      writer.finishWriting { finished.signal() }
      guard finished.wait(timeout: .now() + 30) == .success, writer.status == .completed else { throw writer.error ?? ReelError.encoding }
      if canceled() { throw ReelError.canceled }
      progress(1)
    } catch {
      writer.cancelWriting()
      try? FileManager.default.removeItem(at: output)
      throw error
    }
  }

  private static func loadPhoto(_ uri: String) throws -> UIImage {
    guard let url = URL(string: uri), url.isFileURL,
      let source = CGImageSourceCreateWithURL(url as CFURL, nil),
      let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceThumbnailMaxPixelSize: 1600
      ] as CFDictionary) else { throw ReelError.invalidPhoto }
    return UIImage(cgImage: image)
  }

  private static func color(_ value: Any?, fallback: UIColor) -> UIColor {
    guard let hex = value as? String, hex.count == 7, let rgb = UInt32(hex.dropFirst(), radix: 16) else { return fallback }
    return UIColor(red: CGFloat((rgb >> 16) & 255) / 255, green: CGFloat((rgb >> 8) & 255) / 255, blue: CGFloat(rgb & 255) / 255, alpha: 1)
  }

  private static func draw(_ ctx: CGContext, scene: [String: Any], image: UIImage?, fraction: CGFloat, size: CGSize, plan: [String: Any]) {
    let bg = color(plan["backgroundColor"], fallback: .black)
    let accent = color(plan["accentColor"], fallback: .white)
    let text = color(plan["textColor"], fallback: .white)
    ctx.setFillColor(bg.cgColor); ctx.fill(CGRect(origin: .zero, size: size))
    let route = scene["kind"] as? String == "route"
    if route, let image {
      image.draw(in: CGRect(x: 0, y: size.height * 0.1, width: size.width, height: size.width))
    } else if let image {
      let scale = max(size.width / image.size.width, size.height / image.size.height) * (1 + fraction * 0.06)
      let w = image.size.width * scale, h = image.size.height * scale
      image.draw(in: CGRect(x: (size.width - w) / 2, y: (size.height - h) / 2, width: w, height: h))
    }
    if route, let points = scene["points"] as? [[String: Any]], !points.isEmpty {
      let positions = points.map { CGPoint(x: ($0["x"] as? Double ?? 0.5) * size.width, y: ($0["y"] as? Double ?? 0.5) * size.height) }
      ctx.setStrokeColor(accent.cgColor); ctx.setLineWidth(6); ctx.setLineCap(.round)
      let distance = fraction * CGFloat(max(0, positions.count - 1))
      ctx.beginPath(); ctx.move(to: positions[0])
      for i in 1..<positions.count {
        let amount = min(1, max(0, distance - CGFloat(i - 1)))
        ctx.addLine(to: CGPoint(x: positions[i-1].x + (positions[i].x - positions[i-1].x) * amount, y: positions[i-1].y + (positions[i].y - positions[i-1].y) * amount))
      }
      ctx.strokePath()
      for (i, point) in positions.enumerated() {
        ctx.setFillColor(accent.cgColor); ctx.fillEllipse(in: CGRect(x: point.x - 22, y: point.y - 22, width: 44, height: 44))
        drawText(points[i]["label"] as? String ?? "", rect: CGRect(x: point.x - 25, y: point.y - 17, width: 50, height: 40), font: 26, color: bg)
      }
    }
    if !route, let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: [UIColor.clear.cgColor, UIColor.black.withAlphaComponent(0.75).cgColor] as CFArray, locations: [0, 1]) {
      ctx.drawLinearGradient(gradient, start: CGPoint(x: 0, y: size.height * 0.55), end: CGPoint(x: 0, y: size.height), options: [.drawsAfterEndLocation])
    }
    ctx.saveGState(); ctx.setAlpha(min(1, fraction * 8 + 0.2))
    drawText(scene["title"] as? String ?? "", rect: CGRect(x: size.width * 0.08, y: size.height * 0.70, width: size.width * 0.84, height: 110), font: 40, color: accent)
    drawText(scene["caption"] as? String ?? "", rect: CGRect(x: size.width * 0.08, y: size.height * 0.79, width: size.width * 0.84, height: 170), font: 34, color: text)
    ctx.restoreGState()
  }

  private static func drawText(_ text: String, rect: CGRect, font: CGFloat, color: UIColor) {
    let paragraph = NSMutableParagraphStyle(); paragraph.alignment = .center; paragraph.lineBreakMode = .byWordWrapping
    (text as NSString).draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: [
      .font: UIFont.systemFont(ofSize: font, weight: .medium), .foregroundColor: color, .paragraphStyle: paragraph
    ], context: nil)
  }
}
