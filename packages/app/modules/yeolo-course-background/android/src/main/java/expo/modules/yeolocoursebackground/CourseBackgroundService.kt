/**
 * @file CourseBackgroundService.kt
 * @description Keeps the course request process foreground until terminal completion, failure or system timeout.
 */
package expo.modules.yeolocoursebackground

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

class CourseBackgroundService : Service() {
  private var title = ""

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val id = intent?.getStringExtra("jobId")
    if (id == null || id != jobId) { stopSelf(startId); return START_NOT_STICKY }
    instance = this
    title = intent.getStringExtra("title") ?: ""
    val message = intent.getStringExtra("message") ?: ""
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        getSystemService(NotificationManager::class.java).createNotificationChannel(
          NotificationChannel(CHANNEL, intent.getStringExtra("channel"), NotificationManager.IMPORTANCE_LOW)
        )
      }
      ServiceCompat.startForeground(this, NOTIFICATION, notification(message, 0, 2),
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC else 0)
      notifyStarted(null)
    } catch (error: Throwable) {
      notifyStarted(error)
      finish(id)
    }
    return START_NOT_STICKY
  }

  private fun notification(message: String, completed: Int, total: Int): android.app.Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val pendingIntent = launchIntent?.let {
      PendingIntent.getActivity(this, 47322, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }
    return NotificationCompat.Builder(this, CHANNEL)
      .setSmallIcon(android.R.drawable.ic_menu_compass)
      .setContentTitle(title).setContentText(message).setOngoing(true)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .setOnlyAlertOnce(true).setPriority(NotificationCompat.PRIORITY_LOW)
      .setProgress(total, completed, completed == 0).setContentIntent(pendingIntent).build()
  }

  override fun onTimeout(startId: Int, fgsType: Int) { expire() }

  override fun onDestroy() {
    if (instance === this) expire()
    super.onDestroy()
  }

  companion object {
    private const val CHANNEL = "yeolo-course-generation"
    private const val NOTIFICATION = 47322
    private val handler = Handler(Looper.getMainLooper())
    private var instance: CourseBackgroundService? = null
    private var jobId: String? = null
    private var ready: ((Throwable?) -> Unit)? = null
    private var expired: ((String) -> Unit)? = null
    private var startupTimeout: Runnable? = null

    /** Acquires the foreground service before the JS bridge is allowed to send the request. Main thread only. */
    fun begin(context: Context, id: String, title: String, message: String, channel: String,
      onReady: (Throwable?) -> Unit, onExpired: (String) -> Unit) {
      check(jobId == null) { "A course request is already running." }
      jobId = id; ready = onReady; expired = onExpired
      startupTimeout = Runnable {
        if (jobId == id && ready != null) {
          notifyStarted(IllegalStateException("Foreground service did not start."))
          finish(id)
          context.stopService(Intent(context, CourseBackgroundService::class.java))
        }
      }.also { handler.postDelayed(it, 5000) }
      try {
        ContextCompat.startForegroundService(context, Intent(context, CourseBackgroundService::class.java).apply {
          putExtra("jobId", id); putExtra("title", title); putExtra("message", message); putExtra("channel", channel)
        })
      } catch (error: Throwable) { notifyStarted(error); finish(id) }
    }

    fun update(id: String, message: String, completed: Int, total: Int) {
      if (jobId != id) return
      instance?.let { service ->
        service.getSystemService(NotificationManager::class.java).notify(NOTIFICATION,
          service.notification(message, completed.coerceIn(0, total.coerceAtLeast(1)), total.coerceAtLeast(1)))
      }
    }

    fun finish(id: String) {
      if (jobId != id) return
      startupTimeout?.let { handler.removeCallbacks(it) }; startupTimeout = null
      val service = instance
      instance = null; jobId = null; ready = null; expired = null
      service?.let { ServiceCompat.stopForeground(it, ServiceCompat.STOP_FOREGROUND_REMOVE); it.stopSelf() }
    }

    private fun notifyStarted(error: Throwable?) {
      startupTimeout?.let { handler.removeCallbacks(it) }; startupTimeout = null
      val callback = ready; ready = null
      callback?.invoke(error)
    }

    private fun expire() {
      val id = jobId ?: return
      val callback = expired
      notifyStarted(IllegalStateException("Background execution ended."))
      finish(id)
      callback?.invoke(id)
    }
  }
}
