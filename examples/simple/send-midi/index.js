import { VBANServer, VBANSerialPacket, ESerialStreamType, EFormatBit } from 'vban';
import { Buffer } from 'node:buffer';

// This script sends a MIDI Control Change command every 2 seconds to localhost on port 6980.
// This specific command (B0 07 7F) sets the Main Volume (CC 7) to maximum (127) on Channel 1.

const VBAN_PORT = 6980;
const VBAN_IP = '127.0.0.1';

const server = new VBANServer();

// MIDI command: B0 07 7F
// B0 = Control Change on Channel 1
// 07 = Controller number (Main Volume)
// 7F = Controller value (127, which is max)
const midiCommand = Buffer.from('b0077f', 'hex');

const packet = new VBANSerialPacket(
    {
        streamName: 'MIDI-Stream',
        streamType: ESerialStreamType.VBAN_SERIAL_MIDI,
        bitMode: { stop: 1, start: false, parity: false, multipart: false },
        bps: 0, // BPS is not critical for MIDI over VBAN
        channelsIdents: 0,
        formatBit: EFormatBit.VBAN_DATATYPE_BYTE8
    },
    midiCommand
);

setInterval(() => {
    server.send(packet, VBAN_PORT, VBAN_IP);
    console.log(`Sent MIDI packet to ${VBAN_IP}:${VBAN_PORT}`);
}, 2000);

server.bind(0); // Bind to an ephemeral port for sending.
