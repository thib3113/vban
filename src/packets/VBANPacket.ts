import { Buffer } from 'node:buffer';
import { ESubProtocol } from './ESubProtocol.js';
import { IVBANHeaderCommon } from './IVBANHeaderCommon.js';
import {
    PACKET_IDENTIFICATION,
    PACKET_IDENTIFICATION_UINT32,
    sampleRates,
    sampleRatesMapIndex,
    STREAM_NAME_LENGTH,
    SUB_PROTOCOL_MASK
} from '../commons.js';
import { IVBANHeader } from './IVBANHeader.js';
import { VBAN_DATA_MAX_SIZE, VBAN_HEADER_LENGTH } from './VBANSpecs.js';

export class VBANPacket {
    /**
     * the subProtocol of this packet
     * {@link ESubProtocol}
     */
    public subProtocol: ESubProtocol = ESubProtocol.AUDIO;
    /**
     * the name of the current stream .
     * Voicemeeter rely on it to allow a packet or not
     */
    public streamName: string;
    /**
     * Sample Rate for this stream
     */
    public sr: number;
    /**
     * frameCounter allow checking if you receive frame in order, and without losing them
     */
    public frameCounter: number;

    public static readonly frameCounters: Map<string, number> = new Map<string, number>();

    public static getSampleRate(srIndex?: number): number {
        if (srIndex === undefined || srIndex === null || !sampleRates.hasOwnProperty(srIndex) || sampleRates[srIndex] === undefined) {
            throw new Error(`unknown sample rate ${srIndex}`);
        }
        return sampleRates[srIndex];
    }

    public static parsePacketHeader(headersBuffer: Buffer): IVBANHeaderCommon {
        const headers: Partial<IVBANHeaderCommon> = {};

        if (headersBuffer.length < 4 || headersBuffer.readUInt32BE(0) !== PACKET_IDENTIFICATION_UINT32) {
            throw new Error('Invalid Header');
        }

        // read next 4 Bytes
        const chunk = headersBuffer.readUInt32BE(PACKET_IDENTIFICATION.length);

        // noinspection PointlessArithmeticExpressionJS
        const sr_sp = (chunk >> (3 * 8)) & 0b11111111;
        // noinspection PointlessArithmeticExpressionJS
        headers.part1 = (chunk >> (2 * 8)) & 0b11111111;
        // noinspection PointlessArithmeticExpressionJS
        headers.part2 = (chunk >> (1 * 8)) & 0b11111111;
        // noinspection PointlessArithmeticExpressionJS
        headers.part3 = (chunk >> (0 * 8)) & 0b11111111;

        // 3 first bits
        headers.sp = sr_sp & SUB_PROTOCOL_MASK;

        //take last 5 bits for sampleRate
        headers.srIndex = sr_sp & 0b00011111; // 5 last bits

        // Stream Name (16 bytes)
        const streamNameEnd = 8 + STREAM_NAME_LENGTH;
        let nullTerminatorIndex = headersBuffer.indexOf(0, 8);
        if (nullTerminatorIndex === -1 || nullTerminatorIndex > streamNameEnd) {
            nullTerminatorIndex = streamNameEnd;
        }
        headers.streamName = headersBuffer.toString('ascii', 8, nullTerminatorIndex);

        // Frame Counter (32 bits)
        headers.frameCounter = headersBuffer.readUInt32LE(24);

        return headers as IVBANHeaderCommon;
    }

    public static parsePacket(packet: Buffer): {
        headers: IVBANHeaderCommon;
        data: Buffer;
    } {
        const headerBuffer = packet.subarray(0, VBAN_HEADER_LENGTH);
        const dataBuffer = packet.subarray(VBAN_HEADER_LENGTH);

        const headers = this.parsePacketHeader(headerBuffer);

        return {
            headers,
            data: dataBuffer
        };
    }

    /**
     * Extract headers and data from UDPPacket, each Packet will continue the process
     * @deprecated
     */
    public static prepareFromUDPPacket(headersBuffer: Buffer, checkSR = true): IVBANHeaderCommon {
        const headers = this.parsePacketHeader(headersBuffer);
        if (checkSR) {
            headers.sr = this.getSampleRate(headers.srIndex);
        }

        return headers;
    }

    /**
     * common constructor
     */
    constructor(headers: IVBANHeader) {
        this.sr = headers.sr ?? 0;
        this.streamName = headers.streamName;
        // Frame Counter (32 bits)
        this.frameCounter = headers.frameCounter ?? 1;
    }

    /**
     * Convert a VBANPacket to a UDP packet
     */
    protected static convertToUDPPacket(headers: Omit<IVBANHeaderCommon, 'srIndex'>, data: Buffer, sampleRate?: number): Buffer {
        if (headers.sp === ESubProtocol.UNKNOWN) {
            throw new Error(`You can't convert an unknown packet to UDP packet`);
        }
        if (data.length > VBAN_DATA_MAX_SIZE) {
            throw new Error(
                `VBAN DATA MAX SIZE = ${VBAN_DATA_MAX_SIZE} ! You try to send a packet with ${data.length} bytes . You can use the exported var VBAN_DATA_MAX_SIZE to split your datas in packets`
            );
        }

        // Use allocUnsafe for performance as the buffer is fully overwritten below.
        // This avoids zero-filling the memory.
        const finalBuffer = Buffer.allocUnsafe(VBAN_HEADER_LENGTH + data.length);

        let offset = 0;

        offset += finalBuffer.write(PACKET_IDENTIFICATION, offset, 'ascii');

        let rateIndex: number = 0;
        if (sampleRate === undefined && headers.sr) {
            // La recherche est maintenant instantanée (O(1))
            const rateIndexFromMap = sampleRatesMapIndex.get(headers.sr);
            if (!rateIndexFromMap) {
                throw new Error(`fail to find index for sample rate ${headers.sr}`);
            }

            rateIndex = rateIndexFromMap;
        } else if (sampleRate !== undefined) {
            rateIndex = sampleRate;
        }

        // Écriture des parties du header avec `writeUInt8` (plus rapide que `fill`)
        offset = finalBuffer.writeUInt8((rateIndex & 0b00011111) | (headers.sp & 0b11100000), offset);
        offset = finalBuffer.writeUInt8(headers.part1, offset);
        offset = finalBuffer.writeUInt8(headers.part2, offset);
        offset = finalBuffer.writeUInt8(headers.part3, offset);

        // Écriture du nom du stream
        offset += finalBuffer.write(headers.streamName.padEnd(STREAM_NAME_LENGTH, '\0'), offset, 'ascii');

        // Écriture du compteur
        finalBuffer.writeUInt32LE(headers.frameCounter ?? 1, offset);

        data.copy(finalBuffer, VBAN_HEADER_LENGTH);

        return finalBuffer;
    }

    /**
     * EXPERIMENTAL - DO NOT USE
     *
     * @experimental
     */
    public static checkFrameCounter(headers: VBANPacket) {
        //check frameCounter
        const frameCounterKey = 'str';
        const frameCounter = this.frameCounters.get(frameCounterKey);

        if (!headers.frameCounter) {
            return;
        }

        if (frameCounter && frameCounter > headers.frameCounter && headers.frameCounter > 0) {
            console.log('frameCounter error');
        } else if (frameCounter && headers.frameCounter > 0) {
            console.log('frame counter', 'old', frameCounter, 'new', headers.frameCounter, 'diff', headers.frameCounter - frameCounter);
        } else if (headers.frameCounter === 0) {
            console.log('frame 0');
        }

        this.frameCounters.set(frameCounterKey, headers.frameCounter);
    }

    public toUDPPacket(): Buffer {
        throw new Error('Not implemented');
    }
}
