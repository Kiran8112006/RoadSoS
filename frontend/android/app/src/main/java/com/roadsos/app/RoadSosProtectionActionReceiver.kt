package com.roadsos.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class RoadSosProtectionActionReceiver : BroadcastReceiver() {
  override fun onReceive(
    context: Context,
    intent: Intent
  ) {
    val serviceIntent = Intent(
      context,
      RoadSosProtectionService::class.java
    ).apply {
      action = intent.action
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(serviceIntent)
    } else {
      context.startService(serviceIntent)
    }
  }
}
