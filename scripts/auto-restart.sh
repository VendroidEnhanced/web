#!/bin/bash

# Ensure inotify-tools is installed
if ! command -v inotifywait &> /dev/null; then
    echo "inotifywait not found. Install it with: sudo apt install inotify-tools"
    exit 1
fi

while true; do
    pnpm start &
    PID=$!

    # Watch for changes in the src/ directory
    inotifywait -r -e modify,create,delete,move src/

    # Kill the previous process and restart
    kill $PID
    wait $PID 2>/dev/null
    echo "Restarting pnpm start..."
done
