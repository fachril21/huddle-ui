#!/usr/bin/env bash
# Trims, normalises (-16 LUFS, peak <= -1 dBFS) and re-encodes the soundboard originals
# from assets/source-audio/Soundboard into src/audio/soundboard. Needs ffmpeg.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/source-audio/Soundboard
OUT=src/audio/soundboard
TARGET=-16
mkdir -p "$OUT"
TMP=$(mktemp -d)

# name  start  end  fade-out   (every result stays under the 5 s soundboard limit)
while read -r name ss to fade; do
  [ -z "$name" ] && continue
  dur=$(awk -v a="$ss" -v b="$to" 'BEGIN{print b-a}')
  fadeat=$(awk -v d="$dur" -v f="$fade" 'BEGIN{print d-f}')
  cut="$TMP/$name.wav"
  ffmpeg -v error -y -ss "$ss" -to "$to" -i "$SRC/$name.mp3" -vn -ar 44100 -ac 2 \
    -af "afade=t=in:d=0.005,afade=t=out:st=$fadeat:d=$fade" "$cut"
  loud=$(ffmpeg -nostats -i "$cut" -af ebur128 -f null - 2>&1 | awk '/^ +I:/{v=$2} END{print v}')
  gain=$(awk -v t="$TARGET" -v l="$loud" 'BEGIN{print t-l}')
  ffmpeg -v error -y -i "$cut" -af "volume=${gain}dB,alimiter=limit=0.89:level=disabled" \
    -codec:a libmp3lame -b:a 128k -map_metadata -1 "$OUT/$name.mp3"
  echo "$name: ${loud} LUFS -> gain ${gain} dB"
done <<'EOF'
air-horn 0.05 2.0 0.15
ding 0 1.5 0.2
drum-roll 0.25 4.15 0.05
jangkrik 0.4 4.3 0.1
level-up 0 1.9 0.2
rimshot 0 1.85 0.05
sad-trombone 0.3 3.8 0.2
sorak-penonton 0 4.6 1.0
tada 0 1.2 0.05
tepuk-tangan 0.1 4.6 0.8
whoosh 0.15 1.1 0.1
wow 0.15 3.9 0.1
EOF
rm -rf "$TMP"
