package com.itay.callcollector

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.File
import java.util.UUID

data class UploadTokenResponse(
    val callId: String,
    val token: String,
    val bucket: String
)

class BackendClient {
    private val http = OkHttpClient()
    private val jsonType = "application/json".toMediaType()

    fun requestUploadToken(agentId: String, fingerprint: String): UploadTokenResponse {
        val callId = UUID.randomUUID().toString()
        val payload = JSONObject()
            .put("callId", callId)
            .put("agentId", agentId)
            .put("recordingFingerprint", fingerprint)
            .toString()
            .toRequestBody(jsonType)

        val request = Request.Builder()
            .url("${AppConfig.BACKEND_BASE_URL}/v1/upload-token")
            .post(payload)
            .build()

        http.newCall(request).execute().use { response ->
            if (!response.isSuccessful) error("Token request failed: ${response.code}")
            val obj = JSONObject(response.body?.string().orEmpty())
            return UploadTokenResponse(
                callId = callId,
                token = obj.getString("uploadToken"),
                bucket = obj.getString("bucket")
            )
        }
    }

    /**
     * MVP placeholder: this notifies backend after local validation.
     * Replace with a signed upload URL flow for direct GCS upload in production.
     */
    fun notifyUploadComplete(uploadToken: String, callId: String, file: File, agentId: String) {
        val body = JSONObject()
            .put("callId", callId)
            .put("agentId", agentId)
            .put("recordingPath", "incoming/${file.name}")
            .put("fileSizeBytes", file.length())
            .put("uploadedAt", java.time.Instant.now().toString())
            .toString()
            .toRequestBody(jsonType)

        val request = Request.Builder()
            .url("${AppConfig.BACKEND_BASE_URL}/v1/ingest/upload-complete")
            .header("Authorization", "Bearer $uploadToken")
            .post(body)
            .build()

        http.newCall(request).execute().use { response ->
            if (!response.isSuccessful) error("Upload notify failed: ${response.code}")
        }
    }
}
