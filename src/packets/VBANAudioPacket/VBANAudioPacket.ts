import { VBANPacket } from '../VBANPacket';
import { ESubProtocol } from '../ESubProtocol';
import { EBitsResolutions } from './EBitsResolutions';
import { ECodecs } from './ECodecs';
import { IVBANHeaderAudio } from './IVBANHeaderAudio';
import { Buffer } from 'buffer';
import { IBitResolution } from './IBitResolution';

export class VBANAudioPacket extends VBANPacket {
    /**
     * {@link VBANAudioPacket.subProtocol}
     */
    public static subProtocol: ESubProtocol = ESubProtocol.AUDIO;
    public subProtocol: ESubProtocol = VBANAudioPacket.subProtocol;
    /**
     * Number of sample is given by an 8 bits unsigned integer (0 – 255) where 0 means 1 sample and
     * 255 means 256 samples
     */
    public nbSample: number;
    /**
     * Number of channel is given by an 8 bits unsigned integer (0 – 255) where 0 means 1 channel
     * and 255 means 256 channels.
     */
    public nbChannel: number;
    /**
     * Data type used to store audio sample in the packet
     * Use it to select the correct bitResolution {@link VBANAudioPacket.bitResolutions}, or directly use {@link VBANAudioPacket.bitResolutionObject}
     */
    public bitResolution: EBitsResolutions;
    /**
     * the bit resolution selected by the id in {@link VBANAudioPacket.bitResolution}
     */
    public readonly bitResolutionObject: IBitResolution;
    /**
     * Audio codec used
     */
    public codec: ECodecs;

    /**
     * current audio
     */
    public data: Buffer;

    constructor(headers: IVBANHeaderAudio, data: Buffer) {
        super({
            ...headers,
            sp: VBANAudioPacket.subProtocol
        });

        this.nbSample = headers.nbSample;
        this.nbChannel = headers.nbChannel;
        this.bitResolution = headers.bitResolution;
        if (!VBANAudioPacket.bitResolutions[headers.bitResolution]) {
            throw new Error(`fail to found bitResolution with ID ${headers.bitResolution}`);
        }
        this.bitResolutionObject = VBANAudioPacket.bitResolutions[headers.bitResolution];
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

    public static bitResolutions: Record<number, IBitResolution> = {
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
