import dgram, { BindOptions, RemoteInfo, Socket } from 'node:dgram';
import type { AddressInfo } from 'net';
import type { Buffer } from 'node:buffer';
import { EventEmitter } from 'events';
import {
    EServiceFunction,
    EServicePINGApplicationType,
    EServicePINGFeatures,
    EServiceType,
    ESubProtocol,
    IPacketPingData,
    MAX_FRAME_COUNTER,
    VBANPacket,
    VBANPacketTypes,
    VBANPingPacket
} from './packets/index.js';
import { VBANProtocolFactory } from './VBANProtocolFactory.js';
import { IVBANServerOptions } from './IVBANServerOptions.js';
import { promisify } from 'node:util';
import os from 'node:os';

export interface VBANServerEvents {
    listening: () => void;
    error: (err: Error) => void;
    close: () => void;
    message: (packet: VBANPacketTypes, sender: RemoteInfo) => void;
}

export declare interface VBANServer {
    on<U extends keyof VBANServerEvents>(event: U, listener: VBANServerEvents[U]): this;

    emit<U extends keyof VBANServerEvents>(event: U, ...args: Parameters<VBANServerEvents[U]>): boolean;
}

export class VBANServer extends EventEmitter {
    public readonly UDPServer: Socket;
    private readonly options: IVBANServerOptions;

    private readonly frameCounter: Map<ESubProtocol, number> = new Map<ESubProtocol, number>();

    public isListening = false;

    constructor(options?: IVBANServerOptions) {
        super();
        this.UDPServer = dgram.createSocket('udp4');

        this.options = options || {};
        if (this.options.autoReplyToPing === undefined) {
            this.options.autoReplyToPing = true;
        }

        //listen to server messages
        this.UDPServer.on('listening', (...args) => {
            this.emit('listening', ...args);
            this.isListening = true;
        });
        this.UDPServer.on('close', () => {
            this.isListening = false;
        });
        this.UDPServer.on('error', (...args) => {
            this.emit('error', ...args);
        });
        this.UDPServer.on('message', this.messageHandler.bind(this));
    }

    public address(): AddressInfo {
        return this.UDPServer.address();
    }

    bind(port?: number, address?: string): Promise<void>;
    bind(port?: number): Promise<void>;
    bind(): Promise<void>;
    bind(options: BindOptions): Promise<void>;
    public bind(...args: []): Promise<void> {
        return new Promise<void>((resolve) => {
            this.UDPServer.bind(...args, resolve);
        });
    }

    private getFrameCounter(protocol: ESubProtocol): number {
        let frameCounter = this.frameCounter.get(protocol) ?? 0;
        if (frameCounter >= MAX_FRAME_COUNTER) {
            frameCounter = 0;
        }
        this.frameCounter.set(protocol, ++frameCounter);
        return frameCounter;
    }

    public send(packet: VBANPacket, port: number, address: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            packet.frameCounter = this.getFrameCounter(packet.subProtocol);
            this.UDPServer.send(VBANProtocolFactory.toUDPBuffer(packet), port, address, (error: Error | null) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
    }

    public sendPing(receiver: { address: string; port: number }, isReply = false): Promise<void> {
        const frameCounter = this.getFrameCounter(ESubProtocol.SERVICE);

        const defaultApp: Omit<IPacketPingData, 'hostname'> = {
            applicationName: 'Test application',
            manufacturerName: 'Anonymous',
            applicationType: EServicePINGApplicationType.SERVER,
            features: [EServicePINGFeatures.AUDIO, EServicePINGFeatures.MIDI, EServicePINGFeatures.TXT, EServicePINGFeatures.SERIAL],
            bitFeatureEx: 0,
            PreferredRate: 0,
            minRate: 6000,
            maxRate: 705600,
            color: { blue: 0, green: 128, red: 128 },
            nVersion: 12345,
            GPSPosition: '',
            userPosition: '',
            langCode: 'fr-fr',
            reservedASCII: '',
            reservedEx: '',
            reservedEx2: '',
            deviceName: 'NodeJs Server',
            userName: '',
            userComment: ''
        };
        const application = Object.assign(defaultApp, this.options.application);

        const answerPacket = new VBANPingPacket(
            {
                streamName: 'VBAN Service',
                service: EServiceType.IDENTIFICATION,
                serviceFunction: EServiceFunction.PING0,
                frameCounter,
                isReply
            },
            {
                applicationName: application.applicationName,
                manufacturerName: application.manufacturerName,
                applicationType: application.applicationType,
                features: application.features,
                bitFeatureEx: application.bitFeatureEx,
                PreferredRate: application.PreferredRate,
                minRate: application.minRate,
                maxRate: application.maxRate,
                color: application.color,
                nVersion: application.nVersion,
                GPSPosition: application.GPSPosition,
                userPosition: application.userPosition,
                langCode: application.langCode,
                reservedASCII: application.reservedASCII,
                reservedEx: application.reservedEx,
                reservedEx2: application.reservedEx2,
                deviceName: application.deviceName,
                hostname: application.hostname ?? os.hostname(),
                userName: application.userName,
                userComment: application.userComment
            }
        );

        //send the answer to receiver IP:port . (VM use listen port to send requests)
        return this.send(answerPacket, receiver.port, receiver.address);
    }

    private readonly messageHandler = async (msg: Buffer, sender: RemoteInfo): Promise<void> => {
        if (this.options.beforeProcessPacket) {
            if (!this.options.beforeProcessPacket(msg, sender)) {
                // 'packet will be skipped because beforeProcessPacket return false';
                return;
            }
        }

        const packet = VBANProtocolFactory.processPacket(msg);
        if (this.options.autoReplyToPing && packet instanceof VBANPingPacket && !packet.isReply) {
            await this.sendPing(sender, true);
        }
        this.emit('message', packet, sender);
    };

    public async close() {
        await promisify(this.UDPServer.close.bind(this.UDPServer))();
        this.emit('close');
    }
}
