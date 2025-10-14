import { parentPort } from 'node:worker_threads';
import { VBANServer } from 'vban';

// This is the worker thread. It's very simple: it runs the VBANServer
// and forwards every single raw UDP buffer it receives to the main thread.
// This ensures the main thread has the exact data that came over the network.

if (!parentPort) {
    throw new Error('This script must be run as a worker thread.');
}

const log = (message) => parentPort.postMessage({ type: 'log', data: message });

log('[Network Worker] Starting VBAN server on port 7000...');

const server = new VBANServer();

// The `message` event provides the raw buffer as the third argument.
server.on('message', (packet, sender, rawBuffer) => {
    parentPort.postMessage({
        type: 'rawPacket',
        data: {
            buffer: rawBuffer.toJSON(), // Serialize buffer for posting
            sender: sender
        }
    });
});

server.on('error', (err) => {
    log(`[Network Worker] Server error: ${err.stack}`);
});

server.on('listening', () => {
    const address = server.address();
    log(`[Network Worker] Server is listening on ${address.address}:${address.port}`);
});

server.bind(7000);
