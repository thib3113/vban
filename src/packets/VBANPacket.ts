import { Buffer } from 'buffer';
import { ESubProtocol } from './ESubProtocol.js';
import { IVBANHeaderCommon } from './IVBANHeaderCommon.js';
import { cleanPacketString, PACKET_IDENTIFICATION, sampleRates, STREAM_NAME_LENGTH } from '../commons.js';
import { IVBANHeader } from './IVBANHeader.js';
import { VBAN_DATA_MAX_SIZE } from './VBANSpecs.js';

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

    /**
     * Extract headers and data from UDPPacket, each Packet will continue the process
     */
    public static prepareFromUDPPacket(headersBuffer: Buffer, checkSR = true): IVBANHeaderCommon {
        const headers: Partial<IVBANHeaderCommon> = {};

        // SR / Sub protocol (5 + 3 bits)
        const srsp = headersBuffer.readUInt8(PACKET_IDENTIFICATION.length);
        //take last 5 bits for sampleRate
        const srIndex = srsp & 0b00011111; // 5 last Bits

        if ((checkSR && !sampleRates.hasOwnProperty(srIndex)) || sampleRates[srIndex] === undefined) {
            throw new Error(`unknown sample rate ${srIndex}`);
        }
        headers.sr = sampleRates[srIndex];
        headers.srIndex = srIndex;

        // Samples per frame (8 bits)
        headers.part1 = headersBuffer.readUInt8(5);

        // Channels (8 bits)
        headers.part2 = headersBuffer.readUInt8(6);

        headers.part3 = headersBuffer.readUInt8(7);

        // Stream Name (16 bytes)
        headers.streamName = cleanPacketString(headersBuffer.toString('ascii', 8, 8 + STREAM_NAME_LENGTH));

        // Frame Counter (32 bits)
        headers.frameCounter = headersBuffer.readUInt32LE(24);

        return headers as IVBANHeaderCommon;
    }

    /**
     * common constructor
     */
    constructor(headers: IVBANHeader) {
        this.sr = headers.sr;
        this.streamName = headers.streamName;
        // Frame Counter (32 bits)
        this.frameCounter = headers.frameCounter ?? 1;
    }

    /**
     * Convert a VBANPacket to a UDP packet
     */
    protected static convertToUDPPacket(headers: Omit<IVBANHeaderCommon, 'srIndex'>, data: Buffer, sampleRate?: number): Buffer {
        let bufferStart = 0;

        const headersBuffer = Buffer.alloc(28);

        bufferStart += PACKET_IDENTIFICATION.length;
        headersBuffer.fill(PACKET_IDENTIFICATION, bufferStart - PACKET_IDENTIFICATION.length, bufferStart, 'ascii');

        let rate = sampleRate ?? 0;
        if (sampleRate === undefined) {
            //search sampleRate
            rate = Number(
                Object.entries(sampleRates)
                    .find(([, sr]) => sr && sr === headers.sr)
                    ?.shift()
            );
            if (!rate) {
                throw new Error(`fail to find index for sample rate ${headers.sr}`);
            }
        }

        headersBuffer.fill((rate & 0b00011111) | (headers.sp & 0b11100000), bufferStart++);

        headersBuffer.fill(headers.part1, bufferStart++);
        headersBuffer.fill(headers.part2, bufferStart++);
        headersBuffer.fill(headers.part3, bufferStart++);

        headersBuffer.fill(headers.streamName.padEnd(STREAM_NAME_LENGTH, '\0'), bufferStart, bufferStart + STREAM_NAME_LENGTH, 'ascii');
        bufferStart += STREAM_NAME_LENGTH;

        headersBuffer.writeUInt32LE(headers.frameCounter ?? 1, bufferStart);

        if (data.length > VBAN_DATA_MAX_SIZE) {
            throw new Error(
                `VBAN DATA MAX SIZE = ${VBAN_DATA_MAX_SIZE} ! You try to send a packet with ${data.length} bytes . You can use the exported var VBAN_DATA_MAX_SIZE to split your datas in packets`
            );
        }

        return Buffer.concat([headersBuffer, data.subarray(0, VBAN_DATA_MAX_SIZE)]);
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
}
