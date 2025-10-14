import { parentPort } from 'node:worker_threads';
import { VBANServer, VBANChatPacket, VBANPingPacket, EServicePINGApplicationType, EServiceType, EServiceFunction } from 'vban';
import os from 'node:os';

if (!parentPort) {
    throw new Error('This script must be run as a worker thread.');
}

// Helper to send logs to the main thread
const log = (message) => parentPort.postMessage({ type: 'log', data: `[Network Worker] ${message}` });

let server;
let remoteChatter;

// Listen for commands from the main thread
parentPort.on('message', (message) => {
    const { type, data } = message;

    if (type === 'connect') {
        remoteChatter = { address: data.address, port: data.port };
        initializeServer(data.port);
    }

    if (type === 'sendMessage') {
        sendMessage(data.text);
    }
});

function initializeServer(port) {
    log(`Initializing server...`);
    server = new VBANServer({
        autoReplyToPing: true,
        application: {
            applicationName: 'VBAN chat Example',
            manufacturerName: 'Anonymous',
            applicationType: EServicePINGApplicationType.SERVER,
            color: { blue: 74, green: 232, red: 57 },
            nVersion: 12345,
            GPSPosition: '',
            userPosition: '',
            langCode: 'en',
            deviceName: 'NodeJs Server',
            hostname: os.hostname(),
            userName: '',
            userComment: ''
        }
    });

    server.on('error', async (err) => {
        log(`Server error: ${err.stack}`);
        if (server) await server.close();
    });

    server.on('message', (packet, rinfo) => {
        // Only process messages from the connected peer
        if (rinfo.address !== remoteChatter.address) return;

        if (packet instanceof VBANPingPacket && !packet.isReply) {
            const username = packet.data.userName || packet.data.hostname || packet.data.deviceName || 'Unknown';
            parentPort.postMessage({
                type: 'pingInfo',
                data: { username, address: rinfo.address, port: rinfo.port }
            });
        }

        if (packet instanceof VBANChatPacket) {
            const isAlert = ['<nudge>', '<alert>'].includes(packet.data);
            parentPort.postMessage({
                type: 'chatMessage',
                data: { text: packet.data, isAlert }
            });
        }
    });

    server.bind(port).then(() => {
        log(`Server listening on port ${port}.`);
        log(`Sending initial PING to ${remoteChatter.address}:${remoteChatter.port}`);
        server.sendPing(remoteChatter);
    });
}

function sendMessage(text) {
    if (!server || !remoteChatter) {
        log('Cannot send message, server not ready.');
        return;
    }

    const chatPacket = new VBANChatPacket(
        {
            streamName: 'VBAN Service',
            service: EServiceType.CHATUTF8,
            serviceFunction: EServiceFunction.PING0,
            isReply: false
        },
        text
    );

    server.send(chatPacket, remoteChatter.port, remoteChatter.address);
}
