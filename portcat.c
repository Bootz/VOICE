#include <stdio.h>
#include <string.h>
#include <stdint.h>

#include <portaudio.h>

#define sampleRate 8000.0 * 2
#define sampleBufferSize 1000

#define playDirection 1
#define recDirection -1

PaStream *stream;
int direction = playDirection;


int main(int argc, char** argv)
{
    Pa_Initialize();

    fprintf(stderr, "PortAudio version: %s\n", Pa_GetVersionText());

    int dev;

    if(argc >= 2) {
        if(strcmp(argv[1], "list-devices") == 0) {
            enumerate_apis();
            return;
        } else if(sscanf(argv[1], "%i", &dev) != 1) {
            fprintf(stderr, "Malformed device id\n");
        }
    } else {
        dev = Pa_HostApiDeviceIndexToDeviceIndex(Pa_GetDefaultHostApi()
                                                 , Pa_GetDefaultInputDevice());
    }

    if (argc >= 3) {
        if(strcmp(argv[2], "play") == 0) {
            direction = playDirection;
        } else if(strcmp(argv[2], "rec") == 0) {
            direction = recDirection;
        } else {
            fprintf(stderr, "no direction given\n");
            return 1;
        }
    }

    const PaDeviceInfo* deviceInfo = Pa_GetDeviceInfo(dev);

    open_capture_stream(dev
                        , deviceInfo->defaultLowInputLatency
                        , sampleRate);

    direction == playDirection ? write_stream() : read_stream();

    Pa_Terminate();
}

int enumerate_apis()
{
    int ai; // api index
    int di; // device index

    for(ai = 0; ai < Pa_GetHostApiCount(); ai++) {

        const PaHostApiInfo* apiInfo = Pa_GetHostApiInfo(ai);

        fprintf(stderr, "API: %s, devs: %d\n"
                , apiInfo->name
                , apiInfo->deviceCount);

        for(di = 0; di < apiInfo->deviceCount; di++) {
            int deviceIndex = Pa_HostApiDeviceIndexToDeviceIndex(ai, di);
            const PaDeviceInfo* deviceInfo = Pa_GetDeviceInfo(deviceIndex);

            fprintf(stderr, "%d    DEV: %s, in: %d, out: %d\n"
                    , deviceIndex
                    , deviceInfo->name
                    , deviceInfo->maxInputChannels
                    , deviceInfo->maxOutputChannels);
        }

    }

    return 0;
}

int open_capture_stream(int deviceIndex, double latency, double rate)
{
    PaStreamParameters inParams = {
        .device = deviceIndex,
        .sampleFormat = paInt16,
        .channelCount = 1,
        .suggestedLatency = latency,
        .hostApiSpecificStreamInfo = NULL
    };


    PaStreamParameters outParams = {
        .device = deviceIndex,
        .sampleFormat = paInt16,
        .channelCount = 1,
        .suggestedLatency = latency,
        .hostApiSpecificStreamInfo = NULL
    };


    PaError err = Pa_OpenStream(&stream
                                , direction == recDirection ? &inParams : NULL
                                , direction == playDirection ? &outParams : NULL
                                , rate
                                , 0 // framesPerBuffer
                                , paNoFlag // flags
                                , NULL
                                , NULL);
    if(err != paNoError) {
        fprintf(stderr, "PortAudio error while opening stream: %s\n"
                , Pa_GetErrorText(err));

        return err;
    }

    return 0;
}

int read_stream()
{
    char buffer[sizeof(uint16_t) * sampleBufferSize];

    PaError e;
    size_t w;

    Pa_StartStream(stream);

    for(;;) {
        e = Pa_ReadStream(stream, buffer, sampleBufferSize);

        // todo resume writing if less than sizeof(buffer) bytes are written

        if(e != paNoError) {
            fprintf(stderr, "PortAudio error while reading stream: %s\n"
                    , Pa_GetErrorText(e));

            return e;
        }

        w = fwrite(buffer, 1, sizeof(buffer), stdout);
    }
}

int write_stream()
{
    char buffer[sizeof(uint16_t) * sampleBufferSize];

    PaError e;
    size_t r;

    Pa_StartStream(stream);

    for(;;) {
        r = fread(buffer, 1, sizeof(buffer), stdin);
        e = Pa_WriteStream(stream, buffer, sampleBufferSize);

        // todo resume writing if less than sizeof(buffer) bytes are written

        if(e != paNoError) {
            fprintf(stderr, "PortAudio error while writing to stream: %s\n"
                    , Pa_GetErrorText(e));

            return e;
        }
    }


}
