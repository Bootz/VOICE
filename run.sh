#!/bin/bash

which pacat > /dev/null; if [ ! $? -eq 0 ]; then
    export NO_PULSE="true"
fi

if [[ $# -ne 2 ]]; then
    echo <<EOF
Usage:
    ./run.sh [remote host] [port]
EOF
    exit 1
fi

export remoteHost=$1
export port=$2
shift; shift

if [ ! $NO_PULSE ]; then
### PulseAudio ###

echo "Using PulseAudio"

# local -> remote
parec --latency-msec=1 --process-time-msec=1 --raw --format=s16le --rate=8000 \
    | ./spxenc 2> /dev/null \
    | ./voice-net.js --host $remoteHost --port $port &

# remote -> local
./voice-net.js  --port $port \
    | ./spxdec 2> /dev/null \
    | paplay --raw --rate=8000 --format=s16le --latency-msec=1 --process-time-msec=1

else

echo "Non-Pulse"

if [[ $# -ne 2 ]]; then
    echo <<EOF
Non-Pulse usage:
    ./runsh [remote host] [port] [input device] [output device]"
EOF
    exit 1
fi

in=$1; out=$2; shift; shift

# local -> remote
./portcat $in rec \
    | ./spxenc 2> /dev/null \
    | ./voice-net.js --host $remoteHost --port $port &

# remote -> local
./voice-net.js  --port $port \
    | ./spxdec 2> /dev/null \
    | ./portcat $out play

fi
