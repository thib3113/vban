import {
    EServiceFunction,
    EServicePINGApplicationType,
    EServicePINGFeatures,
    EServiceType,
    VBANPingPacket,
    VBANServer
} from '../src/index.js';
import * as os from 'node:os';

//disable autoReplyToPing, because we will do it manually
const server = new VBANServer({ autoReplyToPing: false });

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (packet, sender) => {
    try {
        if (packet instanceof VBANPingPacket) {
            console.log(
                `receive message from ${sender.address}:${sender.port} . Hostname : ${packet.data.hostname}, Device ${packet.data.deviceName}, Application ${packet.data.applicationName}, Language ${packet.data.langCode}`,
                JSON.stringify(packet)
            );

            const newPacket = new VBANPingPacket(
                {
                    streamName: 'VBAN Service',
                    service: EServiceType.IDENTIFICATION,
                    serviceFunction: EServiceFunction.PING0,
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
                    hostname: os.hostname(),
                    userName: '',
                    userComment: ''
                }
            );
            //send the answer to sender IP:port . (VM use listen port to send requests)
            server.send(newPacket, sender.port, sender.address);
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
