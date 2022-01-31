import { BITS_SPEEDS, EFormatBit } from './commons';
import {
    ESerialStreamType,
    EServicePINGApplicationType,
    EServicePINGFeatures,
    ETextEncoding,
    VBANAudioPacket,
    VBANSerialPacket,
    VBANServicePacket,
    VBANTEXTPacket
} from './packets';
import { Buffer } from 'buffer';
import { VBANServer } from './VBANServer';

const server = new VBANServer({
    application: {
        applicationName: 'VBAN Example',
        manufacturerName: 'Anonymous',
        applicationType: EServicePINGApplicationType.SERVER,
        features: [EServicePINGFeatures.AUDIO, EServicePINGFeatures.MIDI, EServicePINGFeatures.TXT, EServicePINGFeatures.SERIAL],
        bitFeatureEx: 0,
        PreferredRate: 0,
        minRate: 6000,
        maxRate: 705600,
        color: { blue: 74, green: 232, red: 57 },
        nVersion: 12345,
        GPSPosition: '',
        userPosition: '',
        langCode: 'fr-fr',
        deviceName: 'NodeJs Server',
        userName: '',
        userComment: ''
    },
    beforeProcessPacket: (msg, sender) => {
        return true;
    }
});
// const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (packet, sender) => {
    try {
        if (packet instanceof VBANAudioPacket) {
            // //generate speaker configuration from VBAN packet
            // const newConfig = headerToSpeakerConfig(packet);
            //
            // let configMatch = true;
            // Object.keys(currentConfig || {}).forEach((element) => {
            //     configMatch = configMatch && currentConfig[element] == newConfig[element];
            // });
            //
            // if (!speaker || !configMatch) {
            //     speaker = new Speaker({ ...newConfig });
            //     currentConfig = newConfig;
            // }
            //
            // speaker.write(packet.data);
            packet.streamName = 'test';
            // server.send(packet, 6980, '127.0.0.1');
            console.log(packet.data.length);
        }
        //check seriql packet
        else if (packet instanceof VBANSerialPacket) {
            new VBANSerialPacket(
                {
                    bitMode: { stop: 1, start: false, parity: false, multipart: false },
                    bps: BITS_SPEEDS[14],
                    channelsIdents: 0,
                    formatBit: EFormatBit.VBAN_DATATYPE_BYTE8,
                    frameCounter: 0,
                    streamName: '',
                    streamType: ESerialStreamType.VBAN_SERIAL_MIDI
                },
                Buffer.from('b0036a', 'hex')
            );
        } else if (packet instanceof VBANServicePacket) {
            console.log(
                `receive message from ${sender.address}:${sender.port} . Hostname : ${packet.data.reservedLongASCII}, Device ${packet.data.deviceName}, Application ${packet.data.applicationName}, Language ${packet.data.langCode}`,
                JSON.stringify(packet)
            );
        } else {
            console.log('receive text : ', packet.text);
        }
    } catch (e) {
        console.error(e);
    }
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);

    const packet = new VBANTEXTPacket(
        {
            streamName: 'Command1',
            formatBit: EFormatBit.VBAN_DATATYPE_BYTE8,
            encoding: ETextEncoding.VBAN_TXT_UTF8
        },
        'test'
    );

    server.send(packet, 6980, '127.0.0.1');
});

server.bind(7000);
