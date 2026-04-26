package com.itay.callcollector

import android.content.Context

class FileFingerprintStore(context: Context) {
    private val prefs = context.getSharedPreferences("file_fingerprints", Context.MODE_PRIVATE)

    fun exists(fingerprint: String): Boolean = prefs.contains(fingerprint)

    fun save(fingerprint: String) {
        prefs.edit().putLong(fingerprint, System.currentTimeMillis()).apply()
    }
}
