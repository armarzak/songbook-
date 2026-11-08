# Offline practice drum grooves — v142

Added a Drums mode to the standalone Metronome tab. Seven original grooves: rock, pop, blues shuffle (triplet subdivision), reggae one-drop, four-on-the-floor disco, funk, and 6/8 ballad. Each groove defines its meter; the tempo control, numeric entry, presets and Tap work at 30–240 pulse beats per minute while playing. The 6/8 groove counts six eighth-note pulses per bar.

New drum-machine.js synthesizes kick, snare, rim, clap, closed/open hi-hat and ghost snare using Web Audio oscillators and deterministic noise. No audio recordings, downloads or third-party sound dependencies. Output uses compression and a separate drum volume slider. Synthesized sound differs from a recorded acoustic drum kit.

Selected mode/groove/volume persist in the independent metronome preferences. Switching modes/patterns cancels scheduled drum voices and restarts one scheduler. Navigation stops all drum voices. Existing song metronome and count-in keep their click sound and separate song settings.

Validation: node tests/drum-machine.test.cjs checks groove anchors, subdivisions, valid hits and tempo scaling. Headless mobile Chromium checked switching patterns while running, live tempo changes, 6/8 meter, saved preferences, volume, settings return, navigation stop and 320px overflow. OfflineAudioContext rendered all seven patterns: finite non-silent samples with peaks below 0 dBFS (maximum measured 0.801 at 80% drum volume). Existing metronome regression checks passed. Physical iPhone audio not tested.
