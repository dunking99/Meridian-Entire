#!/bin/bash
# Starts the viewer and every design.
# Press Ctrl+C in this window to stop everything.

cd "$(dirname "$0")" || exit 1

STATIC_PORT=3000                       # viewer + Vite designs 1-4
NEXT_DESIGNS=(5 6 7 8 9 10 11 12)      # the Next.js designs
NEXT_BASE_PORT=4000                    # design N runs on port 4000 + N

stop_all() {
  echo ""
  echo "Stopping everything..."
  lsof -ti tcp:$STATIC_PORT | xargs kill 2>/dev/null
  for n in "${NEXT_DESIGNS[@]}"; do
    lsof -ti tcp:$((NEXT_BASE_PORT + n)) | xargs kill 2>/dev/null
  done
  exit 0
}
trap stop_all INT TERM

# Free the ports first, in case an old server is still running
lsof -ti tcp:$STATIC_PORT | xargs kill 2>/dev/null
for n in "${NEXT_DESIGNS[@]}"; do
  lsof -ti tcp:$((NEXT_BASE_PORT + n)) | xargs kill 2>/dev/null
done

# Start each Next.js design on its own port
for n in "${NEXT_DESIGNS[@]}"; do
  dir="UI-Design-$n"
  port=$((NEXT_BASE_PORT + n))

  if [ ! -d "$dir" ]; then
    echo "Skipping $dir (folder not found)"
    continue
  fi

  if [ ! -d "$dir/node_modules" ]; then
    echo "Installing packages for $dir (first time only)..."
    (cd "$dir" && npm install > "../.log-install-$n.txt" 2>&1)
  fi

  echo "Starting $dir on port $port"
  (cd "$dir" && PORT=$port npm run dev > "../.log-design-$n.txt" 2>&1) &
done

# Start the viewer + static Vite designs
echo "Starting viewer on port $STATIC_PORT"
npx --yes serve . -l $STATIC_PORT > .log-viewer.txt 2>&1 &

echo ""
echo "----------------------------------------------------------"
echo "Wait about 20 seconds, then open:"
echo "  http://localhost:$STATIC_PORT/viewer.html"
echo ""
echo "Press Ctrl+C in this window to stop everything."
echo "----------------------------------------------------------"

wait
