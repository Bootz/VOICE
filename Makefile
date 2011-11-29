

all: spxenc spxdec portcat fec

spxenc: spxenc.c
	gcc -o spxenc spxenc.c -lspeex

spxdec: spxdec.c
	gcc -o spxdec spxdec.c -lspeex

portcat: portcat.c
	gcc -o portcat portcat.c -lportaudio
