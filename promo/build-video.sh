#!/usr/bin/env bash
# Build promo/promo-trailer.mp4 from the screenshots in promo/screenshots/.
# 15 scenes × 3s, with 0.6s crossfade transitions, 1920×1080 @ 30fps.
# Re-runnable: produces a deterministic MP4 each time.
#
# Requires: ffmpeg, awk, bash 4+ (for arrays).
set -euo pipefail
cd "$(dirname "$0")"

# --- Preflight ---------------------------------------------------------------
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[build-video] ERROR: ffmpeg not found in PATH" >&2
  exit 1
fi
if ! command -v awk >/dev/null 2>&1; then
  echo "[build-video] ERROR: awk not found in PATH" >&2
  exit 1
fi

OUT="promo-trailer.mp4"
W=1920
H=1080
FPS=30
PER=3.0          # seconds per scene (before crossfade)
XFADE=0.6        # crossfade duration

# Scene order: tells the story of the product.
# All 15 entries must exist under ./screenshots/.
SCENES=(
  "screenshots/01-intro-cinematic.jpg"
  "screenshots/03-dashboard-main.jpg"
  "screenshots/02-modules-hub.jpg"
  "screenshots/04-guided-tour.jpg"
  "screenshots/14-floating-console.jpg"
  "screenshots/06-git-module.jpg"
  "screenshots/11-files-module.jpg"
  "screenshots/09-system-module.jpg"
  "screenshots/07-network-module.jpg"
  "screenshots/12-data-module.jpg"
  "screenshots/10-docker-module.jpg"
  "screenshots/13-services-module.jpg"
  "screenshots/08-analytics-module.jpg"
  "screenshots/05-redteam.jpg"
  "screenshots/15-promo-page.jpg"
)
N=${#SCENES[@]}

# Verify every scene file exists before starting the (slow) ffmpeg run.
missing=0
for s in "${SCENES[@]}"; do
  if [[ ! -f "$s" ]]; then
    echo "[build-video] ERROR: missing scene file: $s" >&2
    missing=$((missing + 1))
  fi
done
if [[ $missing -gt 0 ]]; then
  echo "[build-video] $missing scene(s) missing — aborting before ffmpeg." >&2
  exit 2
fi
echo "[build-video] $N scenes verified, building $OUT (${W}x${H} @ ${FPS}fps)..."

# --- Build ffmpeg invocation -------------------------------------------------
INPUT_ARGS=()
for s in "${SCENES[@]}"; do
  INPUT_ARGS+=(-loop 1 -t "$PER" -i "$s")
done

# Per-input scale+pad+fps -> [v0],[v1],...
FILTER=""
for ((i=0; i<N; i++)); do
  FILTER+="[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${FPS},format=yuv420p[v${i}];"
done

# xfade chain. Offset for the i-th transition = i*PER - i*XFADE so transitions overlap.
PREV="v0"
for ((i=1; i<N; i++)); do
  OFFSET=$(awk -v i="$i" -v p="$PER" -v x="$XFADE" 'BEGIN{ printf "%.3f", i*p - i*x }')
  if [[ $i -eq $((N-1)) ]]; then
    OUT_LABEL="vout"
  else
    OUT_LABEL="vx${i}"
  fi
  FILTER+="[${PREV}][v${i}]xfade=transition=fade:duration=${XFADE}:offset=${OFFSET}[${OUT_LABEL}];"
  PREV="vx${i}"
done
FILTER="${FILTER%;}"   # strip trailing semicolon

# --- Run ----------------------------------------------------------------------
ffmpeg -y -hide_banner -loglevel error \
  "${INPUT_ARGS[@]}" \
  -filter_complex "$FILTER" \
  -map "[vout]" \
  -c:v libx264 -preset medium -crf 20 \
  -movflags +faststart \
  -pix_fmt yuv420p \
  "$OUT"

ls -lh "$OUT"
echo "[build-video] Built: promo/$OUT"
