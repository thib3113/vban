import dgram from 'node:dgram';
import { Buffer } from 'node:buffer';
import { EFormatBit, ESerialStreamType, VBANSerialPacket } from '../../src/index.js';

const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);

    const packet = new VBANSerialPacket(
        {
            bitMode: { stop: 1, start: false, parity: false, multipart: false },
            bps: 0,
            channelsIdents: 0,
            formatBit: EFormatBit.VBAN_DATATYPE_BYTE8,
            frameCounter: 0,
            streamName: '',
            streamType: ESerialStreamType.VBAN_SERIAL_MIDI
        },
        Buffer.from('b0036a', 'hex')
    );
    server.send(VBANSerialPacket.toUDPPacket(packet), 7000, '192.168.1.2');
});

server.bind(7000);
