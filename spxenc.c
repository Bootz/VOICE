#include <stdio.h>

#include <speex/speex.h>

int main(int argc, char** argv)
{
    SpeexBits bits;
    void *enc_state;

    speex_bits_init(&bits);

    enc_state = speex_encoder_init(&speex_nb_mode);


    int frame_size;
    int quality = 8;

    speex_encoder_ctl(enc_state, SPEEX_GET_FRAME_SIZE, &frame_size);
    speex_encoder_ctl(enc_state, SPEEX_SET_QUALITY, &quality);

    fprintf(stderr, "speex: encoder frame_size: %d\n", frame_size);

    short input_frames[200];
    char buffer[200];

    int readBytes, nBytes;

    for(;;) {
        readBytes = fread(input_frames
                          , sizeof(input_frames[0])
                          , frame_size
                          , stdin);

        if(feof(stdin) > 0 || ferror(stdin) > 0) {
            printf("%s terminating, EOF or input stream error encountered", argv[0]);
            return 0;
        }

        speex_bits_reset(&bits);
        speex_encode_int(enc_state, input_frames, &bits);
        nBytes = speex_bits_write(&bits, buffer, sizeof(buffer));

        fprintf(stderr, "enc b: %d e: %d\n", readBytes, nBytes);

        fwrite(&nBytes, sizeof(nBytes), 1, stdout);
        fwrite(buffer, 1, nBytes, stdout);

        if(feof(stdin) > 0 || ferror(stdin) > 0) {
            printf("%s terminating, EOF or output stream error encountered", argv[0]);
            return 0;
        }

        fflush(stdout);
    }

    speex_bits_destroy(&bits);
    speex_encoder_destroy(enc_state);
}
