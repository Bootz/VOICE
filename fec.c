/*
 * Forward Error Correction
 */

#include <stdio.h>
#include <stdint.h>

#include <sys/select.h>
#include <sys/types.h>
#include <unistd.h>

#define sizeofa(a) (sizeof(a)/sizeof(a[0]))
#define READ_BUFFER_SIZE 1000

int main(int argc, char** argv)
{
    fprintf(stderr, "start\n");

    struct timeval timeout = {
        .tv_sec = 10,
        .tv_usec = 0,
    };

    fd_set rfds;
    int rv;

    FD_ZERO(&rfds);
    FD_SET(1 /* stdin */, &rfds);

    uint8_t buffer[READ_BUFFER_SIZE];
    size_t r;
    size_t w;

    uint16_t seq = 0;

    for(;; seq++) {
        rv = select(fileno(stdin), &rfds, NULL, NULL, &timeout);

        if(rv == -1) {
            perror("select()");
        } else if (rv) {
            fprintf(stderr, "rx\n");

            r = fread(&buffer, sizeof(uint8_t), READ_BUFFER_SIZE, stdin);
            if(r == 0) perror("fread()");

            w = fwrite(&buffer, sizeof(uint8_t), r, stdout);
            if(w == 0) perror("fwrite()");
        }

        if(rv == 0)
            fprintf (stderr, "timeout\n");
    }


    uint16_t buffer[1<<10];

    size_t ir = sizeof(buffer) - 1;
    size_t iw = 0;

    fread(buffer, sizeof(uint16_t), sizeofa(buffer), stdin);

    for(;;) {
        fread (&buffer[ir], sizeof(uint16_t), 1, stdin);
        fwrite(&buffer[iw], sizeof(uint16_t), 1, stdout);

        ir = ++ir & (1<<10)-1;
        iw = ++iw & (1<<10)-1;

        fflush(stdout);
    }
}
