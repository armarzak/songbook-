# Chord audit — v133, 2026-11-06

## Scope and evidence

Compared Fire Chords' standard-tuning guitar chord model with static observations from the supplied smartChord V13.9 APK. The APK was not executed; no claim of a complete export of smartChord's fingering catalogue or runtime visual comparison is made. Fire Chords' new voicing search is an independent implementation based on chord intervals.

Artifact: base.apk, SHA256 9a153df71299d431ba2bb664cecbe8d7a73f3d2700ca743f691c7ebcabb9eed0. Engine: JADX MCP 0.7.1.

- smartChord Variation separates tones, degrees, mandatory tones and optional tones: ev_3571c7d3919d4c57bef3e32e167e4b7edd908b1adbc64dc2dc5728236ba62478 identifies the related structure model; Variation's calcMandatoryOptionalTones is ev_51e6f12de76cc6bdd8efdf51ed6c19b7ecd461d5b2f75023e76ce1f1e2768e75. Its omission setting is ev_dbb4455552ab09a63fd72f20a4bfb83d7c7ce69b5a3def578423a724744d87ca.
- ChordDictionaryActivity.X0 combines generated variations and user variations: ev_ce6d2990e619f2d13918c72cf6c28bd301001b0a0d4997e228ed90aea9283198. The dictionary builder is ev_51a37cb7d0b4486b59945b1bf9b59a9f044556bc76ced53b8c28f4e1dea193b8.

## Changes

- Validate built-in shapes against their named intervals; require a slash chord's actual lowest sounding MIDI note to match the requested bass. Distinguish diminished triads from diminished sevenths.
- Correct 17 reference cells: Ab9, G#m6, G#dim, Adim, Bb9, Bbdim, Bdim, Cdim, C#dim, Dbsus, Ddim, Eb9, Ebdim, Edim, Fdim, F#dim, Gdim. Original table order and names remain.
- Expand to 41 quality definitions, including m9, maj9, mMaj7, madd9, madd11, 6/9, 11/13 families, altered dominant chords, m7add11, 13#11 and maj7sus2. Fifths may be omitted in extended chords; intermediate 9/11 tones may be omitted in thirteenths. Root and defining tones are required.
- Search local four-fret windows when a verified shape is missing. Limit generated shapes to four fingers with one detected barre, prefer compact lower positions, and cache results. This is a bounded search, not a guarantee of exhaustive guitar fingerings or ergonomic comfort for every hand.
- Show alternative valid positions rather than suppressing them whenever a table entry exists. Keep user-saved shapes and their priority intact, including shapes the user deliberately saved despite a validation warning.
- Draw partial/full barres in mini diagrams, correct inconsistent starting fret labels so dots stay visible, add spoken fret descriptions for screen readers, and leave a dot unnumbered instead of inventing a fifth finger.
- Preserve the existing approximation warning for unsupported quality spellings; ambiguous notations are not silently reinterpreted as a new exact quality.

## Validation

`node tests/chords.test.cjs`: 492 root/quality combinations, all 132 reference cells, independent interval fixtures, slash bass checks, personal-shape precedence, mini barres, inconsistent fret labels and inline JavaScript syntax.

Headless Chromium at 393x852 with mobile/touch settings: app loads without page errors, Dmaj9/F# diagram renders without horizontal overflow, Cdim7 alternative positions open. This does not substitute for a physical iPhone/Safari test.
