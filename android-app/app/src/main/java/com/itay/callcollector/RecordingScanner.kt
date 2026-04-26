package com.itay.callcollector

import android.os.Environment
import java.io.File
import java.security.MessageDigest

data class RecordingCandidate(
    val file: File,
    val fingerprint: String
)

class RecordingScanner {
    fun findCandidates(): List<RecordingCandidate> {
        val root = Environment.getExternalStorageDirectory()
        val allAudio = mutableListOf<File>()
        collectAudioFiles(root, allAudio)
        return allAudio
            .filter { pathLooksLikeSamsungRecording(it.path) }
            .map { file -> RecordingCandidate(file, fingerprintFor(file)) }
    }

    private fun collectAudioFiles(dir: File?, out: MutableList<File>) {
        if (dir == null || !dir.exists() || !dir.isDirectory) return
        val children = dir.listFiles() ?: return
        for (child in children) {
            if (child.isDirectory) {
                collectAudioFiles(child, out)
            } else if (child.name.endsWith(".m4a", true) || child.name.endsWith(".amr", true) || child.name.endsWith(".wav", true)) {
                out.add(child)
            }
        }
    }

    private fun pathLooksLikeSamsungRecording(path: String): Boolean {
        return AppConfig.RECORDING_HINTS.any { hint -> path.contains(hint, ignoreCase = true) }
    }

    private fun fingerprintFor(file: File): String {
        val raw = "${file.name}|${file.length()}|${file.lastModified()}"
        val digest = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }
}
