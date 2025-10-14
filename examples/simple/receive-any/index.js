import { VBANServer, ESubProtocol } from 'vban';

const server = new VBANServer();

console.log('Starting VBAN server, listening for any packet on port 7000...');

server.on('message', (packet, rinfo) => {
    const packetType = packet.constructor.name;
    console.log(
        `Received ${packetType} from ${rinfo.address}:${rinfo.port} ` + `on stream "${packet.streamName}" | Frame: ${packet.frameCounter}`
    );

    // For text packets, we can also log the content
    if (packet.subProtocol === ESubProtocol.TEXT) {
        console.log(`  > Text: "${packet.text}"`);
    }
});

server.on('error', (err) => {
    console.error(`Server error:\n${err.stack}`);
    server.close();
});

server.bind(7000);
