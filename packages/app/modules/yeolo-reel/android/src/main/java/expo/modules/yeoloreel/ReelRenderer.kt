/**
 * @file ReelRenderer.kt
 * @description Bounded Canvas storyboard rendering into H.264 MediaCodec YUV input and an MP4 muxer.
 */
package expo.modules.yeoloreel

import android.content.Context
import android.graphics.*
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import android.os.SystemClock
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import org.json.JSONObject
import java.io.File
import kotlin.math.max
import kotlin.math.min

internal class ReelRenderer(private val context: Context) {
  fun render(json: String, output: File, canceled: () -> Boolean, progress: (Double) -> Unit) {
    val plan = JSONObject(json)
    val width = plan.getInt("width"); val height = plan.getInt("height"); val fps = plan.getInt("fps")
    val scenes = plan.getJSONArray("scenes")
    require(width == 720 && height == 1280 && fps == 24 && scenes.length() in 1..10)
    val totalFrames = (0 until scenes.length()).sumOf {
      val seconds = scenes.getJSONObject(it).getDouble("seconds")
      require(seconds > 0 && seconds <= 30)
      (seconds * fps).toInt()
    }
    require(totalFrames in 1..fps * 30)
    val bg = Color.parseColor(plan.getString("backgroundColor"))
    val accent = Color.parseColor(plan.getString("accentColor"))
    val text = Color.parseColor(plan.getString("textColor"))
    val layout = plan.optJSONObject("layout") ?: JSONObject()
    fun l(key: String, fallback: Double) = layout.optDouble(key, fallback).toFloat()
    val brandUri = plan.getJSONObject("brandMark").getString("uri")
    require(brandUri.startsWith("data:image/png;base64,") && brandUri.length < 100_000)
    val brandBytes = Base64.decode(brandUri.substringAfter(','),Base64.DEFAULT)
    val brandImage = requireNotNull(BitmapFactory.decodeByteArray(brandBytes,0,brandBytes.size))
    val brandRect = RectF(l("logoX",650.0),l("logoY",34.0),l("logoX",650.0)+l("logoWidth",33.3337),l("logoY",34.0)+l("logoHeight",38.8132))
    val gradient = LinearGradient(0f,l("gradientTop",700.0),0f,height.toFloat(),intArrayOf(Color.TRANSPARENT,Color.argb((l("gradientMidOpacity",0.78)*255).toInt(),0,0,0),Color.argb((l("gradientBottomOpacity",0.98)*255).toInt(),0,0,0)),floatArrayOf(0f,l("gradientMidStop",0.55),1f),Shader.TileMode.CLAMP)
    val card = RectF(l("mapX",26.0),l("mapY",306.0),l("mapX",26.0)+l("mapSize",668.0),l("mapY",306.0)+l("mapSize",668.0))
    val cardPath = Path().apply { addRoundRect(card,l("mapRadius",24.0),l("mapRadius",24.0),Path.Direction.CW) }
    val codec = MediaCodec.createEncoderByType("video/avc")
    val muxer = MediaMuxer(output.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val pixels = IntArray(width * height)
    val yuvWriter = YuvFrameWriter(width, height)

    var started = false; var codecStarted = false; var frame = 0; var track = -1
    var lastProgressTime = SystemClock.elapsedRealtime()
    val info = MediaCodec.BufferInfo()
    val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    fun checkCanceled() { check(!canceled()) { "REEL_CANCELED" } }
    fun drain(end: Boolean): Boolean {
      while (true) {
        checkCanceled()
        val index = codec.dequeueOutputBuffer(info, if (end) 10_000L else 0L)
        if (index == MediaCodec.INFO_TRY_AGAIN_LATER) return false
        if (index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
          check(!started)
          track = muxer.addTrack(codec.outputFormat); muxer.start(); started = true
        } else if (index >= 0) {
          val buffer = requireNotNull(codec.getOutputBuffer(index))
          if (info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0) info.size = 0
          if (info.size > 0) {
            check(started)
            buffer.position(info.offset); buffer.limit(info.offset + info.size)
            muxer.writeSampleData(track, buffer, info)
          }
          val eos = info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
          codec.releaseOutputBuffer(index, false)
          if (eos) return true
        }
      }
    }
    fun inputBuffer(): Int {
      val deadline = System.nanoTime() + 15_000_000_000L
      while (true) {
        checkCanceled(); drain(false)
        val index = codec.dequeueInputBuffer(10_000L)
        if (index >= 0) return index
        check(System.nanoTime() < deadline) { "Encoder input timed out" }
      }
    }
    try {
      val format = MediaFormat.createVideoFormat("video/avc", width, height).apply {
        setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420Flexible)
        setInteger(MediaFormat.KEY_BIT_RATE, 4_000_000)
        setInteger(MediaFormat.KEY_FRAME_RATE, fps)
        setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)
      }
      codec.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE); codec.start(); codecStarted = true
      val canvas = Canvas(bitmap)
      for (sceneIndex in 0 until scenes.length()) {
        val scene = scenes.getJSONObject(sceneIndex)
        val image = loadPhoto(scene.getString("uri"))
        try {
          val count = (scene.getDouble("seconds") * fps).toInt()
          val route = scene.getString("kind") == "route"
          val hero = scene.optString("role") == "hook"
          val title = TextLayer(scene.getString("title"),if(hero)l("textX",34.0) else l("titleX",86.0),if(hero)l("heroTitleY",1060.0) else l("titleY",938.0),(if(hero)l("textWidth",652.0) else l("titleWidth",600.0)).toInt(),if(hero)l("heroTitleSize",76.0) else l("titleSize",56.0),text,2,bold=true,bottomEdge=if(hero)null else l("titleY",938.0)+l("titleHeight",140.0))
          val caption = TextLayer(scene.getString("caption"),if(hero||route)l("textX",34.0) else l("captionX",86.0),if(route)l("dateY",1042.0) else if(hero)l("heroCaptionY",906.0) else l("captionY",1082.0),(if(hero||route)l("textWidth",652.0) else l("captionWidth",600.0)).toInt(),if(route)l("dateSize",32.0) else if(hero)l("heroCaptionSize",56.0) else l("captionSize",32.0),text,2,centered=route,bold=hero)
          val headingNumberY=title.drawY+l("numberY",972.0)-l("titleY",938.0)
          val numberText = if (scene.getString("title").isNotBlank()) scene.optString("number") else ""
          val numberRadius = l("numberRadius",18.0); val numberSize = l("numberSize",24.0)
          val number = if(numberText.isNotEmpty()) TextLayer(numberText,l("numberX",52.0)-numberRadius,headingNumberY-numberSize*.62f,(numberRadius*2).toInt(),numberSize,text,1,centered=true,bold=true) else null
          val overlay = Overlay(title,caption,number)
          val points = scene.getJSONArray("points")
          val routePoints = (0 until points.length()).map { index ->
            val point = points.getJSONObject(index); val x=point.getDouble("x").toFloat()*width; val y=point.getDouble("y").toFloat()*height
            val r=l("mapMarkerRadius",18.0); val font=l("mapMarkerSize",24.0)
            val name=point.optString("name"); val nx=point.optDouble("nameX",0.0).toFloat(); val ny=point.optDouble("nameY",0.0).toFloat(); val nw=point.optDouble("nameWidth",0.0).toFloat()
            RoutePoint(x,y,TextLayer(point.getString("label"),x-r,y-font*.62f,(r*2).toInt(),font,text,1,centered=true,bold=true),
              if(name.isNotEmpty()) RectF(nx,ny,nx+nw,ny+l("mapNameHeight",38.0)) else null,
              if(name.isNotEmpty()) TextLayer(name,nx+10,ny+7,(nw-20).toInt().coerceAtLeast(1),l("mapNameSize",18.0),bg,1,bold=true) else null)
          }
          for (localFrame in 0 until count) {
            checkCanceled()
            draw(canvas, paint, image, route, routePoints, overlay, bg, accent, text, localFrame.toFloat() / max(1, count - 1), scene.getDouble("seconds").toFloat(), gradient, card, cardPath, l("gradientTop",700.0),l("mapMarkerRadius",18.0),l("numberX",52.0),headingNumberY,numberRadius,l("markerIntervalSeconds",0.35),l("markerFadeSeconds",0.18),width,height)
            paint.shader=null;paint.alpha=255;paint.style=Paint.Style.FILL
            canvas.drawBitmap(brandImage,null,brandRect,paint)
            bitmap.getPixels(pixels, 0, width, 0, 0, width, height)
            val input = inputBuffer()
            val yuv = requireNotNull(codec.getInputImage(input)) { "Encoder does not support YUV image input" }
            val planes = yuv.planes
            yuvWriter.write(pixels,
              YuvPlane(planes[0].buffer, planes[0].rowStride, planes[0].pixelStride),
              YuvPlane(planes[1].buffer, planes[1].rowStride, planes[1].pixelStride),
              YuvPlane(planes[2].buffer, planes[2].rowStride, planes[2].pixelStride))
            codec.queueInputBuffer(input, 0, width * height * 3 / 2, frame.toLong() * 1_000_000 / fps, 0)
            frame++
            val now = SystemClock.elapsedRealtime()
            if (now - lastProgressTime >= 100) {
              progress(min(0.99, frame.toDouble() / totalFrames))
              lastProgressTime = now
            }
          }
        } finally { image?.recycle() }
      }
      codec.queueInputBuffer(inputBuffer(), 0, 0, frame.toLong() * 1_000_000 / fps, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
      val deadline = System.nanoTime() + 30_000_000_000L
      while (!drain(true)) { check(System.nanoTime() < deadline) { "Encoder output timed out" } }
      check(started); muxer.stop(); started = false
      progress(1.0)
    } catch (e: Throwable) {
      output.delete()
      throw e
    } finally {
      if (codecStarted) runCatching { codec.stop() }
      codec.release()
      if (started) runCatching { muxer.stop() }
      muxer.release(); bitmap.recycle(); brandImage.recycle()
    }
  }

  private fun loadPhoto(value: String): Bitmap {
    val uri = Uri.parse(value)
    require(uri.scheme == "file" || uri.scheme == "content")
    val resolver = context.contentResolver
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    resolver.openInputStream(uri).use { BitmapFactory.decodeStream(it, null, bounds) }
    require(bounds.outWidth > 0 && bounds.outHeight > 0)
    var sample = 1
    while (max(bounds.outWidth, bounds.outHeight) / sample > 1600) sample *= 2
    val image = requireNotNull(resolver.openInputStream(uri).use {
      BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
    })
    val orientation = resolver.openInputStream(uri).use { stream ->
      if (stream == null) ExifInterface.ORIENTATION_NORMAL else ExifInterface(stream).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
    }
    val matrix = Matrix().apply {
      when (orientation) {
        ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> setScale(-1f, 1f)
        ExifInterface.ORIENTATION_ROTATE_180 -> setRotate(180f)
        ExifInterface.ORIENTATION_FLIP_VERTICAL -> setScale(1f, -1f)
        ExifInterface.ORIENTATION_TRANSPOSE -> { setRotate(90f); postScale(-1f, 1f) }
        ExifInterface.ORIENTATION_ROTATE_90 -> setRotate(90f)
        ExifInterface.ORIENTATION_TRANSVERSE -> { setRotate(270f); postScale(-1f, 1f) }
        ExifInterface.ORIENTATION_ROTATE_270 -> setRotate(270f)
      }
    }
    if (matrix.isIdentity) return image
    val rotated = Bitmap.createBitmap(image, 0, 0, image.width, image.height, matrix, true)
    if (rotated !== image) image.recycle()
    return rotated
  }

  private data class Overlay(val title: TextLayer, val caption: TextLayer, val number: TextLayer?)

  private data class RoutePoint(val x: Float, val y: Float, val label: TextLayer, val nameBox: RectF?, val name: TextLayer?)

  /** Text shaping and line layout are scene-invariant; only opacity changes per frame. */
  private class TextLayer(text: String, private val x: Float, private val y: Float, width: Int, size: Float, color: Int, lines: Int, centered: Boolean = false, bold: Boolean = false, bottomEdge: Float? = null) {
    private val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
      textSize = size; this.color = color; typeface = Typeface.create(if (bold) "sans-serif" else "sans-serif-medium", if (bold) Typeface.BOLD else Typeface.NORMAL)
    }
    private val layout = StaticLayout.Builder.obtain(text, 0, text.length, paint, width)
      .setAlignment(if (centered) Layout.Alignment.ALIGN_CENTER else Layout.Alignment.ALIGN_NORMAL).setMaxLines(lines).setIncludePad(false).build()
    val drawY = if(bottomEdge==null)y else max(y,bottomEdge-layout.height)
    fun draw(canvas: Canvas, alpha: Float = 1f) {
      paint.alpha = (alpha*255).toInt()
      canvas.save(); canvas.translate(x, drawY); layout.draw(canvas); canvas.restore()
    }
  }

  private fun draw(canvas: Canvas, paint: Paint, image: Bitmap?, route: Boolean, points: List<RoutePoint>, overlay: Overlay, bg: Int, accent: Int, text: Int, fraction: Float, seconds: Float, gradient: LinearGradient, card:RectF,cardPath:Path,gradientTop:Float,markerRadius:Float,numberX:Float,numberY:Float,numberRadius:Float,interval:Float,fade:Float,width:Int,height:Int) {
    canvas.drawColor(bg); paint.shader=null;paint.alpha=255;paint.style=Paint.Style.FILL
    if(route) {
      canvas.save();canvas.clipPath(cardPath)
      if(image!=null)canvas.drawBitmap(image,null,card,paint)
      canvas.restore()
      for((index,point) in points.withIndex()) {
        val opacity = min(1f,max(0f,(fraction*seconds-index*interval)/fade))
        if(opacity<=0f)continue
        paint.alpha=(opacity*255).toInt()
        drawNumber(canvas,paint,point.x,point.y,markerRadius,accent,text)
        point.label.draw(canvas,opacity)
        point.nameBox?.let { paint.color=Color.WHITE;canvas.drawRoundRect(it,4f,4f,paint) }
        point.name?.draw(canvas,opacity)
      }
      paint.alpha=255
      overlay.caption.draw(canvas)
      return
    }
    if(image!=null) {
      val scale=max(width.toFloat()/image.width,height.toFloat()/image.height)
      val w=image.width*scale;val h=image.height*scale
      canvas.drawBitmap(image,null,RectF((width-w)/2,(height-h)/2,(width+w)/2,(height+h)/2),paint)
    }
    paint.shader=gradient;canvas.drawRect(0f,gradientTop,width.toFloat(),height.toFloat(),paint);paint.shader=null
    if(overlay.number!=null) { drawNumber(canvas,paint,numberX,numberY,numberRadius,accent,text);overlay.number.draw(canvas) }
    overlay.title.draw(canvas);overlay.caption.draw(canvas)
  }
  private fun drawNumber(canvas:Canvas,paint:Paint,x:Float,y:Float,radius:Float,accent:Int,text:Int) {
    paint.style=Paint.Style.FILL;paint.color=accent;canvas.drawCircle(x,y,radius,paint)
    paint.style=Paint.Style.STROKE;paint.strokeWidth=3f;paint.color=text;canvas.drawCircle(x,y,radius,paint);paint.style=Paint.Style.FILL
  }
}
