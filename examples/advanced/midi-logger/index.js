import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { bufferToHex } from 'vban';

// This is the main thread. It spawns a worker to handle networking and packet filtering.
// Its only job is to receive MIDI data from the worker and log it in a human-readable format.

console.log('[Main Thread] Starting...');

const __filename = fileURLToPath(import.meta.url);
const workerPath = path.resolve(path.dirname(__filename), 'worker.js');
const worker = new Worker(workerPath);

worker.on('message', (message) => {
    const { type, data } = message;

    if (type === 'log') {
        console.log(data);
        return;
    }

    if (type === 'midiData') {
        const hexString = bufferToHex(Buffer.from(data));
        console.log(`[Main Thread] Received ${message.streamType} data on stream "${message.streamName}": ${hexString}`);
    }
});

worker.on('error', (err) => {
    console.error('[Main Thread] Worker encountered an error:', err);
});

worker.on('exit', (code) => {
    console.log(`[Main Thread] Worker stopped with exit code ${code}`);
});

process.on('SIGINT', () => {
    console.log('[Main Thread] Shutting down...');
    worker.terminate().then(() => {
        console.log('[Main Thread] Worker terminated.');
        process.exit(0);
    });
});
