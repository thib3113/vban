import {
    VBANProtocolFactory,
    VBANTEXTPacket,
    ETextEncoding,
    EServiceFunction,
    EServicePINGApplicationType,
    EServicePINGFeatures,
    EServiceType,
    VBANPingPacket
} from 'vban';
import dgram from 'node:dgram';
import os from 'node:os';

// This script demonstrates the low-level usage of the library for creating and parsing packet buffers
// without starting a VBANServer. This is useful for integrating with other UDP libraries or for unit testing.

console.log('--- Manual Packet Creation & Parsing ---');

// 1. Create a packet object instance.
const originalPacket = new VBANTEXTPacket(
    {
        streamName: 'ManualTest',
        encoding: ETextEncoding.VBAN_TXT_UTF8,
        frameCounter: 42 // Manually set a frame counter
    },
    'This is a test message.'
);

console.log('Step 1: Original Packet Object Created:');
console.dir(originalPacket, { depth: null });
console.log('\n');

// 2. Convert the packet object to a raw UDP buffer.
// This buffer is what would be sent over the network.
const packetBuffer = VBANProtocolFactory.toUDPBuffer(originalPacket);

console.log('Step 2: Converted to Buffer (hex representation):');
console.log(packetBuffer.toString('hex'));
console.log(`Buffer length: ${packetBuffer.length} bytes\n`);

// 3. Take the raw buffer and parse it back into a packet object.
// This simulates what a VBAN server does when it receives a UDP datagram.
const parsedPacket = VBANProtocolFactory.processPacket(packetBuffer);

console.log('Step 3: Parsed back into Packet Object:');
console.dir(parsedPacket, { depth: null });
console.log('\n');

// 4. Verify that the parsed packet is identical to the original.
// Note: We use JSON.stringify for a simple deep comparison.
const originalJSON = JSON.stringify(originalPacket);
// remove dataBuffer, because parsing will store the text in dataBuffer too
const parsedJSON = JSON.stringify({ ...parsedPacket, dataBuffer: undefined });

if (originalJSON === parsedJSON) {
    console.log('SUCCESS: The original and parsed packets are identical.');
} else {
    console.error('FAILURE: The packets do not match.');
}

console.log('Starting an udp server');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, sender) => {
    try {
        const packet = VBANProtocolFactory.processPacket(msg);

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
                    hostname: os.hostname(),
                    userName: '',
                    userComment: ''
                }
            );
            //send the answer to sender IP:port . (VM use listen port to send requests)
            server.send(VBANPingPacket.toUDPPacket(newPacket), sender.port, sender.address);
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
