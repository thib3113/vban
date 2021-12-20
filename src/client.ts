import dgram from 'dgram';
import Speaker from 'speaker';
import { VBANProtocol } from './VBANProtocol';
import { VBANAudioPacket } from './packets/VBANAudioPacket/VBANAudioPacket';
import { VBANServicePacket } from './packets/VBANServicePacket/VBANServicePacket';
import { VBANSerialPacket } from './packets/VBANSerialPacket/VBANSerialPacket';
import { EFormatBit } from './commons';
import { VBANTEXTPacket } from './packets/VBANTXTPacket/VBANTEXTPacket';
import { VBANPacket } from './packets';
import { ESerialStreamType } from './packets/VBANSerialPacket/ESerialStreamType';

function hex2bin(hex: string) {
    return parseInt(hex, 16).toString(2).padStart(8, '0');
}

const server = dgram.createSocket('udp4');

let currentConfig: ISpeakerConfiguration;

let speaker: Speaker;

interface ISpeakerConfiguration extends Record<string, unknown> {
    channels: number;
    bitDepth: number;
    sampleRate: number;
    signed: boolean;
    float: boolean;
    samplesPerFrame: number;
}

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    try {
        const packet = VBANProtocol.processPacket(msg);
        // console.log('data', data);

        // const { header } = packet;
        // console.log(
        //     'headers',
        //     `sample rates : ${header.sr}, subProtocol : ${ESubProtocol[header.sp]}, nbSample : ${header.nbSample}, nbChannel : ${
        //         header.nbChannel
        //     }, bitResolution : ${EBitsResolutions[header.bitResolution]} ${JSON.stringify(bitResolutions[header.bitResolution])}, codec : ${
        //         header.codec
        //     }, streamName : ${header.streamName}, frameCounter : ${header.frameCounter}`
        // );

        if (packet instanceof VBANAudioPacket) {
            const newConfig = headerToSpeakerConfig(packet);

            VBANPacket.checkFrameCounter(packet);

            let configMatch = true;
            Object.keys(currentConfig || {}).forEach((element) => {
                configMatch = configMatch && currentConfig[element] == newConfig[element];
            });

            if (!speaker || !configMatch) {
                speaker = new Speaker({ ...newConfig });
                currentConfig = newConfig;
            }
            // Check for audio frame
            // console.log(`receive audio : counter ${packet.frameCounter}, frame size : ${packet.dataBuffer.length}`);
            speaker.write(packet.data);
        }
        //check seriql packet
        else if (packet instanceof VBANSerialPacket) {
            console.log(
                `${packet.streamName}, format : ${EFormatBit[packet.formatBit as number]}, stream type : ${
                    ESerialStreamType[packet.streamType as number]
                }`
            );
            console.log(packet);
        } else if (packet instanceof VBANServicePacket) {
            console.log('base');
            console.log('VBANPING_TYPE_RECEPTOR', 0x00000001);
            console.log('VBANPING_TYPE_TRANSMITTER', 0x00000002);
            console.log('VBANPING_TYPE_RECEPTORSPOT', 0x00000004);
            console.log('VBANPING_TYPE_TRANSMITTERSPOT', 0x00000008);
            console.log('VBANPING_TYPE_VIRTUALDEVICE', 0x00000010);
            console.log('VBANPING_TYPE_VIRTUALMIXER', 0x00000020);
            console.log('VBANPING_TYPE_MATRIX', 0x00000040);
            console.log('VBANPING_TYPE_DAW', 0x00000080);
            console.log('VBANPING_TYPE_SERVER', 0x01000000);

            console.log('end');
        } else {
            console.log('receive text : ', packet.text);
        }

        // console.log(packet.frameCounter);
    } catch (e) {
        console.error(e);
    }
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(7000);
// Prints: server listening 0.0.0.0:41234

function headerToSpeakerConfig(header: VBANAudioPacket): ISpeakerConfiguration {
    const bitResolution = VBANAudioPacket.bitResolutions[header.bitResolution as number];

    return {
        channels: header.nbChannel,
        bitDepth: bitResolution.bitDepth,
        sampleRate: header.sr,
        signed: bitResolution.signed,
        float: bitResolution.float,
        samplesPerFrame: header.nbSample
    };
}
