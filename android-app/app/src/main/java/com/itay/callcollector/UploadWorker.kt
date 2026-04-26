package com.itay.callcollector

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.delay
import java.io.File

class UploadWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    private val scanner = RecordingScanner()
    private val store = FileFingerprintStore(appContext)
    private val backend = BackendClient()

    override suspend fun doWork(): Result {
        return try {
            val agentId = inputData.getString("agentId") ?: return Result.failure()
            val candidates = scanner.findCandidates()

            for (candidate in candidates) {
                if (store.exists(candidate.fingerprint)) continue
                if (!isFileStable(candidate.file)) continue

                val tokenResponse = backend.requestUploadToken(agentId, candidate.fingerprint)
                backend.uploadFile(tokenResponse.token, tokenResponse.callId, candidate.file, agentId)
                store.save(candidate.fingerprint)
            }
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }

    private suspend fun isFileStable(file: File): Boolean {
        val firstSize = file.length()
        delay(AppConfig.FILE_STABILITY_WAIT_MS)
        val secondSize = file.length()
        return firstSize > 0 && firstSize == secondSize
    }
}
