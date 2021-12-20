import { VBANPacket } from '../VBANPacket';
import Buffer from 'buffer';
import { ESubProtocol } from '../ESubProtocol';
import { BITS_SPEEDS, EFormatBit } from '../../commons';
import { ISerialBitMode } from './ISerialBitMode';
import { ESerialStreamType } from './ESerialStreamType';
import { IVBANHeaderTXT } from './IVBANHeaderTXT';

export class VBANSerialPacket extends VBANPacket {
    public subProtocol: ESubProtocol = ESubProtocol.SERIAL;
    public bitMode: ISerialBitMode;
    public channelsIdents: number;
    public bps: number;
    public formatBit: EFormatBit;
    public streamType: ESerialStreamType;

    public data: Buffer;

    constructor(headers: IVBANHeaderTXT, data: Buffer) {
        super(headers);

        this.bitMode = headers.bitMode;
        this.channelsIdents = headers.channelsIdents;
        this.bps = headers.bps;
        this.formatBit = headers.formatBit;
        this.streamType = headers.streamType;

        this.data = data;
    }

    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer): VBANSerialPacket {
        const headers = this.prepareFromUDPPacket(headersBuffer);

        if (!BITS_SPEEDS[headers.rawSampleRate]) {
            throw new Error(`unknown bits speed ${headers.rawSampleRate}`);
        }

        const bps = BITS_SPEEDS[headers.rawSampleRate] as number;

        const bitModeRaw = headers.part1;

        const stopMode = bitModeRaw & 0b00000011;
        let stop: number | null;
        switch (stopMode) {
            case 0:
                stop = 1;
                break;
            case 1:
                stop = 1.5;
                break;
            case 2:
                stop = 2;
                break;
            case 3:
            default:
                stop = null;
        }

        const start = (bitModeRaw & 0b00000100) === 4;
        const parity = (bitModeRaw & 0b00001000) === 8;
        const multipart = (bitModeRaw & 0b10000000) === 128;

        const bitMode = {
            stop,
            start,
            parity,
            multipart
        };

        const channelsIdents = headers.part2;

        const dataFormat = headers.part3;
        const formatBit = dataFormat & 0b00000111;
        if (!EFormatBit[formatBit]) {
            throw new Error(`unknown format bit ${formatBit}`);
        }

        const streamType = dataFormat & 0b11110000;
        if (!ESerialStreamType[streamType]) {
            throw new Error(`unknown stream type ${streamType}`);
        }

        return new VBANSerialPacket(
            {
                ...headers,
                bps,
                bitMode,
                channelsIdents,
                formatBit,
                streamType
            },
            dataBuffer
        );
    }
}
