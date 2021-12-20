import { VBANPacket } from '../VBANPacket';
import Buffer from 'buffer';
import { ESubProtocol } from '../ESubProtocol';
import { EBitsResolutions } from './EBitsResolutions';
import { ECodecs } from './ECodecs';
import { IVBANHeaderAudio } from './IVBANHeaderAudio';

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

    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer): VBANAudioPacket {
        const headers = this.prepareFromUDPPacket(headersBuffer);
        const nbSample = headers.part1 + 1;
        const nbChannel = headers.part2 + 1;

        // Data Format / Codec (3 + 1 + 4 bits)
        const dataFormatAndCodec = headers.part3;

        const bitResolution = dataFormatAndCodec & 3;
        if (!EBitsResolutions[bitResolution]) {
            throw new Error(`unknown bit resolution ${bitResolution}`);
        }

        // Ignore 1 bit
        const codec = (dataFormatAndCodec >> 4) << 4; // 4 bits
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
