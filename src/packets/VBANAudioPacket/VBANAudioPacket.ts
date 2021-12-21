import { VBANPacket } from '../VBANPacket';
import { ESubProtocol } from '../ESubProtocol';
import { EBitsResolutions } from './EBitsResolutions';
import { ECodecs } from './ECodecs';
import { IVBANHeaderAudio } from './IVBANHeaderAudio';
import { Buffer } from 'buffer';

export class VBANAudioPacket extends VBANPacket {
    public subProtocol: ESubProtocol = ESubProtocol.AUDIO;
    public nbSample: number;
    public nbChannel: number;
    public bitResolution: number;
    public codec: number;

    public data: Buffer;

    constructor(headers: IVBANHeaderAudio, data: Buffer) {
        super(headers);

        this.nbSample = headers.nbSample;
        this.nbChannel = headers.nbChannel;
        this.bitResolution = headers.bitResolution;
        this.codec = headers.codec;

        this.data = data;
    }

    public static toUDPPacket(packet: VBANAudioPacket): Buffer {
        return this.convertToUDPPacket(
            {
                streamName: packet.streamName,
                sp: packet.subProtocol,
                sr: packet.sr,
                frameCounter: packet.frameCounter,
                part1: packet.nbSample - 1,
                part2: packet.nbChannel - 1,
                part3: (packet.bitResolution & 0b0000111) | (packet.codec & 0b11110000)
            },
            packet.data
        );
    }

    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer): VBANAudioPacket {
        const headers = this.prepareFromUDPPacket(headersBuffer);
        const nbSample = headers.part1 + 1;
        const nbChannel = headers.part2 + 1;

        // Data Format / Codec (3 + 1 + 4 bits)
        const dataFormatAndCodec = headers.part3;

        const bitResolution = dataFormatAndCodec & 0b0000111;
        if (!EBitsResolutions[bitResolution]) {
            throw new Error(`unknown bit resolution ${bitResolution}`);
        }

        // Ignore 1 bit
        const codec = dataFormatAndCodec & 0b11110000;
        if (!ECodecs[codec]) {
            throw new Error(`unknown codec ${codec}`);
        }

        return new VBANAudioPacket(
            {
                ...headers,
                nbSample,
                nbChannel,
                bitResolution,
                codec
            },
            dataBuffer
        );
    }

    public static bitResolutions: Record<number, { bitDepth: number; signed: boolean; float: boolean }> = {
        0: { bitDepth: 8, signed: false, float: false },
        1: { bitDepth: 16, signed: true, float: false },
        2: { bitDepth: 24, signed: true, float: false },
        3: { bitDepth: 32, signed: true, float: false },
        4: { bitDepth: 32, signed: true, float: true },
        5: { bitDepth: 64, signed: true, float: true },
        6: { bitDepth: 12, signed: true, float: false },
        7: { bitDepth: 10, signed: true, float: false }
    };
}
