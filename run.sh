#!/bin/bash

which pacat > /dev/null; if [ ! $? -eq 0 ]; then
    export NO_PULSE="true"
fi

export remoteHost="127.0.0.1"
export port="1337"

if [ ! $NO_PULSE ]; then
### PulseAudio ###

echo "Pulse"

# local -> remote
parec --latency-msec=1 --process-time-msec=1 --raw --format=s16le --rate=8000 \
    | ./spxenc \
    | ./voice-net.js --host $remoteHost --port $port &

# remote -> local
./voice-net.js  --port $port \
    | ./spxdec \
    | paplay --raw --rate=8000 --format=s16le --latency-msec=1 --process-time-msec=1
else
    echo "Not implemented yet."
fi
