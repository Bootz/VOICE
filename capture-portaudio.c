#include <stdio.h>
#include <stdint.h>

#include <portaudio.h>


#define sampleBufferSize 4000

PaStream *stream;



int main()
{
    Pa_Initialize();

    fprintf(stderr, "PortAudio version: %s\n", Pa_GetVersionText());

    enumerate_apis();

    // TODO: select device ; allow selecting default


    const PaDeviceInfo* deviceInfo =
      Pa_GetDeviceInfo(Pa_GetDefaultInputDevice());
    int dev = Pa_HostApiDeviceIndexToDeviceIndex(Pa_GetDefaultHostApi()
                                       , Pa_GetDefaultInputDevice());

    open_capture_stream(dev
                        , deviceInfo->defaultLowInputLatency
                        , deviceInfo->defaultSampleRate);

    read_stream();

    Pa_Terminate();
}


int enumerate_apis()
{
    int ai; // api index
    int di; // device index

    int selectIndex = 1;

    for(ai = 0; ai < Pa_GetHostApiCount(); ai++) {

        const PaHostApiInfo* apiInfo = Pa_GetHostApiInfo(ai);

        fprintf(stderr, "API: %s, devs: %d\n"
                , apiInfo->name
                , apiInfo->deviceCount);

        for(di = 0; di < apiInfo->deviceCount; di++) {
            int deviceIndex = Pa_HostApiDeviceIndexToDeviceIndex(ai, di);
            const PaDeviceInfo* deviceInfo = Pa_GetDeviceInfo(deviceIndex);

            fprintf(stderr, "%d    DEV: %s, in: %d, out: %d\n"
                    , selectIndex++
                    , deviceInfo->name
                    , deviceInfo->maxInputChannels
                    , deviceInfo->maxOutputChannels);
        }

    }

    return 0;
}

int open_capture_stream(int deviceIndex, double latency, double sampleRate)
{
    PaStreamParameters inParams;

    inParams.device = deviceIndex;
    inParams.sampleFormat = paInt16; // check with PulseAudio for compat
    inParams.channelCount = 1;
    inParams.suggestedLatency = latency;
    inParams.hostApiSpecificStreamInfo = NULL;

    PaError err = Pa_OpenStream(&stream
                                , &inParams
                                , NULL
                                , sampleRate
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
    ssize_t w;


    for(;;) {
        e = Pa_ReadStream(stream, buffer, sampleBufferSize);
        w = fwrite(buffer, 1, sizeof(buffer), stdout);

        // todo resume writing if less than sizeof(buffer) bytes are written

        if(e != paNoError) {
            fprintf(stderr, "PortAudio error while reading stream: %s\n"
                    , Pa_GetErrorText(e));

            return e;
        }
    }
}
