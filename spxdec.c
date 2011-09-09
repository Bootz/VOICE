#include <stdio.h>

#include <speex/speex.h>

int main()
{
    SpeexBits bits;
    void *dec_state;

    speex_bits_init(&bits);

    dec_state = speex_decoder_init(&speex_nb_mode);


    int frame_size;
    int quality = 8;

    speex_decoder_ctl(dec_state, SPEEX_GET_FRAME_SIZE, &frame_size);

    fprintf(stderr, "speex: decoder frame_size: %d\n", frame_size);

    char input_bytes[200];
    short output_frames[200];

    int nBytes;
    int frameBytes;

    for(;;) {
        fread(&frameBytes, sizeof(frameBytes), 1, stdin);
        nBytes = fread(input_bytes, 1, frameBytes, stdin);

        speex_bits_read_from(&bits, input_bytes, frameBytes);
        speex_decode_int(dec_state, &bits, output_frames);

        fprintf(stderr, "dec frame: %d\n", frameBytes);

        fwrite(output_frames, 1, frame_size*2, stdout);
        fflush(stdout);
    }

    speex_bits_destroy(&bits);
    speex_decoder_destroy(dec_state);
}
