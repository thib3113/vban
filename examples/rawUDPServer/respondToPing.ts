import dgram from 'dgram';
import {
    VBANServicePacket,
    VBANProtocolFactory,
    EServiceType,
    EServiceFunction,
    EServicePINGApplicationType,
    EServicePINGFeatures
} from '../../src';
import * as os from 'os';

const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, sender) => {
    try {
        const packet = VBANProtocolFactory.processPacket(msg);

        if (packet instanceof VBANServicePacket) {
            console.log(
                `receive message from ${sender.address}:${sender.port} . Hostname : ${packet.data.reservedLongASCII}, Device ${packet.data.deviceName}, Application ${packet.data.applicationName}, Language ${packet.data.langCode}`,
                JSON.stringify(packet)
            );

            const newPacket = new VBANServicePacket(
                {
                    streamName: 'VBAN Service',
                    service: EServiceType.IDENTIFICATION,
                    serviceFunction: EServiceFunction.PING0,
                    frameCounter: 1,
                    isReply: true
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
