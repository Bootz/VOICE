#include <stdio.h>
#include <stdint.h>

#define sizeofa(a) (sizeof(a)/sizeof(a[0]))

int main(int argc, char** argv)
{
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

