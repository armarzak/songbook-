# Per-song drum accompaniment — v143

The song metronome dialog now shares the standalone metronome's click/drums selector, seven groove choices and volume control. Tempo and groove can change during playback. Closing the dialog keeps accompaniment playing while reading lyrics; leaving the song stops playback and scheduled drum voices.

Each song stores metroRhythm (sound, groove, volume, clickBeats), alongside its existing bpm/beats. Plain metronome meter is restored when switching back from drums. Legacy songs default to clicks. Standalone metronome preferences remain independent in sb.metro. Backups and the existing whole-song timestamp merge carry the additional object without a separate database migration.

Per-song debounce timers and pending snapshots prevent rapid edits to different songs from canceling or overwriting each other's saves. Returning to a song before the save completes restores its pending choices.

Validation: mobile Chromium song modal with live drum scheduling, closing the dialog while retaining playback, tempo changes, 6/8 switching, volume, 320px dialog layout, song navigation stop, two rapid per-song saves, restoration after a page reload and standalone isolation. Existing standalone drum UI, seven OfflineAudioContext renders and node groove tests passed. Physical iPhone test not performed.
