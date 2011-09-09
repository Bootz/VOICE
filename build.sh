#!/bin/bash

gcc -o spxenc spxenc.c -lspeex \
&& gcc -o spxdec spxdec.c -lspeex \
&& gcc -o capture-portaudio capture-portaudio.c -lportaudio