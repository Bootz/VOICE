#!/bin/bash

gcc -o spxenc spxenc.c -lspeex \
&& gcc -o spxdec spxdec.c -lspeex