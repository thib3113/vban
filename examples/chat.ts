import * as readline from 'readline';
import { EServiceFunction, EServicePINGApplicationType, EServiceType, VBANPacketTypes, VBANServer } from '../src';
import * as os from 'node:os';
import { VBANPingPacket, VBANChatPacket } from '../src';
import { RemoteInfo } from 'dgram';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class Chat {
    remoteChatter?: {
        port: number;
        username?: string;
        address: string;
    };
    private readonly server: VBANServer;

    constructor() {
        this.server = new VBANServer({
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

        this.server.on('error', async (err) => {
            console.log(`server error:\n${err.stack}`);
            await this.server.close();
            process.exit(1);
        });

        this.server.on('message', this.getVBANPacketHandler());
    }

    public start() {
        rl.question('IP Address : ', (address: string) => {
            rl.question('Port : ', async (strPort: string) => {
                await this.connect(address, parseInt(strPort));
                rl.on('line', (input: string) => {
                    this.sendMessage(input);
                });
            });
        });
    }

    private getVBANPacketHandler() {
        return async (packet: VBANPacketTypes, sender: RemoteInfo) => {
            if (packet instanceof VBANPingPacket) {
                return this.handlePing(packet, sender);
            }
            if (packet instanceof VBANChatPacket) {
                return this.handleChatPacket(packet, sender);
            }
        };
    }

    private handlePing(packet: VBANPingPacket, sender: RemoteInfo) {
        if (this.remoteChatter && sender.address === this.remoteChatter.address) {
            const username = packet.data.userName ?? packet.data.hostnameASCII ?? packet.data.deviceName;
            console.log(`# receive ping from ${username} (${sender.address}:${sender.port})`);

            this.remoteChatter.username = username;
        }
    }

    private async connect(address: string, port: number) {
        this.remoteChatter = {
            port,
            address
        };
        await this.server.bind(port);

        console.log(`# send ping to ${address}:${port}`);
        await this.server.sendPing({
            address,
            port
        });
    }

    private async handleChatPacket(packet: VBANChatPacket, sender: RemoteInfo) {
        if (this.remoteChatter && this.remoteChatter.address === sender.address) {
            const alert = ['<nudge>', '<alert>'].includes(packet.data);
            if (alert) {
                this.ringBell();
            }

            console.log(`(${this.remoteChatter.username ?? this.remoteChatter.address}) ${alert ? '!' : ''}> ${packet.data}`);
        }
    }

    private ringBell() {
        process.stdout.write('\x07');
    }

    private async sendMessage(input: string) {
        if (!this.remoteChatter) {
            console.error(`no chatter connected`);
            return;
        }

        await this.server.send(
            new VBANChatPacket(
                {
                    streamName: 'VBAN Service',
                    service: EServiceType.CHATUTF8,
                    serviceFunction: EServiceFunction.PING0,
                    isReply: false
                },
                input
            ),
            this.remoteChatter.port,
            this.remoteChatter.address
        );
    }
}

new Chat().start();
