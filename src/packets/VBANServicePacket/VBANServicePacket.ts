import { VBANPacket } from '../VBANPacket';
import Buffer from 'buffer';
import { ESubProtocol } from '../ESubProtocol';
import { EServicePINGApplicationType } from './EServicePINGApplicationType';
import { EServicePINGFeatures } from './EServicePINGFeatures';
import { EServiceType } from './EServiceType';
import { IServicePing } from './IServicePing';
import { IVBANHeader } from '../IVBANHeader';

export interface IVBANHeaderService extends IVBANHeader {
    service: EServiceType;
    serviceFunction: number;
    isReply: boolean;
}

export class VBANServicePacket extends VBANPacket {
    public subProtocol: ESubProtocol = ESubProtocol.AUDIO;
    public service: EServiceType;
    public serviceFunction: number;
    public isReply: boolean;

    public data: IServicePing;

    constructor(headers: IVBANHeaderService, data: IServicePing) {
        super(headers);

        this.service = headers.service;
        this.serviceFunction = headers.serviceFunction;
        this.isReply = headers.isReply;

        this.data = data;
    }

    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer): VBANServicePacket {
        const headers = this.prepareFromUDPPacket(headersBuffer);

        const sr = 0;

        const fn = headers.part1;
        const serviceFunction = fn & 0b01111111;
        const isReply = (fn & 0b10000000) === 1;
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
        // const features = (Object.entries(EServicePINGFeatures).filter(([k]) => isNaN(Number(k))) as Array<[string, EServicePINGFeatures]>)
        //     .filter(([, v]) => bitFeature & v)
        //     .map(([k]) => k);
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
        const GPSPosition = getXNextBytes(8).toString('ascii');
        const userPosition = getXNextBytes(8).toString('ascii');
        const LangCode = getXNextBytes(8).toString('ascii');
        const reservedASCII = getXNextBytes(8).toString('ascii');
        const reservedEx = getXNextBytes(64).toString('ascii');
        const reservedEx2 = getXNextBytes(36).toString('ascii');
        const deviceName = getXNextBytes(64).toString('ascii');
        const manufacturerName = getXNextBytes(64).toString('ascii');
        const applicationName = getXNextBytes(64).toString('ascii');
        const reservedLongASCII = getXNextBytes(64).toString('ascii');
        const userName = getXNextBytes(128).toString('utf8');
        const userComment = getXNextBytes(128).toString('utf8');

        //extract information
        const data = {
            applicationType,
            bitFeature,
            bitFeatureEx,
            PreferredRate,
            minRate,
            maxRate,
            color,
            nVersion,
            GPSPosition,
            userPosition,
            LangCode,
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
}
