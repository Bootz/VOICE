#include <stdio.h>
#include <string.h>
#include <stdint.h>

#define sizeofa(a) (sizeof(a)/sizeof(a[0]))
#define READ_BUFFER_SIZE 1000

char tdata[] = {1, 2, 3, 4, 5, 0};


int main(int argc, char** argv)
{
    char* opt;
    int tx;

    if(argc == 2) {
        opt = argv[1];
        if(strcmp(opt, "tx") == 0) {
            tx = 1;
        } else if(strcmp(opt, "rx") == 0) {
            tx = 0;
        }
    } else {
        return;
    }

    char buffer[sizeof (tdata)];

    if(tx) {
        fwrite(&tdata, sizeof(tdata), 1, stdout);
    } else { // rx
        fread(&buffer, sizeof(buffer), 1, stdin);
        return strcmp(tdata, buffer);
    }

    return 0;
}
