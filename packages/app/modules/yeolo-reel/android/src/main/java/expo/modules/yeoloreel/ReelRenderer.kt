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
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
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
    require(width == 720 && height == 1280 && fps == 24 && scenes.length() in 1..8)
    val totalFrames = (0 until scenes.length()).sumOf {
      val seconds = scenes.getJSONObject(it).getDouble("seconds")
      require(seconds > 0 && seconds <= 30)
      (seconds * fps).toInt()
    }
    require(totalFrames in 1..fps * 30)
    val bg = Color.parseColor(plan.getString("backgroundColor"))
    val accent = Color.parseColor(plan.getString("accentColor"))
    val text = Color.parseColor(plan.getString("textColor"))
    val gradient = LinearGradient(0f, height*.55f, 0f, height.toFloat(), Color.TRANSPARENT, Color.argb(191, 0, 0, 0), Shader.TileMode.CLAMP)
    val codec = MediaCodec.createEncoderByType("video/avc")
    val muxer = MediaMuxer(output.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val pixels = IntArray(width * height)
    val yuvWriter = YuvFrameWriter(width, height)

    var started = false; var codecStarted = false; var frame = 0; var track = -1
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
          val title = TextLayer(scene.getString("title"), width*.08f, height*.70f, (width*.84f).toInt(), 40f, accent, 2)
          val caption = TextLayer(scene.getString("caption"), width*.08f, height*.79f, (width*.84f).toInt(), 34f, text, 4)
          val points = scene.getJSONArray("points")
          val routePoints = (0 until points.length()).map { i ->
            val point = points.getJSONObject(i)
            val x = point.getDouble("x").toFloat() * width
            val y = point.getDouble("y").toFloat() * height
            RoutePoint(x, y, TextLayer(point.getString("label"), x-25, y-17, 50, 26f, bg, 1))
          }
          val route = scene.getString("kind") == "route"
          for (localFrame in 0 until count) {
            checkCanceled()
            draw(canvas, paint, image, route, routePoints, title, caption, gradient, bg, accent, localFrame.toFloat() / max(1, count - 1), width, height)
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
            if (frame % fps == 0) progress(frame.toDouble() / totalFrames)
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
      muxer.release(); bitmap.recycle()
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

  private data class RoutePoint(val x: Float, val y: Float, val label: TextLayer)

  /** Text shaping and line layout are scene-invariant; only opacity changes per frame. */
  private class TextLayer(text: String, private val x: Float, private val y: Float, width: Int, size: Float, color: Int, lines: Int) {
    private val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
      textSize = size; this.color = color; typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    }
    private val layout = StaticLayout.Builder.obtain(text, 0, text.length, paint, width)
      .setAlignment(Layout.Alignment.ALIGN_CENTER).setMaxLines(lines).setIncludePad(false).build()
    fun draw(canvas: Canvas, alpha: Float = 1f) {
      paint.alpha = (alpha*255).toInt()
      canvas.save(); canvas.translate(x, y); layout.draw(canvas); canvas.restore()
    }
  }

  private fun draw(canvas: Canvas, paint: Paint, image: Bitmap?, route: Boolean, points: List<RoutePoint>, title: TextLayer, caption: TextLayer, gradient: LinearGradient, bg: Int, accent: Int, fraction: Float, width: Int, height: Int) {
    canvas.drawColor(bg); paint.shader = null; paint.alpha = 255
    if (route && image != null) {
      canvas.drawBitmap(image, null, RectF(0f, height*.1f, width.toFloat(), height*.1f+width), paint)
    } else if (image != null) {
      val scale = max(width.toFloat() / image.width, height.toFloat() / image.height) * (1 + fraction * .06f)
      val w = image.width * scale; val h = image.height * scale
      canvas.drawBitmap(image, null, RectF((width-w)/2, (height-h)/2, (width+w)/2, (height+h)/2), paint)
    }
    if (route) {
      val distance = fraction * max(0, points.size - 1)
      paint.color = accent; paint.strokeWidth = 6f
      for (i in 1 until points.size) {
        val a = points[i-1]; val b = points[i]
        val amount = min(1f, max(0f, distance - (i - 1)))
        canvas.drawLine(a.x, a.y, a.x + (b.x - a.x)*amount, a.y + (b.y - a.y)*amount, paint)
      }
      for (point in points) {
        paint.color = accent; canvas.drawCircle(point.x, point.y, 22f, paint)
        point.label.draw(canvas)
      }
    }
    if (!route) {
      paint.shader = gradient
      canvas.drawRect(0f, height*.55f, width.toFloat(), height.toFloat(), paint); paint.shader = null
    }
    val alpha = min(1f, fraction * 8 + .2f)
    title.draw(canvas, alpha); caption.draw(canvas, alpha)
  }
}
