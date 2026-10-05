/**
 * @file CourseBackgroundVerification.kt
 * @description Device verification of a real delayed SSE response across Home navigation with foreground execution and notification cleanup.
 */
package expo.modules.yeolocoursebackground

import android.app.Activity
import android.app.ActivityManager
import android.app.Instrumentation
import android.app.NotificationManager
import android.content.Intent
import android.os.Bundle
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class CourseBackgroundVerificationActivity : Activity()

class CourseBackgroundVerification : Instrumentation() {
  override fun onCreate(arguments: Bundle?) { super.onCreate(arguments); start() }
  override fun onStart() {
    val result = Bundle()
    var activity: Activity? = null
    val id = "background-device-verification"
    try {
      activity = startActivitySync(Intent(targetContext, CourseBackgroundVerificationActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      val started = CountDownLatch(1)
      var startError: Throwable? = null
      var expired = false
      runOnMainSync {
        CourseBackgroundService.begin(targetContext, id, "Course verification", "Waiting for SSE", "Course verification",
          { error -> startError = error; started.countDown() }, { expired = true })
      }
      check(started.await(7, TimeUnit.SECONDS)) { "Service startup timed out" }
      startError?.let { throw it }
      val notifications = targetContext.getSystemService(NotificationManager::class.java)
      repeat(20) { if (notifications.activeNotifications.none { it.id == 47322 }) Thread.sleep(50) }
      check(notifications.activeNotifications.any { it.id == 47322 }) { "Foreground notification missing" }
      val connection = URL("http://127.0.0.1:18088/api/courses").openConnection() as HttpURLConnection
      connection.requestMethod = "POST"
      connection.connectTimeout = 5000; connection.readTimeout = 30000
      connection.doOutput = true
      connection.setRequestProperty("Content-Type", "application/json")
      connection.outputStream.use { it.write("{}".toByteArray()) }
      check(connection.responseCode == 200)
      val reader = connection.inputStream.bufferedReader()
      check(reader.readLine() == "event: progress")
      val backgroundStart = System.currentTimeMillis()
      runOnMainSync { check(activity.moveTaskToBack(true)) }
      val process = ActivityManager.RunningAppProcessInfo()
      ActivityManager.getMyMemoryState(process)
      check(process.importance <= ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND_SERVICE)
      val response = reader.use { it.readText() }
      connection.disconnect()
      check(response.contains("device-course-complete")) { "SSE completion missing after backgrounding" }
      check(System.currentTimeMillis() - backgroundStart >= 12000) { "Fixture did not span the background period" }
      check(!expired)
      runOnMainSync { CourseBackgroundService.finish("unrelated-job") }
      check(notifications.activeNotifications.any { it.id == 47322 })
      runOnMainSync { CourseBackgroundService.finish(id) }
      repeat(20) { if (notifications.activeNotifications.any { it.id == 47322 }) Thread.sleep(50) }
      check(notifications.activeNotifications.none { it.id == 47322 }) { "Notification leaked after completion" }
      result.putString("result", JSONObject().apply {
        put("passed", true); put("backgroundSSE", true); put("notificationCleanup", true)
        put("elapsedMs", System.currentTimeMillis() - backgroundStart); put("importance", process.importance)
      }.toString())
      finish(Activity.RESULT_OK, result)
    } catch (error: Throwable) {
      result.putString("error", error.stackTraceToString())
      finish(Activity.RESULT_CANCELED, result)
    } finally {
      runOnMainSync { CourseBackgroundService.finish(id); activity?.finish() }
    }
  }
}
