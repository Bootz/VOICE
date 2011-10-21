#!/bin/bash

make -C ..
gcc -o test-fec test-fec.c


./test-fec tx | ../fec | ./test-fec rx

if [ 0 -eq $? ]; then
    echo "Success";
else
    echo "[FAIL]";
fi