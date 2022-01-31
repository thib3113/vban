import type { BindOptions, RemoteInfo, Socket } from 'dgram';
import type { AddressInfo } from 'net';
import { EventEmitter } from 'events';
import {
    EServiceFunction,
    EServicePINGApplicationType,
    EServicePINGFeatures,
    EServiceType,
    ESubProtocol,
    IServicePing,
    MAX_FRAME_COUNTER,
    VBANPacket,
    VBANPacketTypes,
    VBANServicePacket
} from './packets';
import { VBANProtocolFactory } from './VBANProtocolFactory';
import { IVBANServerOptions } from './IVBANServerOptions';

export interface VBANServerEvents {
    listening: () => void;
    error: (err: Error) => void;
    message: (packet: VBANPacketTypes, sender: RemoteInfo) => void;
}

export declare interface VBANServer {
    on<U extends keyof VBANServerEvents>(event: U, listener: VBANServerEvents[U]): this;

    emit<U extends keyof VBANServerEvents>(event: U, ...args: Parameters<VBANServerEvents[U]>): boolean;
}

export class VBANServer extends EventEmitter {
    public readonly UDPServer: Socket;
    private os: { hostname: () => string };
    private options: IVBANServerOptions;

    private frameCounter: Map<ESubProtocol, number> = new Map<ESubProtocol, number>();

    public isListening = false;

    constructor(options?: IVBANServerOptions) {
        super();
        //first check dependencies
        try {
            this.UDPServer = require('dgram').createSocket('udp4');
        } catch (e) {
            throw new Error('fail to open udp4 socket. Is dgram dependency available ?');
        }

        try {
            this.os = require('os');
        } catch (e) {
            throw new Error('fail to retrieve OS informations. Is os dependency available ?');
        }

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

    // on('message', packet:VBANPacketTypes): void;

    bind(port?: number, address?: string, callback?: () => void): this;
    bind(port?: number, callback?: () => void): this;
    bind(callback?: () => void): this;
    bind(options: BindOptions, callback?: () => void): this;
    public bind(...args: []): this {
        this.UDPServer.bind(...args);
        return this;
    }

    private getFrameCounter(protocol: ESubProtocol) {
        let frameCounter = this.frameCounter.get(protocol) || 0;
        if (frameCounter >= MAX_FRAME_COUNTER) {
            frameCounter = 0;
        }
        this.frameCounter.set(protocol, ++frameCounter);
        return frameCounter;
    }

    public send(packet: VBANPacket, port: number, address: string) {
        packet.frameCounter = this.getFrameCounter(packet.subProtocol);
        this.UDPServer.send(VBANProtocolFactory.toUDPBuffer(packet), port, address);
    }

    public sendPing(sender: { address: string; port: number }, isReply = false): void {
        let frameCounter = this.getFrameCounter(ESubProtocol.SERVICE);

        const defaultApp: Omit<IServicePing, 'reservedLongASCII'> = {
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

        const answerPacket = new VBANServicePacket(
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
                reservedLongASCII: this.os.hostname(),
                userName: application.userName,
                userComment: application.userComment
            }
        );

        //send the answer to sender IP:port . (VM use listen port to send requests)
        this.send(answerPacket, sender.port, sender.address);
    }

    private messageHandler = (msg: Buffer, sender: RemoteInfo): void => {
        console.log(msg.toString('hex'));
        if (this.options.beforeProcessPacket) {
            if (!this.options.beforeProcessPacket(msg, sender)) {
                // 'packet will be skipped because beforeProcessPacket return false';
                return;
            }
        }

        const packet = VBANProtocolFactory.processPacket(msg);
        if (
            this.options.autoReplyToPing &&
            packet instanceof VBANServicePacket &&
            packet.service == EServiceType.IDENTIFICATION &&
            !packet.isReply
        ) {
            this.sendPing(sender, true);
        }
        this.emit('message', packet, sender);
    };

    public close(cb?: () => void) {
        this.UDPServer.close(cb);
    }
}
