# Chord browser and barre — v134, 2026-11-06

- Barre strip now has the same 22-unit thickness as the finger dots' diameter, with matching round ends. Fret spacing stays uniform at 32 SVG units.
- Added a chord browser in the Chords tab: root and named quality selectors, 192 named formulas, up to eight validated positions, large-view and playback controls.
- Added an interval composer. With the root fixed, all 2^11 = 2048 pitch-class combinations can be specified. Every selected tone is mandatory; composition coverage does not imply that every combination can be played on six strings.
- Added compositional parsing for extensions, alterations, add/no and sus modifiers, including comma-separated parenthesized alterations. Kept aliases and personal voicing precedence.
- Added a suffix tone-mask filter to the voicing search; branches that cannot supply all required tones are skipped. Sets requiring more than six distinct notes return immediately.
- A missing bounded-search result is displayed explicitly, rather than substituted with another harmony. Search remains limited to four-fret windows beginning at frets 1–12, contiguous sounding strings, and at most four fingers with one detected barre. This is not an exhaustive ergonomic fingering catalogue.

## smartChord observations

Continued static APK analysis via REA/JADX. defpackage.wu3.i enumerates inclusion/exclusion of eleven non-root intervals: ev_b81b0d9d3afba8dc419e801d0c0af238129f0f3263cbe79c43cd96e6c57b95fd. Constructor: ev_1e772a0bbd7f4da2e57d21fe2247bb30236831cb18ef5a5a0b754e7fe133be20. The naming method j has substantial decompiler warnings (ev_30007eaae20e5861586cf55ed9a94d9573ebdd199e65f7a3bc26b7388edd2bd3); its generated names were not treated as a complete reliable export. Fire Chords uses an independent interval/formula implementation, not a copy of this decompiled method. The APK was not executed.

## Verification

- `node tests/chords.test.cjs`: baseline 492 combinations, reference cells, interval fixtures, custom shape preservation and SVG geometry.
- `node tests/chord-catalog.test.cjs`: 192 named formulas, 2304 root/type combinations, no incorrect returned shapes; no bounded-search position for C#maj11no5. All 2048 explicit interval sets round-trip exactly.
- Mobile Chromium 393x852: root/type selection, interval composition, unavailable result, large F barre diagram and no horizontal overflow or page exceptions. Physical iPhone testing remains unperformed.
