import { VBANAudioPacket, VBANServer } from '../src/index.js';

//need to install "speaker" module
import Speaker from 'speaker';

interface ISpeakerConfiguration extends Record<string, unknown> {
    channels: number;
    bitDepth: number;
    sampleRate: number;
    signed: boolean;
    float: boolean;
    samplesPerFrame: number;
}
let currentConfig: ISpeakerConfiguration;

let speaker: Speaker;

//create UDP server
const server = new VBANServer();
server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (packet) => {
    try {
        if (packet instanceof VBANAudioPacket) {
            //generate speaker configuration from VBAN packet
            const newConfig = headerToSpeakerConfig(packet);

            let configMatch = true;
            Object.keys(currentConfig || {}).forEach((element) => {
                configMatch = configMatch && currentConfig[element] == newConfig[element];
            });

            if (!speaker || !configMatch) {
                speaker = new Speaker({ ...newConfig });
                currentConfig = newConfig;
            }

            speaker.write(packet.data);

            //you can also proxy it to another VM, maybe changing the streamName
            // server.send(packet, 6980, '192.168.1.2');
        }
    } catch (e) {
        console.error(e);
    }
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(7000);

function headerToSpeakerConfig(header: VBANAudioPacket): ISpeakerConfiguration {
    const bitResolution = header.bitResolutionObject;

    return {
        channels: header.nbChannel,
        bitDepth: bitResolution.bitDepth,
        sampleRate: header.sr,
        signed: bitResolution.signed,
        float: bitResolution.float,
        samplesPerFrame: header.nbSample
    };
}
