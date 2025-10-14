import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// This is the main thread. It spawns a worker to handle networking
// and then focuses on playing the audio it receives from that worker.

console.log('[Main Thread] Starting...');

const __filename = fileURLToPath(import.meta.url);
const workerPath = path.resolve(path.dirname(__filename), 'worker.js');
const worker = new Worker(workerPath);

const BAR_WIDTH = 50;
const MAX_LEVEL = 32768; // Max amplitude for 16-bit signed audio

let vueResetTimeout = null;

function renderVuMeter(level, channelCount, sampleRate) {
    if (vueResetTimeout) {
        clearTimeout(vueResetTimeout);
    }

    vueResetTimeout = setTimeout(() => {
        renderVuMeter(0, channelCount, sampleRate);
    }, 100);

    const percentage = Math.min(level / MAX_LEVEL, 1);
    const filledLength = Math.round(BAR_WIDTH * percentage);
    const emptyLength = BAR_WIDTH - filledLength;

    const bar = '█'.repeat(filledLength) + ' '.repeat(emptyLength);
    const levelDb = 20 * Math.log10(level / MAX_LEVEL);
    const dbString = Number.isFinite(levelDb) ? `${levelDb.toFixed(1)} dB` : '-inf dB';

    // Using process.stdout.write and '\r' to overwrite the line
    process.stdout.write(`[${channelCount}ch|${sampleRate / 1000}kHz] |${bar}| ${dbString.padEnd(10)}\r`);
}

worker.on('message', (message) => {
    const { type, data } = message;

    if (type === 'log') {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        console[message.level](data);
        return;
    }

    if (type === 'audioLevel') {
        renderVuMeter(data.level, data.channels, data.sampleRate);
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
