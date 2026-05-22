#!/bin/bash
set -euo pipefail

node <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pkg = path.join(root, 'node_modules', '@speechmatics', 'expo-two-way-audio');
const audioEnginePath = path.join(pkg, 'ios', 'AudioEngine.swift');
const modulePath = path.join(pkg, 'ios', 'ExpoTwoWayAudioModule.swift');
const androidAudioEnginePath = path.join(
  pkg,
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'twowayaudio',
  'AudioEngine.kt',
);
const androidModulePath = path.join(
  pkg,
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'twowayaudio',
  'ExpoTwoWayAudioModule.kt',
);

function patchFile(filePath, patcher) {
  if (!fs.existsSync(filePath)) {
    console.log(`expo-two-way-audio: ${path.relative(root, filePath)} not found, skipping`);
    return;
  }
  const before = fs.readFileSync(filePath, 'utf8');
  const after = patcher(before);
  if (after !== before) {
    fs.writeFileSync(filePath, after);
  }
}

patchFile(audioEnginePath, (source) => {
  let next = source
    .replace(/standardFormatWithSampleRate:\s*16000/g, 'standardFormatWithSampleRate: 24000')
    .replace(/sampleRate:\s*16000/g, 'sampleRate: 24000')
    .replace(/mode:\s*\.voiceChat/g, 'mode: .videoChat')
    .replace(
      /try session\.setPreferredSampleRate\(voiceIOFormat\.sampleRate\)\n\s+\} catch \{/,
      `try session.setPreferredSampleRate(voiceIOFormat.sampleRate)
            try session.setPreferredIOBufferDuration(0.03)
        } catch {`,
    )
    .replace(
      /avAudioEngine\.connect\(mainMixer, to: output, format: voiceIOFormat\)/g,
      'avAudioEngine.connect(mainMixer, to: output, format: nil)',
    )
    .replace(
      /destPtr\[i\] = Float\(sourcePtr\[i\]\) \/ Float\(Int16\.max\)/g,
      'destPtr[i] = max(-1.0, min(1.0, Float(sourcePtr[i]) / 32768.0))',
    );

  if (!next.includes('func stopPlayback()')) {
    next = next.replace(
      /\n\s+func bypassVoiceProcessing\(_ bypass: Bool\) \{/,
      `
    func stopPlayback() {
        speechPlayer.stop()
        speechPlayer.reset()
        outputBuffer = [Float](repeating: 0, count: 2048)
        updateOutputVolume()
    }

    func bypassVoiceProcessing(_ bypass: Bool) {`,
    );
  }

  return next;
});

patchFile(modulePath, (source) => {
  if (source.includes('Function("stopPlayback")')) {
    return source;
  }
  return source.replace(
    /\n\s+Function\("bypassVoiceProcessing"\) \{ \(bypass: Bool\) in/,
    `
        Function("stopPlayback") {
            self.audioEngine?.stopPlayback()
        }

        Function("bypassVoiceProcessing") { (bypass: Bool) in`,
  );
});

patchFile(androidAudioEnginePath, (source) => {
  let next = source
    .replace(/import java\.util\.LinkedList\n/g, '')
    .replace(/import java\.util\.Queue\n/g, '')
    .replace(
      /import java\.util\.concurrent\.Executors\n/g,
      'import java.util.concurrent.ConcurrentLinkedQueue\nimport java.util.concurrent.Executors\n',
    )
    .replace(/private val SAMPLE_RATE = 16000/g, 'private val SAMPLE_RATE = 24000')
    .replace(
      /private val audioSampleQueue: Queue<ByteArray> = LinkedList\(\)/g,
      'private val audioSampleQueue = ConcurrentLinkedQueue<ByteArray>()',
    )
    .replace(
      /bufferSize,\n\s+AudioTrack\.MODE_STREAM,/g,
      'maxOf(bufferSize, SAMPLE_RATE * 2 / 4),\n            AudioTrack.MODE_STREAM,',
    );

  if (!next.includes('fun stopPlayback()')) {
    next = next.replace(
      /\n\s+fun bypassVoiceProcessing\(bypass: Boolean\) \{/,
      `
    fun stopPlayback() {
        audioSampleQueue.clear()
        try {
            audioTrack.pause()
            audioTrack.flush()
            audioTrack.play()
        } catch (e: Exception) {
            Log.e("AudioEngine", "Error stopping playback", e)
        }
        isPlaying = false
        onOutputVolumeCallback?.invoke(0.0F)
    }

    fun bypassVoiceProcessing(bypass: Boolean) {`,
    );
  }

  next = next.replace(
    /private fun playSample\(data: ByteArray\) \{\n\s+audioTrack\.write\(data, 0, data\.size\)\n\s+\}/,
    `private fun playSample(data: ByteArray) {
        var offset = 0
        while (offset < data.size) {
            val written = audioTrack.write(data, offset, data.size - offset)
            if (written < 0) {
                Log.e("AudioEngine", "AudioTrack write failed: $written")
                return
            }
            if (written == 0) {
                Thread.sleep(2)
            } else {
                offset += written
            }
        }
    }`,
  );

  next = next.replace(
    /executorServiceMicrophone\.shutdownNow\(\)\n\s+\}/,
    `executorServiceMicrophone.shutdownNow()
        executorServicePlayback.shutdownNow()
    }`,
  );

  return next;
});

patchFile(androidModulePath, (source) => {
  if (source.includes('Function("stopPlayback")')) {
    return source;
  }
  return source.replace(
    /\n\s+Function\("bypassVoiceProcessing"\) \{ bypass: Boolean ->/,
    `
         Function("stopPlayback") {
             audioEngine?.stopPlayback()
         }

         Function("bypassVoiceProcessing") { bypass: Boolean ->`,
  );
});

console.log('expo-two-way-audio: patched for native 24kHz PCM, buffered playback, and playback flush');
NODE
