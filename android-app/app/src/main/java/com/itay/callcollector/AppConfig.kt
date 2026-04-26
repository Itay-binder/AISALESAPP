package com.itay.callcollector

object AppConfig {
    // Replace with your Cloud Run base URL.
    const val BACKEND_BASE_URL = "https://your-cloud-run-url.a.run.app"

    // Samsung default location often includes this folder name.
    val RECORDING_HINTS = listOf("Call", "record", "Recordings")

    const val FILE_STABILITY_WAIT_MS = 15_000L
    const val WORK_NAME_SCAN = "recording-scan-work"
}
