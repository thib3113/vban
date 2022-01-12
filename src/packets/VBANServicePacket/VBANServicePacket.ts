import { VBANPacket } from '../VBANPacket';
import { ESubProtocol } from '../ESubProtocol';
import { EServicePINGApplicationType } from './EServicePINGApplicationType';
import { EServiceType } from './EServiceType';
import { IServicePing } from './IServicePing';
import { Buffer } from 'buffer';
import { cleanPacketString, prepareStringForPacket } from '../../commons';
import { EServicePINGFeatures } from './EServicePINGFeatures';
import { IVBANHeaderService } from './IVBANHeaderService';

export class VBANServicePacket extends VBANPacket {
    public static subProtocol: ESubProtocol = ESubProtocol.SERVICE;
    public subProtocol: ESubProtocol = VBANServicePacket.subProtocol;
    public service: EServiceType;
    public serviceFunction: number;
    public isReply: boolean = false;

    public data: IServicePing;

    constructor(headers: IVBANHeaderService, data: IServicePing) {
        super({
            ...headers,
            sp: VBANServicePacket.subProtocol,
            sr: 0
        });

        this.service = headers.service;
        this.serviceFunction = headers.serviceFunction;
        this.isReply = headers.isReply ?? false;

        this.data = data;
    }

    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer): VBANServicePacket {
        const headers = this.prepareFromUDPPacket(headersBuffer);

        const fn = headers.part1;
        const serviceFunction = fn & 0b01111111;
        const isReply = (fn & 0b10000000) >= 1;
        const service = headers.part2;
        if (!EServiceType[service]) {
            throw new Error(`unknown service ${service}`);
        }

        let currentByte = 0;
        const getXNextBytes = (size: number): Buffer => {
            const b = dataBuffer.slice(currentByte, currentByte + size);
            currentByte += size;
            return b;
        };

        const bitType = getXNextBytes(4).readUInt32LE();
        const applicationType = EServicePINGApplicationType[bitType] ? bitType : EServicePINGApplicationType.UNKNOWN;
        const bitFeature = getXNextBytes(4).readUInt32LE();
        const features = (Object.entries(EServicePINGFeatures).filter(([k]) => isNaN(Number(k))) as Array<[string, EServicePINGFeatures]>)
            .filter(([, v]) => bitFeature & v)
            .map(([, v]) => v);
        const bitFeatureEx = getXNextBytes(4).readUInt32LE();
        const PreferredRate = getXNextBytes(4).readUInt32LE();
        const minRate = getXNextBytes(4).readUInt32LE();
        const maxRate = getXNextBytes(4).readUInt32LE();
        const colorRGB = getXNextBytes(4).readUInt32LE();
        const color = {
            blue: colorRGB & 255,
            green: (colorRGB >> 8) & 255,
            red: (colorRGB >> 16) & 255
        };
        const nVersion = getXNextBytes(4).readUInt32LE();
        const GPSPosition = cleanPacketString(getXNextBytes(8).toString('ascii'));
        const userPosition = cleanPacketString(getXNextBytes(8).toString('ascii'));
        const langCode = cleanPacketString(getXNextBytes(8).toString('ascii'));
        const reservedASCII = cleanPacketString(getXNextBytes(8).toString('ascii'));
        const reservedEx = cleanPacketString(getXNextBytes(64).toString('ascii'));
        const reservedEx2 = cleanPacketString(getXNextBytes(36).toString('ascii'));
        const deviceName = cleanPacketString(getXNextBytes(64).toString('ascii'));
        const manufacturerName = cleanPacketString(getXNextBytes(64).toString('ascii'));
        const applicationName = cleanPacketString(getXNextBytes(64).toString('ascii'));
        const reservedLongASCII = cleanPacketString(getXNextBytes(64).toString('ascii'));
        const userName = cleanPacketString(getXNextBytes(128).toString('utf8'));
        const userComment = cleanPacketString(getXNextBytes(128).toString('utf8'));

        //extract information
        const data = {
            applicationType,
            features,
            bitFeatureEx,
            PreferredRate,
            minRate,
            maxRate,
            color,
            nVersion,
            GPSPosition,
            userPosition,
            langCode,
            reservedASCII,
            reservedEx,
            reservedEx2,
            deviceName,
            manufacturerName,
            applicationName,
            reservedLongASCII,
            userName,
            userComment
        };

        return new VBANServicePacket(
            {
                ...headers,
                service,
                serviceFunction,
                isReply
            },
            data
        );
    }

    public static toUDPPacket(packet: VBANServicePacket): Buffer {
        // 704 is the size for a service packet
        const dataBuffer = Buffer.alloc(676);
        let offset = 0;

        offset = dataBuffer.writeUInt32LE(packet.data.applicationType, offset);
        let features = 0;
        packet.data.features.forEach((feature) => {
            if (EServicePINGFeatures[feature]) {
                features = features | feature;
            }
        });
        offset = dataBuffer.writeUInt32LE(features, offset);
        offset = dataBuffer.writeUInt32LE(packet.data.bitFeatureEx, offset);
        offset = dataBuffer.writeUInt32LE(packet.data.PreferredRate, offset);
        offset = dataBuffer.writeUInt32LE(packet.data.minRate, offset);
        offset = dataBuffer.writeUInt32LE(packet.data.maxRate, offset);

        const { red, green, blue } = packet.data.color;
        offset = dataBuffer.writeUInt32LE(((red & 255) << 16) | ((green & 255) << 8) | (blue & 255), offset);

        offset = dataBuffer.writeUInt32LE(packet.data.nVersion, offset);

        offset += dataBuffer.write(prepareStringForPacket(packet.data.GPSPosition, 8), offset, 'ascii');
        offset += dataBuffer.write(prepareStringForPacket(packet.data.userPosition, 8), offset, 'ascii');
        offset += dataBuffer.write(prepareStringForPacket(packet.data.langCode, 8), offset, 'ascii');
        offset += dataBuffer.write(prepareStringForPacket(packet.data.reservedASCII, 8), offset, 'ascii');
        offset += dataBuffer.write(prepareStringForPacket(packet.data.reservedEx, 64), offset, 'ascii');
        offset += dataBuffer.write(prepareStringForPacket(packet.data.reservedEx2, 36), offset, 'ascii');
        offset += dataBuffer.write(prepareStringForPacket(packet.data.deviceName, 64), offset, 'ascii');
        offset += dataBuffer.write(prepareStringForPacket(packet.data.manufacturerName, 64), offset, 'ascii');
        offset += dataBuffer.write(prepareStringForPacket(packet.data.applicationName, 64), offset, 'ascii');
        offset += dataBuffer.write(prepareStringForPacket(packet.data.reservedLongASCII, 64), offset, 'ascii');
        offset += dataBuffer.write(prepareStringForPacket(packet.data.userName, 128), offset, 'utf8');
        dataBuffer.write(prepareStringForPacket(packet.data.userComment, 128), offset, 'utf8');

        return this.convertToUDPPacket(
            {
                streamName: packet.streamName,
                sp: packet.subProtocol,
                sr: packet.sr,
                frameCounter: packet.frameCounter,
                part1: ((packet.isReply ? 0b10000000 : 0) & 0b10000000) | (packet.serviceFunction & 0b01111111),
                part2: packet.service,
                part3: 0
            },
            dataBuffer,
            packet.sr
        );
    }
}
