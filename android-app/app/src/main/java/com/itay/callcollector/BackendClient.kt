package com.itay.callcollector

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
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

    fun uploadFile(uploadToken: String, callId: String, file: File, agentId: String) {
        val mediaType = "audio/*".toMediaType()
        val multipart = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("callId", callId)
            .addFormDataPart("agentId", agentId)
            .addFormDataPart("recordingPath", "incoming/$callId.wav")
            .addFormDataPart("file", file.name, file.asRequestBody(mediaType))
            .build()

        val request = Request.Builder()
            .url("${AppConfig.BACKEND_BASE_URL}/v1/upload-file")
            .header("Authorization", "Bearer $uploadToken")
            .post(multipart)
            .build()

        http.newCall(request).execute().use { response ->
            if (!response.isSuccessful) error("File upload failed: ${response.code}")
        }
    }
}
