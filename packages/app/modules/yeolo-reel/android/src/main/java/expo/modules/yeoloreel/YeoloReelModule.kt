/**
 * @file YeoloReelModule.kt
 * @description Expo reel bridge with cancellation, private FileProvider sharing and MediaStore video saving.
 */
package expo.modules.yeoloreel

import android.content.ClipData
import android.content.ContentValues
import android.content.Intent
import android.app.Activity
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.view.View
import android.view.ViewGroup
import android.graphics.Bitmap
import com.google.android.gms.maps.MapView
import com.google.android.gms.maps.model.LatLng
import org.json.JSONArray
import androidx.core.content.FileProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.Promise
import java.io.File
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

class ReelFileProvider : FileProvider()

class YeoloReelModule : Module() {
  private val running = AtomicBoolean(false)
  private val canceled = AtomicBoolean(false)
  private var pendingSave: Pair<File, Promise>? = null
  private val context get() = requireNotNull(appContext.reactContext)
  private val directory get() = File(context.cacheDir, "yeolo-reels").apply { mkdirs() }

  override fun definition() = ModuleDefinition {
    Name("YeoloReel")
    Events("onProgress")
    Function("cancel") { canceled.set(true) }
    AsyncFunction("captureMapAsync") { tag: Int, json: String, promise: Promise ->
      val view = requireNotNull(appContext.findView<View>(tag))
      val mapView = requireNotNull(findGoogleMap(view))
      val coordinates = JSONArray(json)
      val done = AtomicBoolean(false)
      val handler = Handler(Looper.getMainLooper())
      val timeout = Runnable { if (done.compareAndSet(false, true)) promise.reject("ERR_REEL_MAP", "Could not capture the map.", null) }
      handler.postDelayed(timeout, 15000)
      mapView.getMapAsync { map ->
        if (!done.get()) map.snapshot { bitmap ->
          if (!done.compareAndSet(false, true)) { bitmap?.recycle(); return@snapshot }
          handler.removeCallbacks(timeout)
          val file = File(directory, "map-${UUID.randomUUID()}.png")
          try {
            requireNotNull(bitmap)
            require(mapView.width > 0 && mapView.height > 0)
            val points = (0 until coordinates.length()).map { i ->
              val p = coordinates.getJSONObject(i)
              val point = map.projection.toScreenLocation(LatLng(p.getDouble("latitude"), p.getDouble("longitude")))
              mapOf("x" to point.x.toDouble()/mapView.width, "y" to .1 + point.y.toDouble()/mapView.height*720/1280, "label" to p.getString("label"))
            }
            file.outputStream().use { check(bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)) }
            promise.resolve(mapOf("uri" to Uri.fromFile(file).toString(), "points" to points))
          } catch (e: Throwable) { file.delete(); promise.reject("ERR_REEL_MAP", "Could not capture the map.", e) }
          finally { bitmap?.recycle() }
        }
      }
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("generateAsync") { json: String, jobId: String ->
      check(running.compareAndSet(false, true)) { "A reel is already being created." }
      canceled.set(false)
      val file = File(directory, "${UUID.randomUUID()}.mp4")
      try {
        directory.listFiles()?.filter { it.lastModified() < System.currentTimeMillis() - 86_400_000 }?.forEach { it.delete() }
        ReelRenderer(context).render(json, file, { canceled.get() }, { sendEvent("onProgress", mapOf("jobId" to jobId, "progress" to it)) })
        Uri.fromFile(file).toString()
      } catch (e: Throwable) { file.delete(); throw e }
      finally { running.set(false) }
    }
    AsyncFunction("deleteAsync") { uri: String -> ownedFile(uri, allowMap = true).delete(); Unit }
    AsyncFunction("previewAsync") { uri: String ->
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(contentUri(ownedFile(uri)), "video/mp4")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      requireNotNull(appContext.currentActivity).startActivity(intent)
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("shareAsync") { uri: String ->
      // Keep a separate copy alive while the selected external app reads the video.
      val copy = File(directory, "share-${UUID.randomUUID()}.mp4")
      ownedFile(uri).copyTo(copy)
      val content = contentUri(copy)
      val intent = Intent(Intent.ACTION_SEND).apply {
        type = "video/mp4"; putExtra(Intent.EXTRA_STREAM, content)
        clipData = ClipData.newRawUri("video", content)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      requireNotNull(appContext.currentActivity).startActivity(Intent.createChooser(intent, null))
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("saveAsync") { uri: String, promise: Promise ->
      val file = ownedFile(uri)
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        // Older Android versions use the system file picker instead of broad storage permission.
        val copy = File(directory, "save-${UUID.randomUUID()}.mp4")
        file.copyTo(copy)
        Handler(Looper.getMainLooper()).post {
          try {
            check(pendingSave == null)
            pendingSave = copy to promise
            val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
              addCategory(Intent.CATEGORY_OPENABLE); type = "video/mp4"
              putExtra(Intent.EXTRA_TITLE, "Yeolo-${System.currentTimeMillis()}.mp4")
            }
            requireNotNull(appContext.currentActivity).startActivityForResult(intent, 47321)
          } catch (e: Throwable) { pendingSave = null; copy.delete(); promise.reject("ERR_REEL_SAVE", "Could not open the file picker.", e) }
        }
        return@AsyncFunction
      }
      // Scoped storage saves the generated video without asking to read the user's library.
      val values = ContentValues().apply {
        put(MediaStore.Video.Media.DISPLAY_NAME, "Yeolo-${System.currentTimeMillis()}.mp4")
        put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
        put(MediaStore.Video.Media.RELATIVE_PATH, "${Environment.DIRECTORY_MOVIES}/Yeolo")
        put(MediaStore.Video.Media.IS_PENDING, 1)
      }
      val resolver = context.contentResolver
      val item = requireNotNull(resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values))
      try {
        requireNotNull(resolver.openOutputStream(item)).use { out -> file.inputStream().use { it.copyTo(out) } }
        values.clear(); values.put(MediaStore.Video.Media.IS_PENDING, 0)
        check(resolver.update(item, values, null, null) == 1)
        promise.resolve(true)
      } catch (e: Throwable) { resolver.delete(item, null, null); promise.reject("ERR_REEL_SAVE", "Could not save the video.", e) }
    }
    OnActivityResult { _, payload ->
      if (payload.requestCode == 47321) {
        val pending = pendingSave
        pendingSave = null
        if (pending != null) {
          val destination = payload.data?.data
          if (payload.resultCode != Activity.RESULT_OK || destination == null) {
            pending.first.delete(); pending.second.resolve(false)
          } else Thread {
            try {
              requireNotNull(context.contentResolver.openOutputStream(destination)).use { out -> pending.first.inputStream().use { it.copyTo(out) } }
              pending.second.resolve(true)
            } catch (e: Throwable) { pending.second.reject("ERR_REEL_SAVE", "Could not save the video.", e) }
            finally { pending.first.delete() }
          }.start()
        }
      }
    }
  }
  private fun findGoogleMap(view: View): MapView? {
    if (view is MapView) return view
    if (view is ViewGroup) for (i in 0 until view.childCount) findGoogleMap(view.getChildAt(i))?.let { return it }
    return null
  }
  private fun ownedFile(value: String, allowMap: Boolean = false): File {
    val uri = Uri.parse(value); require(uri.scheme == "file")
    val file = File(requireNotNull(uri.path)).canonicalFile
    require(file.parentFile == directory.canonicalFile && (file.extension == "mp4" || (allowMap && file.extension == "png" && file.name.startsWith("map-"))) && file.exists())
    return file
  }
  private fun contentUri(file: File): Uri = FileProvider.getUriForFile(context, "${context.packageName}.yeoloreel.files", file)
}
