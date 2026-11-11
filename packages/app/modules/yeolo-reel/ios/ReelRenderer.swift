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
      let scenes = plan["scenes"] as? [[String: Any]], !scenes.isEmpty, scenes.count <= 10,
      let width = plan["width"] as? Int, let height = plan["height"] as? Int,
      width == 720, height == 1280, let fps = plan["fps"] as? Int, fps == 24 else { throw ReelError.invalidPlan }
    let duration = scenes.reduce(0.0) { $0 + ($1["seconds"] as? Double ?? 0) }
    guard duration > 0, duration <= 30, scenes.allSatisfy({ ($0["seconds"] as? Double ?? 0) > 0 }) else { throw ReelError.invalidPlan }
    guard let brand = plan["brandMark"] as? [String:Any],
      let uri = brand["uri"] as? String, uri.hasPrefix("data:image/png;base64,"), uri.count < 100_000,
      let brandData = Data(base64Encoded:String(uri.dropFirst("data:image/png;base64,".count))),
      let brandImage = UIImage(data:brandData) else { throw ReelError.invalidPlan }
    let brandLayout = plan["layout"] as? [String:Any] ?? [:]
    let brandRect = CGRect(x:brandLayout["logoX"] as? Double ?? 650,y:brandLayout["logoY"] as? Double ?? 34,width:brandLayout["logoWidth"] as? Double ?? 33.3337,height:brandLayout["logoHeight"] as? Double ?? 38.8132)
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
    var lastProgressTime = ProcessInfo.processInfo.systemUptime
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
            brandImage.draw(in:brandRect)
            guard adaptor.append(pixel, withPresentationTime: CMTime(value: Int64(frame), timescale: Int32(fps))) else { throw writer.error ?? ReelError.encoding }
          }
          frame += 1
          let now = ProcessInfo.processInfo.systemUptime
          if now - lastProgressTime >= 0.1 {
            progress(min(0.99, Double(frame) / (duration * Double(fps))))
            lastProgressTime = now
          }
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
    let layout = plan["layout"] as? [String: Any] ?? [:]
    func v(_ key: String, _ fallback: CGFloat) -> CGFloat { (layout[key] as? NSNumber).map { CGFloat(truncating: $0) } ?? fallback }
    ctx.setFillColor(bg.cgColor); ctx.fill(CGRect(origin: .zero, size: size))
    let route = scene["kind"] as? String == "route"
    let hero = scene["role"] as? String == "hook"
    if route {
      let card = CGRect(x:v("mapX",26),y:v("mapY",306),width:v("mapSize",668),height:v("mapSize",668))
      ctx.saveGState(); UIBezierPath(roundedRect:card,cornerRadius:v("mapRadius",24)).addClip()
      image?.draw(in:card)
      ctx.restoreGState()
      if let points = scene["points"] as? [[String:Any]] {
        let time = fraction * CGFloat(scene["seconds"] as? Double ?? 4)
        for (index, point) in points.enumerated() {
          let opacity = min(1,max(0,(time-CGFloat(index)*v("markerIntervalSeconds",0.35))/v("markerFadeSeconds",0.18)))
          if opacity <= 0 { continue }
          let x = CGFloat(point["x"] as? Double ?? 0.5)*size.width, y = CGFloat(point["y"] as? Double ?? 0.5)*size.height
          ctx.saveGState(); ctx.setAlpha(opacity)
          drawNumber(ctx, label:point["label"] as? String ?? "", x:x,y:y,radius:v("mapMarkerRadius",18),font:v("mapMarkerSize",24),fill:accent,text:text)
          if let name = point["name"] as? String, !name.isEmpty {
            let rect = CGRect(x:point["nameX"] as? Double ?? 0,y:point["nameY"] as? Double ?? 0,width:point["nameWidth"] as? Double ?? 0,height:Double(v("mapNameHeight",38)))
            UIColor.white.setFill(); UIBezierPath(roundedRect:rect,cornerRadius:4).fill()
            drawText(name,rect:CGRect(x:rect.minX+10,y:rect.minY+7,width:rect.width-20,height:rect.height-7),font:v("mapNameSize",18),color:bg,weight:.bold)
          }
          ctx.restoreGState()
        }
      }
      drawText(scene["caption"] as? String ?? "",rect:CGRect(x:v("textX",34),y:v("dateY",1042),width:v("textWidth",652),height:v("dateHeight",64)),font:v("dateSize",32),color:text,weight:.medium,centered:true)
      return
    }
    if let image {
      let scale = max(size.width/image.size.width,size.height/image.size.height)
      let w = image.size.width*scale, h = image.size.height*scale
      image.draw(in:CGRect(x:(size.width-w)/2,y:(size.height-h)/2,width:w,height:h))
    }
    if let gradient = CGGradient(colorsSpace:CGColorSpaceCreateDeviceRGB(),colors:[UIColor.clear.cgColor,UIColor.black.withAlphaComponent(v("gradientMidOpacity",0.78)).cgColor,UIColor.black.withAlphaComponent(v("gradientBottomOpacity",0.98)).cgColor] as CFArray,locations:[0,v("gradientMidStop",0.55),1]) {
      ctx.drawLinearGradient(gradient,start:CGPoint(x:0,y:v("gradientTop",700)),end:CGPoint(x:0,y:size.height),options:[.drawsAfterEndLocation])
    }
    let title = scene["title"] as? String ?? ""
    let titleSize = hero ? v("heroTitleSize",76):v("titleSize",56)
    var titleRect = CGRect(x:hero ? v("textX",34):v("titleX",86),y:hero ? v("heroTitleY",1020):v("titleY",938),width:hero ? v("textWidth",652):v("titleWidth",600),height:hero ? v("heroTitleHeight",190):v("titleHeight",140))
    if !hero {
      let font = UIFont.systemFont(ofSize:titleSize,weight:.heavy)
      let bounds = (title as NSString).boundingRect(with:CGSize(width:titleRect.width,height:titleRect.height),options:[.usesLineFragmentOrigin,.usesFontLeading],attributes:[.font:font],context:nil)
      let height = min(titleRect.height,max(ceil(font.lineHeight),ceil(bounds.height)))
      titleRect = CGRect(x:titleRect.minX,y:titleRect.maxY-height,width:titleRect.width,height:height)
    }
    if let number = scene["number"] as? String, !number.isEmpty, !title.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty {
      drawNumber(ctx,label:number,x:v("numberX",52),y:titleRect.minY+v("numberY",972)-v("titleY",938),radius:v("numberRadius",18),font:v("numberSize",24),fill:accent,text:text)
    }
    drawText(title,rect:titleRect,font:titleSize,color:text,weight:.heavy)
    drawText(scene["caption"] as? String ?? "",rect:CGRect(x:hero ? v("textX",34):v("captionX",86),y:hero ? v("heroCaptionY",946):v("captionY",1082),width:hero ? v("textWidth",652):v("captionWidth",600),height:hero ? v("heroCaptionHeight",108):v("captionHeight",128)),font:hero ? v("heroCaptionSize",56):v("captionSize",32),color:text,weight:hero ? .heavy:.medium)
  }

  private static func drawNumber(_ ctx:CGContext,label:String,x:CGFloat,y:CGFloat,radius:CGFloat,font:CGFloat,fill:UIColor,text:UIColor) {
    let rect = CGRect(x:x-radius,y:y-radius,width:radius*2,height:radius*2)
    ctx.setFillColor(fill.cgColor); ctx.fillEllipse(in:rect)
    ctx.setStrokeColor(text.cgColor); ctx.setLineWidth(3); ctx.strokeEllipse(in:rect)
    drawText(label,rect:CGRect(x:x-radius,y:y-font*0.62,width:radius*2,height:font*1.3),font:font,color:text,weight:.heavy,centered:true)
  }

  private static func drawText(_ text: String, rect: CGRect, font: CGFloat, color: UIColor, weight: UIFont.Weight = .medium, centered: Bool = false) {
    let paragraph = NSMutableParagraphStyle(); paragraph.alignment = centered ? .center : .left; paragraph.lineBreakMode = .byWordWrapping
    (text as NSString).draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: [
      .font: UIFont.systemFont(ofSize: font, weight: weight), .foregroundColor: color, .paragraphStyle: paragraph
    ], context: nil)
  }
}
