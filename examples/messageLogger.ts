import { Worker, isMainThread, parentPort } from 'worker_threads';
import { VBANServer, VBANPacketTypes, bufferToHex } from '../src/index.js';
import type { RemoteInfo } from 'node:dgram';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import console from 'node:console';
import { Buffer } from 'node:buffer';

/**
 * This example allow to log messages received from the server
 */

const BIND_PORT = 7000;
/**
 * Defines the logging style for incoming packets.
 * @type {'summary' | 'detailed' | 'base64' | 'binary'}
 */
const LOGGING_MODE = 'detailed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, 'output_frames');

// =================================================================
// MAIN THREAD LOGIC (aka "Console Thread")
// This thread's only job is to listen for messages from the worker
// and log them to the console.
// =================================================================
if (isMainThread) {
    console.log('[Console Thread] Starting...');
    console.log(`[Console Thread] Logging mode set to: ${LOGGING_MODE}`);
    console.log('[Console Thread] Spawning network worker...');

    // Create the worker thread from this very file.
    const worker = new Worker(__filename);

    // Listen for messages from the network worker.
    worker.on('message', (message) => {
        if (typeof message === 'string') {
            console.log(message);
        } else if (message && message.packet) {
            const binary = bufferToHex(Buffer.from(message.base64Packet, 'base64'));

            switch (LOGGING_MODE) {
                // @ts-ignore
                case 'detailed':
                    console.log('--- [Console Thread] Full Packet Received ---');
                    console.log(`Packet Type: ${message.packetType}`);
                    console.log(`From: ${message.sender.address}:${message.sender.port}`);
                    console.dir(message.packet, { depth: null });
                    console.log(binary);
                    console.log('-------------------------------------------');
                    break;

                // @ts-ignore
                case 'base64':
                    console.log(`${message.packetType}(${message.packet.frameCounter}) : ${message.base64Packet}`);
                    break;
                // @ts-ignore
                case 'binary':
                    console.log(`${message.packetType}(${message.packet.frameCounter}) : ${binary}`);
                    break;

                // @ts-ignore
                case 'summary':
                default:
                    let summary = `${message.packetType.replace('VBAN', '').replace('Packet', '')} from ${message.sender.address.padEnd(
                        15
                    )} on stream "${message.packet.streamName}"`;
                    switch (message.packetType) {
                        case 'VBANAudioPacket':
                            summary += ` (${message.packet.nbSample} samples, ${message.packet.nbChannel} ch)`;
                            break;
                        case 'VBANTEXTPacket':
                            const text =
                                message.packet.text.length > 40 ? message.packet.text.substring(0, 37) + '...' : message.packet.text;
                            summary += ` | Text: "${text}"`;
                            break;
                        case 'VBANPingPacket':
                            summary += ` | App: ${message.packet.data?.applicationName}`;
                            break;
                    }
                    console.log(summary);
                    break;
            }
        }
    });

    worker.on('error', (err) => {
        console.error('[Console Thread] Worker encountered an error:', err);
    });

    worker.on('exit', (code) => {
        console.log(`[Console Thread] Worker stopped with exit code ${code}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('[Console Thread] Shutting down...');
        worker.terminate().then(() => {
            console.log('[Console Thread] Worker terminated.');
            process.exit(0);
        });
    });

    // =================================================================
    // WORKER THREAD LOGIC (aka "Network Thread")
    // This thread handles all networking operations to avoid
    // blocking the main thread.
    // =================================================================
} else {
    // This code only runs in the worker thread.
    if (!parentPort) {
        // This should not happen if launched correctly.
        throw new Error('This script must be run as a worker thread.');
    }

    // Inform the main thread that the worker has started.
    parentPort.postMessage('[Network Worker] Worker started and is setting up the server...');

    const server = new VBANServer();

    server.on('error', (err) => {
        // Send error information back to the main thread for logging.
        parentPort?.postMessage(`[Network Worker] Server error:\n${err.stack}`);
    });

    // The 'message' event now also provides the raw buffer as the third argument.
    server.on('message', (packet: VBANPacketTypes, sender: RemoteInfo, rawBuffer: Buffer) => {
        const serializablePacket = JSON.parse(JSON.stringify(packet));
        const packetType = packet.constructor.name;
        const base64Packet = rawBuffer.toString('base64');

        // Send all relevant information to the main thread.
        parentPort?.postMessage({
            packet: serializablePacket,
            sender: sender,
            packetType: packetType,
            base64Packet: base64Packet
        });
    });

    server.on('listening', () => {
        const address = server.address();
        parentPort?.postMessage(`[Network Worker] Server is listening on ${address.address}:${address.port}`);
    });

    // Bind the server to start listening for packets.
    server.bind(BIND_PORT);
}
