import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import readline from 'node:readline';

// This is the main thread. It handles all user interface (console input/output)
// and communicates with the worker thread for all networking tasks.

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('[Main Thread] Starting Advanced Chat...');

const __filename = fileURLToPath(import.meta.url);
const workerPath = path.resolve(path.dirname(__filename), 'worker.js');
const worker = new Worker(workerPath);

let remoteUsername = 'Remote';

// Listen for messages from the network worker
worker.on('message', (message) => {
    const { type, data } = message;

    switch (type) {
        case 'log':
            // Clear the current line to prevent UI glitches with readline
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            console.log(data);
            rl.prompt(true); // Redraw the prompt
            break;

        case 'pingInfo':
            remoteUsername = data.username;
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            console.log(`# Connected to ${remoteUsername} (${data.address}:${data.port})`);
            rl.setPrompt(`You > `);
            rl.prompt(true);
            break;

        case 'chatMessage':
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            // Ring bell on alert
            if (data.isAlert) {
                process.stdout.write('\x07');
            }
            console.log(`(${remoteUsername}) > ${data.text}`);
            rl.prompt(true);
            break;
    }
});

worker.on('error', (err) => {
    console.error('[Main Thread] Worker encountered an error:', err);
});

worker.on('exit', (code) => {
    console.log(`\n[Main Thread] Worker stopped with exit code ${code}.`);
    rl.close();
});

// Start the connection process
rl.question('IP Address to connect to: ', (address) => {
    // VBAN Chat seems to require to listen and answer on the same port ?
    rl.question('Port to use (listen and connect): ', (portStr) => {
        const port = Number.parseInt(portStr, 10);
        if (isNaN(port)) {
            console.error('Invalid port number.');
            process.exit(1);
        }

        // Tell the worker to initialize the connection
        worker.postMessage({
            type: 'connect',
            data: { address, port }
        });

        // Listen for user input to send messages
        rl.on('line', (input) => {
            if (input.trim()) {
                worker.postMessage({ type: 'sendMessage', data: { text: input } });
            }
            rl.prompt(true);
        });
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Main Thread] Shutting down...');
    worker.terminate().then(() => {
        console.log('[Main Thread] Worker terminated.');
        process.exit(0);
    });
});
