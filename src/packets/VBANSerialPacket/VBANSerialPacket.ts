import { VBANPacket } from '../VBANPacket';
import { ESubProtocol } from '../ESubProtocol';
import { BITS_SPEEDS, EFormatBit, serialStopModes } from '../../commons';
import { ISerialBitMode } from './ISerialBitMode';
import { ESerialStreamType } from './ESerialStreamType';
import { IVBANHeaderTXT } from './IVBANHeaderTXT';
import { Buffer } from 'buffer';

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

    public static toUDPPacket(packet: VBANSerialPacket): Buffer {
        let part1 = 0;

        const mode = serialStopModes.find((m) => m.stop === packet.bitMode.stop)?.mode;
        if (mode === undefined) {
            throw new Error(`fail to found mode for stop ${packet.bitMode.stop}`);
        }
        part1 |= mode & 0b00000011;

        if (packet.bitMode.start) {
            part1 |= 0b00000100;
        }

        if (packet.bitMode.parity) {
            part1 |= 0b00001000;
        }

        if (packet.bitMode.multipart) {
            part1 |= 0b10000000;
        }

        return this.convertToUDPPacket(
            {
                streamName: packet.streamName,
                sp: packet.subProtocol,
                sr: packet.sr,
                frameCounter: packet.frameCounter,
                part1,
                part2: packet.channelsIdents,
                part3: (packet.formatBit & 0b00000111) | (packet.streamType & 0b11110000)
            },
            packet.data
        );
    }

    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer): VBANSerialPacket {
        const headers = this.prepareFromUDPPacket(headersBuffer);

        if (!BITS_SPEEDS[headers.rawSampleRate]) {
            throw new Error(`unknown bits speed ${headers.rawSampleRate}`);
        }

        const bps = BITS_SPEEDS[headers.rawSampleRate] as number;

        const bitModeRaw = headers.part1;

        const stopMode = bitModeRaw & 0b00000011;

        const stop = serialStopModes.find((m) => m.mode === stopMode)?.stop ?? null;

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
