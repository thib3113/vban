import { parentPort } from 'node:worker_threads';
import { VBANServer, VBANAudioPacket, EBitsResolutions } from 'vban';
import Speaker from 'speaker';

// This is the worker thread. Its only job is to run the VBANServer,
// receive audio packets, and forward the audio data and format
// to the main thread.

if (!parentPort) {
    throw new Error('This script must be run as a worker thread.');
}

const log = (message, level = 'log') => parentPort.postMessage({ type: 'log', data: message, level });

log('[Network Worker] Starting VBAN server on port 7000...');

const server = new VBANServer();
let currentFormat = null;
let speaker = null;

server.on('message', (packet) => {
    if (packet instanceof VBANAudioPacket) {
        // Check if the audio format has changed.
        const newFormat = {
            channels: packet.nbChannel,
            bitDepth: packet.bitResolutionObject.bitDepth,
            sampleRate: packet.sr,
            signed: packet.bitResolutionObject.signed,
            float: packet.bitResolutionObject.float
        };

        if (JSON.stringify(currentFormat) !== JSON.stringify(newFormat)) {
            currentFormat = newFormat;
            if (speaker) {
                speaker.end();
            }
            speaker = new Speaker({
                channels: newFormat.channels,
                bitDepth: packet.bitResolutionObject.bitDepth,
                sampleRate: packet.sr
            });

            log('[Worker Thread] Speaker initialized.');
        }

        if (speaker) {
            // Write the audio buffer to the speaker.
            speaker.write(packet.data);
        } else {
            log('[Worker Thread] Received audio data but speaker is not initialized.', 'warn');
        }

        if (packet instanceof VBANAudioPacket && packet.bitResolution === EBitsResolutions.VBAN_DATATYPE_INT16) {
            // This simple visualizer only supports 16-bit integer audio for now.
            let peak = 0;
            const dataView = new DataView(packet.data.buffer, packet.data.byteOffset);

            // Iterate through samples to find the peak absolute value
            for (let i = 0; i < packet.data.length; i += 2) {
                // 2 bytes per sample for 16-bit
                const sample = Math.abs(dataView.getInt16(i, true)); // true for little-endian
                if (sample > peak) {
                    peak = sample;
                }
            }

            parentPort.postMessage({
                type: 'audioLevel',
                data: { level: peak, channels: packet.nbChannel, bitDepth: packet.bitResolution, sampleRate: packet.sr }
            });
        }
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
