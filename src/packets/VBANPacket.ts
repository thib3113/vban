import { ESubProtocol } from './ESubProtocol';
import { IVBANHeaderCommon } from './IVBANHeaderCommon';
import { cleanPacketString, PACKET_IDENTIFICATION, sampleRates } from '../commons';
import { IVBANHeader } from './IVBANHeader';
import { VBAN_DATA_MAX_SIZE } from './VBANSpecs';
import { Buffer } from 'buffer';

export class VBANPacket {
    /**
     * the subProtocol of this packet
     */
    public subProtocol: ESubProtocol = ESubProtocol.AUDIO;

    public streamName: string;
    public sr: number;
    public frameCounter: number;

    public static frameCounters: Map<string, number> = new Map<string, number>();

    public static prepareFromUDPPacket(headersBuffer: Buffer): IVBANHeaderCommon {
        const headers: Partial<IVBANHeaderCommon> = {};

        // SR / Sub protocol (5 + 3 bits)
        const srsp = headersBuffer.readUInt8(PACKET_IDENTIFICATION.length);
        //take last 5 bits for sampleRate
        const srIndex = srsp & 0b00011111; // 5 last Bits

        if (!sampleRates.hasOwnProperty(srIndex) || !sampleRates[srIndex]) {
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
        headers.streamName = cleanPacketString(headersBuffer.toString('ascii', 8, 24));

        // Frame Counter (32 bits)
        headers.frameCounter = headersBuffer.readUInt32LE(24);

        return headers as IVBANHeaderCommon;
    }

    constructor(headers: IVBANHeader) {
        this.sr = headers.sr;
        this.streamName = headers.streamName;
        // Frame Counter (32 bits)
        this.frameCounter = headers.frameCounter ?? 1;
    }

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

        headersBuffer.fill(headers.streamName.padEnd(16, '\0'), bufferStart, bufferStart + 16, 'ascii');
        bufferStart += 16;

        headersBuffer.writeUInt32LE(headers.frameCounter ?? 1, bufferStart);

        return Buffer.concat([headersBuffer, data.slice(0, VBAN_DATA_MAX_SIZE)]);
    }

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
