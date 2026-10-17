/**
 * @file YeoloCourseBackgroundModule.kt
 * @description Expo execution lease bridge for the authenticated shared course request.
 */
package expo.modules.yeolocoursebackground

import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class YeoloCourseBackgroundModule : Module() {
  private var currentJobId: String? = null

  override fun definition() = ModuleDefinition {
    Name("YeoloCourseBackground")
    Events("onExpired")
    AsyncFunction("startAsync") { id: String, title: String, message: String, channel: String, promise: Promise ->
      try {
        val context = requireNotNull(appContext.reactContext)
        check(appContext.currentActivity?.hasWindowFocus() == true) { "Start course creation while the app is visible." }
        currentJobId = id
        CourseBackgroundService.begin(context, id, title, message, channel, { error ->
          if (error == null) {
            currentJobId = id
            // Foreground execution does not require notification permission; keep the service without prompting.
            promise.resolve("foreground-service")
          }
          else { currentJobId = null; promise.reject("ERR_COURSE_BACKGROUND_START", "Could not start background course generation.", error) }
        }, { job -> sendEvent("onExpired", mapOf("jobId" to job)) })
      } catch (error: Throwable) { currentJobId = null; promise.reject("ERR_COURSE_BACKGROUND_START", "Could not start background course generation.", error) }
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("updateAsync") { id: String, message: String, completed: Int, total: Int ->
      CourseBackgroundService.update(id, message, completed, total)
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("finishAsync") { id: String, _: Boolean ->
      CourseBackgroundService.finish(id)
      if (currentJobId == id) currentJobId = null
    }.runOnQueue(Queues.MAIN)
    OnDestroy {
      val id = currentJobId
      currentJobId = null
      if (id != null) android.os.Handler(android.os.Looper.getMainLooper()).post { CourseBackgroundService.finish(id) }
    }
  }
}
