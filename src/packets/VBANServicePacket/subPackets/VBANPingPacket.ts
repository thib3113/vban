import { VBANServicePacket } from '../VBANServicePacket.js';
import { IVBANHeaderService } from '../IVBANHeaderService.js';
import { IPacketPingData } from '../IPacketPingData.js';
import { Buffer } from 'node:buffer';
import { EServiceType } from '../EServiceType.js';
import { EServicePINGApplicationType } from '../EServicePINGApplicationType.js';
import { EServicePINGFeatures } from '../EServicePINGFeatures.js';
import { cleanPacketString, prepareStringForPacket } from '../../../commons.js';
import { IVBANHeaderCommon } from '../../IVBANHeaderCommon.js';

const PING_FEATURES_VALUES = Object.values(EServicePINGFeatures).filter((v) => typeof v === 'number') as EServicePINGFeatures[];

export class VBANPingPacket extends VBANServicePacket {
    public data: IPacketPingData;
    constructor(headers: IVBANHeaderService, data: IPacketPingData) {
        super(headers);

        this.data = data;
    }

    public static fromUDPPacket(headers: IVBANHeaderCommon, dataBuffer: Buffer): VBANServicePacket {
        const fn = headers.part1;
        const serviceFunction = fn & 0b01111111;
        const isReply = (fn & 0b10000000) >= 1;

        let offset = 0;

        const bitType = dataBuffer.readUInt32LE(offset);
        offset += 4;
        const applicationType = EServicePINGApplicationType[bitType] ? bitType : EServicePINGApplicationType.UNKNOWN;

        const bitFeature = dataBuffer.readUInt32LE(offset);
        offset += 4;
        const features: EServicePINGFeatures[] = [];
        for (let i = 0; i < PING_FEATURES_VALUES.length; i++) {
            const value = PING_FEATURES_VALUES[i];
            if ((bitFeature & value) === value) {
                features.push(value);
            }
        }

        const bitFeatureEx = dataBuffer.readUInt32LE(offset);
        offset += 4;
        const PreferredRate = dataBuffer.readUInt32LE(offset);
        offset += 4;
        const minRate = dataBuffer.readUInt32LE(offset);
        offset += 4;
        const maxRate = dataBuffer.readUInt32LE(offset);
        offset += 4;
        const colorRGB = dataBuffer.readUInt32LE(offset);
        offset += 4;
        const color = {
            blue: colorRGB & 255,
            green: (colorRGB >> 8) & 255,
            red: (colorRGB >> 16) & 255
        };
        const nVersion = dataBuffer.readUInt32LE(offset);
        offset += 4;

        const GPSPosition = cleanPacketString(dataBuffer.toString('ascii', offset, offset + 8));
        offset += 8;
        const userPosition = cleanPacketString(dataBuffer.toString('ascii', offset, offset + 8));
        offset += 8;
        const langCode = cleanPacketString(dataBuffer.toString('ascii', offset, offset + 8));
        offset += 8;
        const reservedASCII = cleanPacketString(dataBuffer.toString('ascii', offset, offset + 8));
        offset += 8;
        const reservedEx = cleanPacketString(dataBuffer.toString('ascii', offset, offset + 64));
        offset += 64;
        const reservedEx2 = cleanPacketString(dataBuffer.toString('ascii', offset, offset + 36));
        offset += 36;
        const deviceName = cleanPacketString(dataBuffer.toString('ascii', offset, offset + 64));
        offset += 64;
        const manufacturerName = cleanPacketString(dataBuffer.toString('ascii', offset, offset + 64));
        offset += 64;
        const applicationName = cleanPacketString(dataBuffer.toString('ascii', offset, offset + 64));
        offset += 64;
        const hostnameASCII = cleanPacketString(dataBuffer.toString('ascii', offset, offset + 64));
        offset += 64;
        const userName = cleanPacketString(dataBuffer.toString('utf8', offset, offset + 128));
        offset += 128;
        const userComment = cleanPacketString(dataBuffer.toString('utf8', offset, offset + 128));
        offset += 128;

        //extract information
        const data: IPacketPingData = {
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
            hostname: hostnameASCII,
            userName,
            userComment
        };

        return new VBANPingPacket(
            {
                ...headers,
                service: EServiceType.IDENTIFICATION,
                serviceFunction,
                isReply
            },
            data
        );
    }

    public toUDPPacket(): ReturnType<(typeof VBANPingPacket)['toUDPPacket']> {
        return VBANPingPacket.toUDPPacket(this);
    }

    public static toUDPPacket(packet: VBANPingPacket): Buffer {
        // 704 is the size for a service packet
        const dataBuffer = Buffer.alloc(676);
        let offset = 0;

        offset = dataBuffer.writeUInt32LE(packet.data.applicationType, offset);
        let features = 0;
        for (const feature of packet.data.features) {
            if (EServicePINGFeatures[feature]) {
                features = features | feature;
            }
        }
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
        offset += dataBuffer.write(prepareStringForPacket(packet.data.hostname, 64), offset, 'ascii');
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
