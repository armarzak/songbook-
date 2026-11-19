# Browser AI marking and Google Drive audio (v179)

## Google Drive

Settings → Google Диск · синхронизация минусов. Google Identity Services token model with `drive.file` scope; Client ID is public. The Google Cloud project must enable Drive API, authorize `https://armarzak.github.io` as a JavaScript origin, and allow the account as a test user while the OAuth app is in testing.

On the first device, sign in and upload its local backing files. On the other device, sign in with the same Google account and download missing files (also started after sign-in). Files are placed in the private folder “FireChords — минусы”. The browser requests access only to app-created/selected files, not the full Drive. Song IDs plus normalized artist/title hashes support matching across devices. Audio is stored in the existing IndexedDB records for offline use; downloaded files do not need Google authentication to play. OAuth tokens are memory-only, expire, and require a new login in a fresh session.

This version fills missing files only. It never overwrites existing local or cloud audio, deletes files, or makes them public. To replace a cloud backing file, remove that file manually in Drive and upload again. Google Drive sync is for audio, not a replacement for the existing song/mark synchronization. Quota, account authorization and actual iPhone login still require a live user test.

## Browser AI

Song → ⋯ → ИИ-разметка и распознавание текста. Select an audio file WITH VOCALS, a language, and the target player. Recognition runs inside a module worker with multilingual quantized `Xenova/whisper-tiny`, using pinned Transformers.js 2.17.2. The runtime is bundled; model weights and ONNX WASM load on demand from Hugging Face / jsDelivr. Browser caching is enabled, but offline inference is not guaranteed after cache eviction. Audio is not uploaded to an inference server.

Limits: 80 MB, ten minutes per input, and bounded token alignment. Pure instrumental audio cannot supply sung-word timing. Singing, instruments, repetitions and ASR errors can reduce accuracy. LCS token matching accepts a line only when at least 60% of its words match and its first word is present. Missing lines stay unmarked. This is a conservative draft, not a full phonetic forced aligner. Recognized words are displayed separately, with a copy button; the song body is never silently replaced.

Review / edit times before saving. Saving checks unchanged lyrics and monotonic times. Existing timing replacement requires confirmation. Backing and Hitmos timings remain separate. Saving Hitmos timing checks that its audio link has not changed. Web search is a user-opened Google results link; automatic retrieval and ingestion of online lyrics is not implemented.

## Validation

- `node tests/drive-audio.test.cjs`: mocked OAuth / Drive endpoints exercise scoped auth, cross-device matching, downloads, resumable uploads, preservation and disconnect. No real account used.
- `node tests/ai-align.test.cjs`: repeated lyrics, word times and rejection of unmatched lines.
- `node tests/ai-browser.test.cjs`: manual online Chrome integration test; downloads public JFK speech fixture and runs the actual model, reviews and saves timestamps. Set `AI_TEST_AUDIO` for an alternative fixture and `CHROME_PATH` for the executable. Physical iPhone speed / memory and recognition on singing are not yet validated.

Transformers.js is Apache-2.0; its pinned license is under `vendor/`. Model metadata / license: https://huggingface.co/Xenova/whisper-tiny .
