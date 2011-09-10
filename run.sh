#!/bin/bash
# local echo test


parec --latency-msec=1 --process-time-msec=1 --raw --format=s16le --rate=8000 \
    | ./spxenc \
    | ./spxdec \
    | paplay --raw --rate=8000 --format=s16le --latency-msec=1 --process-time-msec=1
