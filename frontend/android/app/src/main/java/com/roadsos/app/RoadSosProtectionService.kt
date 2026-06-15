package com.roadsos.app

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.provider.Settings
import android.net.Uri as AndroidUri
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.media.AudioAttributes
import android.media.MediaPlayer
// Duplicate Uri import removed
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

class RoadSosProtectionService :
  Service(),
  SensorEventListener,
  LocationListener {

  private lateinit var sensorManager: SensorManager
  private lateinit var locationManager: LocationManager
  private val handler = Handler(Looper.getMainLooper())

  private var mediaPlayer: MediaPlayer? = null
  private var wakeLock: PowerManager.WakeLock? = null

  private var accelG = 0.0
  private var gyroMagnitude = 0.0
  private var speedKmh = 0.0
  private var previousSpeedKmh = 0.0
  private var previousSpeedTime = 0L
  private var lastLocation: Location? = null
  private var lastLocationUpdateAt = 0L
  private var suspiciousEvent: SuspiciousEvent? = null
  private var isForeground = false
  private var crashAlertActive = false

  private val validationRunnable = object : Runnable {
    override fun run() {
      validateSuspiciousEvent()
      handler.postDelayed(this, 1000)
    }
  }

  private val heartbeatRunnable = object : Runnable {
    override fun run() {
      android.util.Log.d(
        "RoadSoSProtection",
        "Heartbeat active speed=$speedKmh accel=$accelG gyro=$gyroMagnitude hasLocation=${lastLocation != null} locationAgeMs=${locationAgeMs()}"
      )

      handler.postDelayed(this, 1000)
    }
  }

  override fun onCreate() {
    android.util.Log.d("RoadSoSProtection", "onCreate called")
    super.onCreate()

    sensorManager =
      getSystemService(Context.SENSOR_SERVICE) as SensorManager

    locationManager =
      getSystemService(Context.LOCATION_SERVICE) as LocationManager

    createNotificationChannels()
  }

  override fun onStartCommand(
    intent: Intent?,
    flags: Int,
    startId: Int
): Int {
    android.util.Log.d("RoadSoSProtection", "onStartCommand action=" + intent?.action)
    when (intent?.action) {
        ACTION_STOP -> {
            crashAlertActive = false
            stopProtection()
            return START_NOT_STICKY
        }
        ACTION_SAFE -> {
            dismissCrashAlertAndResume()
            return START_STICKY
        }
        ACTION_HELP -> {
            ensureForeground()
            if (!crashAlertActive) {
                confirmCrash("Manual help requested", 100.0)
            }
            return START_STICKY
        }
        else -> startProtection()
    }
    return START_STICKY
}

  override fun onTaskRemoved(rootIntent: Intent?) {
    // Restart the service if it's killed by the system (e.g., task removal)
    val restartIntent = Intent(this, RoadSosProtectionService::class.java).apply {
      action = ACTION_START
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      startForegroundService(restartIntent)
    } else {
      startService(restartIntent)
    }
    super.onTaskRemoved(rootIntent)
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onDestroy() {
    stopSensors()
    stopLocation()
    stopAlarm()
    releaseWakeLock()
    handler.removeCallbacks(validationRunnable)
    handler.removeCallbacks(heartbeatRunnable)
    super.onDestroy()
  }

  override fun onAccuracyChanged(
    sensor: Sensor?,
    accuracy: Int
  ) = Unit

  override fun onSensorChanged(event: SensorEvent) {
    when (event.sensor.type) {
      Sensor.TYPE_ACCELEROMETER -> {
        accelG =
          sqrt(
            (
              event.values[0] * event.values[0] +
                event.values[1] * event.values[1] +
                event.values[2] * event.values[2]
              ).toDouble()
          ) / SensorManager.GRAVITY_EARTH
      }

      Sensor.TYPE_GYROSCOPE -> {
        gyroMagnitude =
          sqrt(
            (
              event.values[0] * event.values[0] +
                event.values[1] * event.values[1] +
                event.values[2] * event.values[2]
              ).toDouble()
          )
      }
    }

    evaluateForSuspiciousEvent()
    updateValidationMovementState()
  }

  override fun onLocationChanged(location: Location) {
    val now = System.currentTimeMillis()
    val locationSpeedKmh =
      max(0.0, location.speed.toDouble() * 3.6)

    if (previousSpeedTime == 0L) {
      previousSpeedTime = now
    }

    previousSpeedKmh = speedKmh
    speedKmh = locationSpeedKmh
    previousSpeedTime = now
    lastLocationUpdateAt = now

    suspiciousEvent?.let { event ->
      val movedDistance =
        lastLocation?.distanceTo(location)?.toDouble() ?: 0.0

      val accurateMovement =
        location.accuracy <= GPS_MOVING_ACCURACY_METERS &&
          movedDistance > GPS_MOVING_DISTANCE_METERS

      if (speedKmh > GPS_MOVING_SPEED_KMH || accurateMovement) {
        android.util.Log.d(
          "RoadSoSProtection",
          "GPS movement detected speed=$speedKmh distance=$movedDistance accuracy=${location.accuracy}"
        )

        event.gpsContinuedMoving = true
      }
    }

    lastLocation = location
    android.util.Log.d(
      "RoadSoSProtection",
      "Location update lat=${location.latitude} lon=${location.longitude} speed=$speedKmh accuracy=${location.accuracy}"
    )

    evaluateForSuspiciousEvent()
  }

  override fun onProviderEnabled(provider: String) = Unit
  override fun onProviderDisabled(provider: String) = Unit
  override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit

  private fun startProtection() {
    // Ensure we have permission to ignore battery optimizations for continuous monitoring
    requestIgnoreBatteryOptimizations()
    // Acquire a partial wake lock to keep CPU active while protection is running
    acquirePartialWakeLock()
    crashAlertActive = false
    suspiciousEvent = null
    accelG = 1.0
    gyroMagnitude = 0.0
    speedKmh = 0.0
    previousSpeedKmh = 0.0
    previousSpeedTime = 0L
    ensureForeground()
    startSensors()
    startLocation()
    handler.removeCallbacks(validationRunnable)
    handler.post(validationRunnable)
    handler.removeCallbacks(heartbeatRunnable)
    handler.post(heartbeatRunnable)
  }

  private fun ensureForeground() {
    android.util.Log.d("RoadSoSProtection", "ensureForeground called, isForeground=$isForeground")
    if (isForeground) {
      return
    }

    android.util.Log.d("RoadSoSProtection", "Calling startForeground with id=" + PROTECTION_NOTIFICATION_ID)
    startForeground(PROTECTION_NOTIFICATION_ID, buildProtectionNotification())
    android.util.Log.d("RoadSoSProtection", "startForeground completed for id=" + PROTECTION_NOTIFICATION_ID)

    isForeground = true
  }

  private fun stopProtection() {
    // Release the partial wake lock when protection stops
    releasePartialWakeLock()
    NotificationManagerCompat.from(this).cancel(CRASH_NOTIFICATION_ID)
    stopSelf()
  }

  private fun dismissCrashAlertAndResume() {
    NotificationManagerCompat.from(this).cancel(CRASH_NOTIFICATION_ID)
    stopAlarm()
    releaseWakeLock()
    crashAlertActive = false
    suspiciousEvent = null

    android.util.Log.d(
      "RoadSoSProtection",
      "Crash alert dismissed as safe; monitoring resumed"
    )

    startProtection()
  }

  private fun pauseMonitoringAfterCrash() {
    stopSensors()
    stopLocation()
    handler.removeCallbacks(validationRunnable)
    handler.removeCallbacks(heartbeatRunnable)
    suspiciousEvent = null

    android.util.Log.d(
      "RoadSoSProtection",
      "Monitoring paused while crash alert is active"
    )
  }

  private fun startSensors() {
    android.util.Log.d(
      "RoadSoSProtection",
      "Starting native accelerometer and gyroscope"
    )

    sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.also {
      sensorManager.registerListener(
        this,
        it,
        SensorManager.SENSOR_DELAY_GAME
      )
    }

    sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)?.also {
      sensorManager.registerListener(
        this,
        it,
        SensorManager.SENSOR_DELAY_GAME
      )
    }
  }

  private fun stopSensors() {
    sensorManager.unregisterListener(this)
  }

  private fun startLocation() {
    if (
      ActivityCompat.checkSelfPermission(
        this,
        Manifest.permission.ACCESS_FINE_LOCATION
      ) != PackageManager.PERMISSION_GRANTED
    ) {
      android.util.Log.d(
        "RoadSoSProtection",
        "Fine location permission missing; background location cannot start"
      )

      return
    }

    android.util.Log.d(
      "RoadSoSProtection",
      "Starting native location updates gps=${locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)} network=${locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)}"
    )

    if (
      locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
    ) {
      locationManager.requestLocationUpdates(
        LocationManager.GPS_PROVIDER,
        1000L,
        0f,
        this
      )
    }

    if (
      locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    ) {
      locationManager.requestLocationUpdates(
        LocationManager.NETWORK_PROVIDER,
        1000L,
        0f,
        this
      )
    }
  }

  private fun stopLocation() {
    locationManager.removeUpdates(this)
  }

  private fun evaluateForSuspiciousEvent() {
    if (crashAlertActive) {
      return
    }

    if (suspiciousEvent != null) {
      return
    }

    val deceleration =
      max(0.0, previousSpeedKmh - speedKmh)

    val sensorRisk =
      when {
        accelG > TEST_ACCEL_HIGH_G -> 90.0
        accelG > TEST_ACCEL_MEDIUM_G -> 70.0
        accelG > TEST_ACCEL_LOW_G -> 45.0
        else -> 0.0
      } + when {
        gyroMagnitude > TEST_GYRO_HIGH -> 35.0
        gyroMagnitude > TEST_GYRO_LOW -> 20.0
        else -> 0.0
      }

    val speedRisk =
      when {
        speedKmh > TEST_SPEED_HIGH_KMH -> 30.0
        speedKmh > TEST_SPEED_LOW_KMH -> 15.0
        else -> 0.0
      }

    val decelRisk =
      when {
        deceleration > TEST_DECEL_HIGH -> 35.0
        deceleration > TEST_DECEL_LOW -> 20.0
        else -> 0.0
      }

    val risk = min(100.0, sensorRisk + speedRisk + decelRisk)

    if (risk > SUSPICIOUS_RISK_THRESHOLD) {
      android.util.Log.d(
        "RoadSoSProtection",
        "Suspicious event created risk=$risk speed=$speedKmh accel=$accelG gyro=$gyroMagnitude"
      )

      suspiciousEvent = SuspiciousEvent(
        startedAt = System.currentTimeMillis(),
        initialRisk = risk,
        initialSpeedKmh = speedKmh,
        initialAccelG = accelG,
        initialGyro = gyroMagnitude,
        latitude = lastLocation?.latitude,
        longitude = lastLocation?.longitude
      )
    }
  }

  private fun updateValidationMovementState() {
    suspiciousEvent?.let { event ->
      val ageMs = System.currentTimeMillis() - event.startedAt

      if (ageMs < SENSOR_SETTLE_MS) {
        return
      }

      val sensorStill =
        accelG < STILL_ACCEL_G &&
          gyroMagnitude < STILL_GYRO_RADIANS

      if (!sensorStill) {
        event.sensorContinuedMoving = true
      }
    }
  }

  private fun validateSuspiciousEvent() {
    if (crashAlertActive) {
      return
    }

    val event = suspiciousEvent ?: return
    val ageMs = System.currentTimeMillis() - event.startedAt

    if (event.gpsContinuedMoving) {
      android.util.Log.d(
        "RoadSoSProtection",
        "Suspicious event cancelled: GPS continued moving"
      )

      suspiciousEvent = null
      return
    }

    if (event.sensorContinuedMoving && ageMs > MIN_VALIDATION_MS) {
      android.util.Log.d(
        "RoadSoSProtection",
        "Suspicious event cancelled: sensor movement continued"
      )

      suspiciousEvent = null
      return
    }

    if (ageMs < MIN_VALIDATION_MS) {
      return
    }

    val gpsStill =
      speedKmh < GPS_STOPPED_SPEED_KMH

    val sensorStill =
      accelG < STILL_ACCEL_G &&
        gyroMagnitude < STILL_GYRO_RADIANS

    val gpsConfidence =
      if (gpsStill) 20.0 else -40.0

    val sensorConfidence =
      if (sensorStill) 20.0 else -40.0

    val confidence =
      event.initialRisk +
        gpsConfidence +
        sensorConfidence

    if (gpsStill && sensorStill && confidence >= CRASH_CONFIDENCE_THRESHOLD) {
      android.util.Log.d(
        "RoadSoSProtection",
        "Crash confirmed confidence=$confidence"
      )

      confirmCrash(
        "Impact followed by GPS stop and sensor inactivity",
        min(100.0, confidence)
      )
      suspiciousEvent = null
      return
    }

    if (ageMs >= MAX_VALIDATION_MS) {
      suspiciousEvent = null
    }
  }

  private fun confirmCrash(
    reason: String,
    confidence: Double
  ) {
    if (crashAlertActive) {
      android.util.Log.d(
        "RoadSoSProtection",
        "Crash confirmation ignored because alert is already active"
      )

      return
    }

    crashAlertActive = true

    val latitude = lastLocation?.latitude ?: suspiciousEvent?.latitude
    val longitude = lastLocation?.longitude ?: suspiciousEvent?.longitude

    pauseMonitoringAfterCrash()
    acquireWakeLock()
    startAlarm()
    showCrashNotification(latitude, longitude, confidence)

    RoadSosProtectionEventBus.emitCrashConfirmed(
      latitude,
      longitude,
      confidence,
      reason
    )
  }

  private fun buildProtectionNotification(): Notification {
    android.util.Log.d("RoadSoSProtection", "buildProtectionNotification called")
    val openIntent = Intent(
      this,
      MainActivity::class.java
    )

    val openPendingIntent = PendingIntent.getActivity(
      this,
      0,
      openIntent,
      pendingIntentFlags()
    )

    return NotificationCompat.Builder(
      this,
      PROTECTION_CHANNEL_ID
    )
      .setSmallIcon(android.R.drawable.ic_dialog_map)
      .setContentTitle("RoadSoS protection active")
      .setContentText("Crash detection is running in the background.")
      .setOngoing(true)
      .setContentIntent(openPendingIntent)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
  }

  private fun showCrashNotification(
    latitude: Double?,
    longitude: Double?,
    confidence: Double
  ) {
    val uriBuilder =
      AndroidUri.parse("roadsos:///emergency")
        .buildUpon()
        .appendQueryParameter("nativeCrash", "true")
        .appendQueryParameter("confidence", confidence.toString())

    if (latitude != null && longitude != null) {
      uriBuilder
        .appendQueryParameter("latitude", latitude.toString())
        .appendQueryParameter("longitude", longitude.toString())
    }

    val emergencyIntent = Intent(
      Intent.ACTION_VIEW,
      uriBuilder.build(),
      this,
      MainActivity::class.java
    ).apply {
      flags =
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP
    }

    val emergencyPendingIntent = PendingIntent.getActivity(
      this,
      1,
      emergencyIntent,
      pendingIntentFlags()
    )

    val safeIntent = Intent(
      this,
      RoadSosProtectionActionReceiver::class.java
    ).apply {
      action = ACTION_SAFE
    }

    val safePendingIntent = PendingIntent.getBroadcast(
      this,
      2,
      safeIntent,
      pendingIntentFlags()
    )

    val helpIntent = Intent(
      this,
      RoadSosProtectionActionReceiver::class.java
    ).apply {
      action = ACTION_HELP
    }

    val helpPendingIntent = PendingIntent.getBroadcast(
      this,
      3,
      helpIntent,
      pendingIntentFlags()
    )

    val notification =
      NotificationCompat.Builder(
        this,
        CRASH_CHANNEL_ID
      )
        .setSmallIcon(android.R.drawable.ic_dialog_alert)
        .setContentTitle("Crash detected")
        .setContentText("RoadSoS needs your response.")
        .setCategory(NotificationCompat.CATEGORY_ALARM)
        .setPriority(NotificationCompat.PRIORITY_MAX)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setAutoCancel(false)
        .setOngoing(true)
        .setFullScreenIntent(emergencyPendingIntent, true)
        .setContentIntent(emergencyPendingIntent)
        .addAction(0, "I AM SAFE", safePendingIntent)
        .addAction(0, "GET HELP", helpPendingIntent)
        .build()

    NotificationManagerCompat.from(this).notify(
      CRASH_NOTIFICATION_ID,
      notification
    )
  }

  private fun startAlarm() {
    vibrate()

    if (mediaPlayer != null) {
      return
    }

    val assetDescriptor =
      assets.openFd("sounds/alarm.mp3")

    mediaPlayer = MediaPlayer().apply {
      setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      )
      setDataSource(
        assetDescriptor.fileDescriptor,
        assetDescriptor.startOffset,
        assetDescriptor.length
      )
      isLooping = true
      prepare()
      start()
    }

    assetDescriptor.close()
  }

  private fun stopAlarm() {
    mediaPlayer?.stop()
    mediaPlayer?.release()
    mediaPlayer = null

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val manager =
        getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
      manager.defaultVibrator.cancel()
    } else {
      @Suppress("DEPRECATION")
      val vibrator =
        getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
      vibrator.cancel()
    }
  }

  private fun vibrate() {
    val pattern = longArrayOf(0, 800, 300, 800)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val manager =
        getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
      manager.defaultVibrator.vibrate(
        VibrationEffect.createWaveform(pattern, 0)
      )
    } else {
      @Suppress("DEPRECATION")
      val vibrator =
        getSystemService(Context.VIBRATOR_SERVICE) as Vibrator

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(
          VibrationEffect.createWaveform(pattern, 0)
        )
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(pattern, 0)
      }
    }
  }

  private fun acquireWakeLock() {
    if (wakeLock?.isHeld == true) {
      return
    }

    val powerManager =
      getSystemService(Context.POWER_SERVICE) as PowerManager

    wakeLock =
      powerManager.newWakeLock(
        PowerManager.SCREEN_BRIGHT_WAKE_LOCK or
          PowerManager.ACQUIRE_CAUSES_WAKEUP,
        "RoadSoS:CrashAlert"
      ).apply {
        acquire(60_000L)
      }
  }

  private fun releaseWakeLock() {
    if (wakeLock?.isHeld == true) {
      wakeLock?.release()
    }

    wakeLock = null
  }

  private var monitoringWakeLock: PowerManager.WakeLock? = null

  private fun acquirePartialWakeLock() {
    if (monitoringWakeLock?.isHeld == true) {
      return
    }
    val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
    monitoringWakeLock = powerManager.newWakeLock(
      PowerManager.PARTIAL_WAKE_LOCK,
      "RoadSoS:Protection"
    ).apply {
      acquire()
    }
  }

  private fun releasePartialWakeLock() {
    if (monitoringWakeLock?.isHeld == true) {
      monitoringWakeLock?.release()
    }
    monitoringWakeLock = null
  }

  private fun requestIgnoreBatteryOptimizations() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
      if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
        // Prompt user to disable battery optimizations for this app
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = AndroidUri.parse("package:$packageName")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(intent)
      }
    }
  }

  private fun locationAgeMs(): Long {
    if (lastLocationUpdateAt == 0L) {
      return -1L
    }

    return System.currentTimeMillis() - lastLocationUpdateAt
  }

  private fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val manager =
      getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    val protectionChannel = NotificationChannel(
      PROTECTION_CHANNEL_ID,
      "RoadSoS Protection",
      NotificationManager.IMPORTANCE_LOW
    )

    val crashChannel = NotificationChannel(
      CRASH_CHANNEL_ID,
      "RoadSoS Crash Alerts",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }

    manager.createNotificationChannel(protectionChannel)
    manager.createNotificationChannel(crashChannel)
  }

  private fun pendingIntentFlags(): Int {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    } else {
      PendingIntent.FLAG_UPDATE_CURRENT
    }
  }

  private data class SuspiciousEvent(
    val startedAt: Long,
    val initialRisk: Double,
    val initialSpeedKmh: Double,
    val initialAccelG: Double,
    val initialGyro: Double,
    val latitude: Double?,
    val longitude: Double?,
    var gpsContinuedMoving: Boolean = false,
    var sensorContinuedMoving: Boolean = false
  )

  companion object {
    const val ACTION_START = "com.roadsos.app.PROTECTION_START"
    const val ACTION_STOP = "com.roadsos.app.PROTECTION_STOP"
    const val ACTION_SAFE = "com.roadsos.app.PROTECTION_SAFE"
    const val ACTION_HELP = "com.roadsos.app.PROTECTION_HELP"

    private const val PROTECTION_CHANNEL_ID = "roadsos_protection"
    private const val CRASH_CHANNEL_ID = "roadsos_crash_alert"
    private const val PROTECTION_NOTIFICATION_ID = 4001
    private const val CRASH_NOTIFICATION_ID = 4002

    private const val SUSPICIOUS_RISK_THRESHOLD = 10.0
    private const val CRASH_CONFIDENCE_THRESHOLD = 25.0
    private const val SENSOR_SETTLE_MS = 2_000L
    private const val MIN_VALIDATION_MS = 5_000L
    private const val MAX_VALIDATION_MS = 15_000L
    private const val GPS_MOVING_SPEED_KMH = 5.0
    private const val GPS_STOPPED_SPEED_KMH = 2.0
    private const val GPS_MOVING_DISTANCE_METERS = 25.0
    private const val GPS_MOVING_ACCURACY_METERS = 25.0f
    private const val STILL_ACCEL_G = 1.6
    private const val STILL_GYRO_RADIANS = 0.6

    private const val TEST_SPEED_LOW_KMH = 5.0
    private const val TEST_SPEED_HIGH_KMH = 15.0
    private const val TEST_ACCEL_LOW_G = 1.4
    private const val TEST_ACCEL_MEDIUM_G = 1.8
    private const val TEST_ACCEL_HIGH_G = 2.4
    private const val TEST_GYRO_LOW = 0.8
    private const val TEST_GYRO_HIGH = 1.4
    private const val TEST_DECEL_LOW = 5.0
    private const val TEST_DECEL_HIGH = 10.0
  }
}
