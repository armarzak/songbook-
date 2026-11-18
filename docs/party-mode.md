# FireChords Party (v175, experimental)

Open Settings → FireChords Party, or a song → ⋯ → FireChords Party.

## Offline setup

1. Before leaving internet coverage, open the updated installed web app on every phone. The service worker caches the QR encoder, decoder, UI and starter songs. The leader must also have a locally saved backing file; a streaming Hitmos URL is not offline audio.
2. Connect everyone to the same Wi-Fi / the leader's hotspot. Keep FireChords in the foreground on the leader and participants.
3. Leader: choose “Я ведущий · создать Party”. Participant: open Party, tap “Сканировать QR”, grant camera permission and scan all rotating QR parts.
4. Participant shows the response QR. Leader taps “Сканировать QR” and scans the response. Wait for the connected status on both phones.
5. Close the dialog. Leader opens a song and starts the backing track. Repeat a new invitation/response exchange for each participant (up to eight).
6. Participants choose guitar, book or karaoke independently. Audio starts only on the leader. Timing follows the selected backing/Hitmos marks. With no marks, followers approximate the leader's scroll position; this is not word synchronization.
7. To recover a lost connection, leave Party on the participant and create a new invitation on the leader. “Выйти из Party” closes data channels. Camera capture stops when the dialog closes or the app is hidden.

QR scanning uses the built-in scanner, not the iPhone Camera app. A screenshot upload is also supported. Pairing requests no account, public signaling service, STUN or TURN server. QR contents are temporary local connection descriptions, not web links.

## Implementation

`party-protocol.js` deflates a validated SDP envelope and splits it into checksummed QR frames. `party-mode.js` sets up WebRTC data channels with `iceServers: []`. Song snapshots and state are delivered over reliable ordered channels; large songs are chunked. No music files or audio streams are transferred. Identical local songs are used directly. A differing song version stays in memory and is removed on leaving; participant library storage is never modified.

The leader sends state four times per second. Followers estimate one-way latency from RTT, interpolate against their monotonic clock and freeze after a stale connection. The leader's playback rate is included. Display settings remain local. Browser suspension/background throttling may interrupt delivery.

## Validation and limits

- `node tests/party-protocol.test.cjs`: QR protocol ordering, duplicates, bounds, invalid input and new-scan reset.
- `node tests/party-mode.test.cjs`: isolated Chrome tabs, rendered QR image decoding and screenshot import in both directions, real local WebRTC, timing, pause/seek, silent followers, independent karaoke, joining a second participant and disconnect. Requires installed Chrome; set `CHROME_PATH` if needed. External HTTPS requests are blocked after app initialization. This checks the browser implementation, not hotspot routing.
- Physical iPhone-to-iPhone tests with the hotspot WAN disabled are still required. Safari local candidate permissions, mDNS and hotspot client isolation can prevent connections. QR signaling alone cannot override those network restrictions. Do not claim universal offline hotspot compatibility before that test.

Third-party code: qrcode-generator 1.4.4 (Kazuhiko Arase, MIT), jsQR 1.4.0 (Cosmo Wolfe, Apache-2.0). Pinned copies and license notices are under `vendor/`.
