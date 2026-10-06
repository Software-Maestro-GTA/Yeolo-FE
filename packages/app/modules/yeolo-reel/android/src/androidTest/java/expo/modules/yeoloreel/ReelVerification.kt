/**
 * @file ReelVerification.kt
 * @description Device instrumentation verifying actual MP4 dimensions, duration, decoded photo pixels and cancel cleanup.
 */
package expo.modules.yeoloreel

import android.app.Activity
import android.app.Instrumentation
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.media.MediaExtractor
import android.media.MediaMetadataRetriever
import android.os.Bundle
import android.net.Uri
import org.json.JSONObject
import java.io.File
import java.nio.ByteBuffer

class ReelVerification : Instrumentation() {
  override fun onCreate(arguments: Bundle?) { super.onCreate(arguments); start() }
  override fun onStart() {
    val result = Bundle()
    try {
      verifyYuvStrides()
      val dir = targetContext.cacheDir
      val photo = File(dir, "reel-test.jpg")
      val bitmap = Bitmap.createBitmap(900, 1400, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap); val paint = Paint()
      paint.color = Color.RED; canvas.drawRect(0f,0f,900f,700f,paint)
      paint.color = Color.BLUE; canvas.drawRect(0f,700f,900f,1400f,paint)
      photo.outputStream().use { bitmap.compress(Bitmap.CompressFormat.JPEG, 90, it) }; bitmap.recycle()
      val scene = JSONObject().apply {
        put("kind","photo"); put("uri",Uri.fromFile(photo).toString()); put("title","부산의 하루"); put("caption","우리의 여행을 오래 기억하기"); put("seconds",3); put("points",org.json.JSONArray())
      }
      val route = JSONObject("""{"kind":"route","uri":"","title":"오늘의 발자취","caption":"DAY 1","seconds":2,"points":[{"x":0.3,"y":0.35,"label":"1"},{"x":0.7,"y":0.55,"label":"2"}]}""")
      val mapFile = File(dir, "map-test.png")
      val mapBitmap = Bitmap.createBitmap(720, 720, Bitmap.Config.ARGB_8888)
      val mapCanvas = Canvas(mapBitmap)
      mapCanvas.drawColor(Color.GREEN)
      paint.color = Color.WHITE; mapCanvas.drawRect(0f,690f,720f,720f,paint)
      mapFile.outputStream().use { mapBitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }; mapBitmap.recycle()
      route.put("uri", Uri.fromFile(mapFile).toString())
      val plan = JSONObject().apply {
        put("width",720); put("height",1280); put("fps",24); put("backgroundColor","#0D2137"); put("accentColor","#F59E0B"); put("textColor","#FFFFFF")
        put("scenes",org.json.JSONArray().put(scene).put(route).put(scene))
      }
      val output = File(dir,"sample-reel.mp4")
      val start = System.nanoTime()
      ReelRenderer(targetContext).render(plan.toString(),output,{false},{})
      val retriever = MediaMetadataRetriever()
      retriever.setDataSource(output.absolutePath)
      val width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
      val height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
      val duration = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)!!.toInt()
      check(width == "720" && height == "1280" && duration in 7900..8100)
      val first = requireNotNull(retriever.getFrameAtTime(0,MediaMetadataRetriever.OPTION_CLOSEST))
      val rgb = first.getPixel(360,200)
      check(Color.red(rgb) > 150 && Color.blue(rgb) < 80)
      first.recycle()
      val mapFrame = requireNotNull(retriever.getFrameAtTime(3_500_000, MediaMetadataRetriever.OPTION_CLOSEST))
      val mapPixel = mapFrame.getPixel(360,200)
      check(Color.green(mapPixel) > 150 && Color.red(mapPixel) < 80)
      val strip = mapFrame.getPixel(360,830)
      check(Color.red(strip) > 230 && Color.green(strip) > 230 && Color.blue(strip) > 230)
      mapFrame.recycle(); retriever.release()
      val extractor = MediaExtractor(); extractor.setDataSource(output.absolutePath); extractor.selectTrack(0)
      val buffer = ByteBuffer.allocate(2_000_000); var frames = 0
      while (extractor.readSampleData(buffer,0) >= 0) { frames++; extractor.advance(); buffer.clear() }
      extractor.release(); check(frames == 192)
      val cancel = File(dir,"cancel-reel.mp4"); var canceled = false
      try { ReelRenderer(targetContext).render(plan.toString(),cancel,{true},{}) }
      catch (e: IllegalStateException) { canceled = e.message == "REEL_CANCELED" && !cancel.exists() }
      check(canceled)
      result.putString("result",JSONObject().apply { put("passed",true); put("mapBackground",true); put("attributionStrip",true); put("width",width); put("height",height); put("durationMs",duration); put("frames",frames); put("cancelCleanup",canceled); put("encodeSeconds",(System.nanoTime()-start)/1e9) }.toString())
      finish(Activity.RESULT_OK,result)
    } catch (e: Throwable) { result.putString("error",e.stackTraceToString()); finish(Activity.RESULT_CANCELED,result) }
  }

  /** Known color samples verify padded rows and shared UV storage without reproducing conversion formulas. */
  private fun verifyYuvStrides() {
    val writer = YuvFrameWriter(2, 2)
    val pixels = intArrayOf(Color.RED, Color.GREEN, Color.BLUE, Color.WHITE)
    val y = ByteBuffer.allocate(8).apply { for (i in 0 until capacity()) put(i, 7) }
    val u = ByteBuffer.allocate(2).apply { put(1, 7) }
    val v = ByteBuffer.allocate(2).apply { put(1, 7) }
    writer.write(pixels, YuvPlane(y, 4, 1), YuvPlane(u, 2, 1), YuvPlane(v, 2, 1))
    check(listOf(0, 1, 4, 5).map { y.get(it).toInt() and 255 } == listOf(82, 144, 41, 235))
    check(y.get(2).toInt() == 7 && y.get(6).toInt() == 7)
    check((u.get(0).toInt() and 255) == 90 && (v.get(0).toInt() and 255) == 240)
    check(u.get(1).toInt() == 7 && v.get(1).toInt() == 7)
    val uv = ByteBuffer.allocate(4).apply { put(2, 7); put(3, 7) }
    val vSlice = uv.duplicate().apply { position(1) }.slice()
    writer.write(pixels, YuvPlane(y, 4, 2), YuvPlane(uv, 4, 2), YuvPlane(vSlice, 4, 2))
    check((uv.get(0).toInt() and 255) == 90 && (uv.get(1).toInt() and 255) == 240)
    check(uv.get(2).toInt() == 7 && uv.get(3).toInt() == 7)
    check(listOf(0, 2, 4, 6).map { y.get(it).toInt() and 255 } == listOf(82, 144, 41, 235))
  }
}
