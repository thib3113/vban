import dgram from 'dgram';
import { VBANProtocol } from './VBANProtocol';
import { EFormatBit, sampleRates } from './commons';
import {
    ESerialStreamType,
    EServiceFunction,
    EServicePINGApplicationType,
    EServicePINGFeatures,
    EServiceType,
    ETextStreamType,
    VBANAudioPacket,
    VBANSerialPacket,
    VBANServicePacket,
    VBANTEXTPacket
} from './packets';
import * as os from 'os';
import { Buffer } from 'buffer';

const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, sender) => {
    try {
        const packet = VBANProtocol.processPacket(msg);

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
        }
        //check seriql packet
        else if (packet instanceof VBANSerialPacket) {
            const packet1 = new VBANSerialPacket(
                {
                    bitMode: { stop: 1, start: false, parity: false, multipart: false },
                    bps: 0,
                    channelsIdents: 0,
                    formatBit: EFormatBit.VBAN_DATATYPE_BYTE8,
                    frameCounter: 0,
                    streamName: '',
                    streamType: ESerialStreamType.VBAN_SERIAL_MIDI,
                    sr: sampleRates[4]
                },
                Buffer.from('b0036a', 'hex')
            );
        } else if (packet instanceof VBANServicePacket) {
            console.log(
                `receive message from ${sender.address}:${sender.port} . Hostname : ${packet.data.reservedLongASCII}, Device ${packet.data.deviceName}, Application ${packet.data.applicationName}, Language ${packet.data.langCode}`,
                JSON.stringify(packet)
            );

            const newPacket = new VBANServicePacket(
                {
                    streamName: 'VBAN Service',
                    service: EServiceType.IDENTIFICATION,
                    serviceFunction: EServiceFunction.PING0,
                    frameCounter: 1
                },
                {
                    applicationName: 'VBAN Example',
                    manufacturerName: 'Anonymous',
                    applicationType: EServicePINGApplicationType.SERVER,
                    features: [
                        EServicePINGFeatures.AUDIO,
                        EServicePINGFeatures.MIDI,
                        EServicePINGFeatures.TXT,
                        EServicePINGFeatures.SERIAL
                    ],
                    bitFeatureEx: 0,
                    PreferredRate: 0,
                    minRate: 6000,
                    maxRate: 705600,
                    color: { blue: 74, green: 232, red: 57 },
                    nVersion: 12345,
                    GPSPosition: '',
                    userPosition: '',
                    langCode: 'fr-fr',
                    reservedASCII: '',
                    reservedEx: '',
                    reservedEx2: '',
                    deviceName: 'NodeJs Server',
                    reservedLongASCII: os.hostname(),
                    userName: '',
                    userComment: ''
                }
            );
            //send the answer to sender IP:port . (VM use listen port to send requests)
            server.send(VBANServicePacket.toUDPPacket(newPacket), sender.port, sender.address);
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

    const textPacket = new VBANTEXTPacket(
        {
            streamName: 'Command1',
            frameCounter: 1,
            streamType: ETextStreamType.VBAN_TXT_UTF8,
            formatBit: EFormatBit.VBAN_DATATYPE_BYTE8
        },
        'test'
    );
    server.send(VBANTEXTPacket.toUDPPacket(textPacket), 7000, '192.168.1.2');
});

server.bind(7000);
