import { parentPort } from 'node:worker_threads';
import { VBANServer, VBANSerialPacket, ESerialStreamType } from 'vban';

// This is the worker thread. It runs the VBANServer, filters for MIDI packets,
// and forwards only the relevant MIDI data to the main thread.

if (!parentPort) {
    throw new Error('This script must be run as a worker thread.');
}

const log = (message) => parentPort.postMessage({ type: 'log', data: message });

log('[Network Worker] Starting VBAN server on port 7000, listening for MIDI packets...');

const server = new VBANServer();

server.on('message', (packet) => {
    // We only care about SERIAL packets that are specifically marked as MIDI
    if (packet instanceof VBANSerialPacket) {
        // Post the MIDI data buffer and stream name to the main thread
        parentPort.postMessage({
            type: 'midiData',
            streamType: ESerialStreamType[packet.streamType],
            data: packet.data,
            streamName: packet.streamName
        });
    }
});

server.on('error', (err) => {
    log(`[Network Worker] Server error: ${err.stack}`);
});

server.on('listening', () => {
    const address = server.address();
    log(`[Network Worker] Server is listening on ${address.address}:${address.port}`);
});

server.bind(7000);
