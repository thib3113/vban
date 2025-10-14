import { VBANServer, VBANTEXTPacket, ETextEncoding, VBANRequestReplyPacket } from 'vban';

// This script sends a command to Voicemeeter to query the gain of the first strip.
// To use this, Voicemeeter must be running and have an incoming VBAN TEXT stream named "Command1" configured.
// Voicemeeter will send a reply packet with the answer. You can see the reply using `simple/receive-any.js`.

const VOICEMEETER_PORT = 6980;
const VOICEMEETER_IP = '127.0.0.1'; // Assuming Voicemeeter is on the same machine

const server = new VBANServer();

const query = 'Strip[0].Gain = ?;';

const packet = new VBANTEXTPacket(
    {
        streamName: 'Command1',
        encoding: ETextEncoding.VBAN_TXT_UTF8
    },
    query
);

server.on('message', (packet, rinfo) => {
    const packetType = packet.constructor.name;
    console.log(
        `Received ${packetType} from ${rinfo.address}:${rinfo.port} ` + `on stream "${packet.streamName}" | Frame: ${packet.frameCounter}`
    );

    if (packet instanceof VBANRequestReplyPacket) {
        console.log(`  > Answer: "${packet.answer}"`);
    }
});

server.on('listening', () => {
    setInterval(() => {
        console.log(`Sending query "${query}"`);
        server.send(packet, VOICEMEETER_PORT, VOICEMEETER_IP);
    });
});

// We close the server shortly after sending as this is a one-off command.
// setTimeout(() => server.close(), 500);

server.bind(7000);
