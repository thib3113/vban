import { Buffer } from 'node:buffer';

export const PACKET_IDENTIFICATION = 'VBAN';
export const PACKET_IDENTIFICATION_UINT32 = Buffer.from(PACKET_IDENTIFICATION).readUInt32BE(0);

export const SUB_PROTOCOL_MASK = 0b11100000;

/**
 * the stream name is limited to 16 bytes
 */
export const STREAM_NAME_LENGTH = 16;

export const BITS_SPEEDS: Record<number, number> = {
    0: 0,
    1: 110,
    2: 150,
    3: 300,
    4: 600,
    5: 1200,
    6: 2400,
    7: 4800,
    8: 9600,
    9: 14400,
    10: 19200,
    11: 31250,
    12: 38400,
    13: 57600,
    14: 115200,
    15: 128000,
    16: 230400,
    17: 250000,
    18: 256000,
    19: 460800,
    20: 921600,
    21: 1000000,
    22: 1500000,
    23: 2000000,
    24: 3000000,
    25: 0,
    26: 0,
    27: 0,
    28: 0,
    29: 0,
    30: 0,
    31: 0
};

export const MBPS_SPEEDS: Record<number, number> = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 8,
    8: 10,
    9: 12,
    10: 16,
    11: 24,
    12: 36,
    13: 48,
    14: 60,
    15: 84,
    16: 108,
    17: 156,
    18: 204,
    19: 252,
    20: 300,
    21: 400,
    22: 500,
    23: 600,
    24: 800,
    25: 0, // Undefined
    26: 0, // Undefined
    27: 0, // Undefined
    28: 0, // Undefined
    29: 0, // Undefined
    30: 0, // Undefined
    31: 0 // Undefined
};

export enum EFormatBit {
    /**
     * 0 to 255
     */
    VBAN_DATATYPE_BYTE8 = 0x00
}

export const serialStopModes: Array<{ mode: number; stop: number | null }> = [
    {
        mode: 0,
        stop: 1
    },
    {
        mode: 1,
        stop: 1.5
    },
    {
        mode: 2,
        stop: 2
    },
    {
        mode: 3,
        stop: null
    }
];

export function dec2bin(dec: number) {
    return ((dec >>> 0).toString(2) || '').padStart(8, '0');
}

const HEX_TABLE = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0').toUpperCase());

export function bufferToHex(buffer: Buffer) {
    if (!Buffer.isBuffer(buffer)) {
        throw new TypeError('need to be a buffer');
    }
    const len = buffer.length;
    if (len === 0) return '';
    const parts = new Array(len);
    for (let i = 0; i < len; i++) {
        parts[i] = HEX_TABLE[buffer[i]];
    }
    return parts.join(' ');
}

export function prepareStringForPacket(str: string, maxLength: number): string {
    return str.slice(0, maxLength).padEnd(maxLength, '\0');
}

export function cleanPacketString(str: string): string {
    return str.replace(/\0/g, '');
}

//sample rates
export const sampleRates: Record<number, number> = {
    0: 6000,
    1: 12000,
    2: 24000,
    3: 48000,
    4: 96000,
    5: 192000,
    6: 384000,
    7: 8000,
    8: 16000,
    9: 32000,
    10: 64000,
    11: 128000,
    12: 256000,
    13: 512000,
    14: 11025,
    15: 22050,
    16: 44100,
    17: 88200,
    18: 176400,
    19: 352800,
    20: 705600,
    21: 0,
    22: 0,
    23: 0,
    24: 0,
    25: 0,
    26: 0,
    27: 0,
    28: 0,
    29: 0,
    30: 0,
    31: 0
};

export const sampleRatesMap = new Map<number, number>();
export const sampleRatesMapIndex = new Map<number, number>();
for (const [index, rate] of Object.entries(sampleRates)) {
    sampleRatesMapIndex.set(rate, Number(index));
    sampleRatesMap.set(Number(index), rate);
}

export const bitsSpeedsMapIndex = new Map<number, number>();
for (const [index, rate] of Object.entries(BITS_SPEEDS)) {
    const rateNum = Number(rate);
    const indexNum = Number(index);
    if (rateNum !== 0 && !bitsSpeedsMapIndex.has(rateNum)) {
        bitsSpeedsMapIndex.set(rateNum, indexNum);
    }
}

export const mbpsSpeedsMapIndex = new Map<number, number>();
for (const [index, rate] of Object.entries(MBPS_SPEEDS)) {
    const rateNum = Number(rate);
    const indexNum = Number(index);
    if (rateNum !== 0 && !mbpsSpeedsMapIndex.has(rateNum)) {
        mbpsSpeedsMapIndex.set(rateNum, indexNum);
    }
}
