# Standalone metronome — v139

Added a dedicated Metronome tab to Fire Chords' bottom navigation. The reference was https://awerb.github.io/guitar-songbook/: standalone tempo display, beat indicators, meter selection, presets, Tap and reset. Implementation reuses Fire Chords' existing Web Audio scheduler rather than copying the reference source.

Tempo range is 30–240 BPM. Meter choices: 2/4, 3/4, 4/4, 6/8. Independent settings are stored locally under sb.metro. Leaving the section stops playback. Song metronome settings remain separate, including a pending song tempo save when switching to the new screen. Pending audio startup is canceled when leaving a view.

Validation: headless mobile Chromium at 393x852 and 320x568; navigation, start/stop, numeric input, presets, meter changes, reset, preference restoration, leaving stops playback, pending song save isolation, existing song modal and JavaScript syntax. No horizontal overflow or page errors. No physical iPhone test performed.
