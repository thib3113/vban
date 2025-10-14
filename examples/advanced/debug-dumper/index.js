import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { VBANProtocolFactory, bufferToHex, VBANAudioPacket, VBANTEXTPacket, VBANPingPacket, VBANSerialPacket } from 'vban';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { ESerialStreamType } from 'vban/lib/types/packets/VBANSerialPacket/ESerialStreamType.js';

const PACKETS_PER_FILE = 100000;

/**
 * Defines the logging style for incoming packets.
 * @type {'summary' | 'detailed' | 'base64' | 'binary'}
 */
const CONSOLE_LOGGING_MODE = 'summary';

console.log('[Main Thread] Starting Debug Dumper...');

const dumpDirectory = process.argv[2];
let packetBuffer = [];
let fileIndex = 1;
let totalPacketCount = 0;

if (dumpDirectory) {
    console.log(`[Main Thread] Will dump packets to "${dumpDirectory}" in batches of ${PACKETS_PER_FILE}.`);
    if (!fs.existsSync(dumpDirectory)) {
        fs.mkdirSync(dumpDirectory, { recursive: true });
        console.log(`[Main Thread] Created directory: ${dumpDirectory}`);
    }
}

const __filename = fileURLToPath(import.meta.url);
const workerPath = path.resolve(path.dirname(__filename), 'worker.js');
const worker = new Worker(workerPath);

function writeBufferToFile() {
    if (!dumpDirectory || packetBuffer.length === 0) {
        return;
    }

    const filePath = path.join(dumpDirectory, `dump_${fileIndex}.json`);
    try {
        fs.writeFileSync(filePath, JSON.stringify(packetBuffer, null, 2));
        console.log(`\n[Main Thread] Wrote ${packetBuffer.length} packets to ${filePath}`);
        packetBuffer = [];
        fileIndex++;
    } catch (e) {
        console.error(`[Main Thread] Error writing to file ${filePath}:`, e);
    }
}

const getSummary = (packet, packetType, sender) => {
    let summary = `${packetType.replace('_', '').replace('VBAN', '').replace('Packet', '')}(${packet.frameCounter}) from ${sender.address.padEnd(
        15
    )} on stream "${packet.streamName}"`;

    if (packetType instanceof VBANAudioPacket) {
        summary += ` (${packet.nbSample} samples, ${packet.nbChannel} ch)`;
    }

    if (packetType instanceof VBANTEXTPacket) {
        summary += ` | Text: "${packet.text.length > 40 ? packet.text.substring(0, 37) + '...' : packet.text}"`;
    }
    if (packetType instanceof VBANPingPacket) {
        summary += ` | App: ${packet.data?.applicationName}`;
    }
    if (packetType instanceof VBANSerialPacket) {
        summary += ` | ${ESerialStreamType[packet.streamType]}: ${bufferToHex(packet.data)}`;
    }

    return summary;
};

worker.on('message', (message) => {
    const { type, data } = message;

    if (type === 'log') {
        console.log(data);
        return;
    }

    if (type === 'rawPacket') {
        const rawBuffer = Buffer.from(data.buffer.data);

        try {
            const packet = VBANProtocolFactory.processPacket(rawBuffer);
            const packetType = packet.constructor.name;
            totalPacketCount++;
            const binary = bufferToHex(rawBuffer);

            switch (CONSOLE_LOGGING_MODE) {
                // @ts-ignore
                case 'detailed':
                    console.log('--- [Main Thread] Full Packet Received ---');
                    console.log(`Packet Type: ${packetType}`);
                    console.log(`From: ${data.sender.address}:${data.sender.port}`);
                    console.dir(packet, { depth: null });
                    console.log(binary);
                    console.log('-------------------------------------------');
                    break;

                // @ts-ignore
                case 'base64':
                    console.log(`${packetType}(${packet.frameCounter}) : ${message.base64Packet}`);
                    break;
                // @ts-ignore
                case 'binary':
                    console.log(`${packetType}(${packet.frameCounter}) : ${binary}`);
                    break;

                // @ts-ignore
                case 'summary':
                default:
                    process.stdout.clearLine(0);
                    process.stdout.cursorTo(0);
                    process.stdout.write(getSummary(packet, packetType, data.sender));
                    break;
            }

            if (dumpDirectory) {
                packetBuffer.push({
                    timestamp: new Date().toISOString(),
                    type: packetType,
                    frame: packet.frameCounter,
                    packetBase64: rawBuffer.toString('base64')
                });

                if (packetBuffer.length >= PACKETS_PER_FILE) {
                    writeBufferToFile();
                }
            }
        } catch (e) {
            console.error('\n[Main Thread] Could not parse received buffer:', e);
        }
    }
});

worker.on('error', (err) => {
    console.error('[Main Thread] Worker encountered an error:', err);
});

worker.on('exit', (code) => {
    console.log(`\n[Main Thread] Worker stopped with exit code ${code}.`);
    handleShutdown();
});

function handleShutdown() {
    // Write any remaining packets in the buffer before exiting.
    writeBufferToFile();
}

process.on('SIGINT', () => {
    console.log('\n[Main Thread] Shutting down...');
    handleShutdown();
    worker.terminate().then(() => {
        console.log('[Main Thread] Worker terminated.');
        process.exit(0);
    });
});
