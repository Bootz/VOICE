#!/bin/bash

which pacat > /dev/null; if [ ! $? -eq 0 ]; then
    export NO_PULSE="true"
fi

function fifos(){
    rm -f /tmp/VOICE_{in,out}
    mkfifo /tmp/VOICE_{in,out}
}

if [ ! $NO_PULSE ]; then
### PulseAudio ###

    echo "Using PulseAudio"

    if [[ $# -lt 1 ]]; then
        cat <<EOF
Usage:
    $0 [net_opts..]
EOF
        exit 1
    fi


    net_opts=$*
    echo $net_opts

    fifos
    ./voice-net.js $net_opts > /tmp/VOICE_out < /tmp/VOICE_in &



    # local -> remote
    parec \
        --latency-msec=1 --process-time-msec=1 \
        --raw --format=s16le --rate=8000 \
        | ./spxenc 2> /dev/null \
        > /tmp/VOICE_in &

    lr=$!

    # remote -> local
    cat /tmp/VOICE_out \
        | ./spxdec 2> /dev/null \
        | paplay \
        --latency-msec=1 --process-time-msec=1 \
        --raw --rate=8000 --format=s16le

    wait $lr

else

    echo "Non-Pulse"

    if [[ $# -ne 2 ]]; then
        cat <<EOF
Non-Pulse usage:
    $0 [input device] [output device] [net opst..]"
EOF
        exit 1
    fi

    in=$1; out=$2; shift; shift

    net_opts=$*

    fifos
    ./voice-net.js $net_opts > /tmp/VOICE_out < /tmp/VOICE_in &

    # local -> remote
    ./portcat $in rec \
        | ./spxenc 2> /dev/null \
        | ./voice-net.js --host $remoteHost --port $port &

    # remote -> local
    ./voice-net.js  --port $port \
        | ./spxdec 2> /dev/null \
        | ./portcat $out play

fi
