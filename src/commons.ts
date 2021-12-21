export const PACKET_IDENTIFICATION = 'VBAN';

export const BITS_SPEEDS: Record<number, number | null> = {
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
    25: null,
    26: null,
    27: null,
    28: null,
    29: null,
    30: null,
    31: null
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

export function prepareStringForPacket(str: string, maxLength: number): string {
    return str.slice(0, maxLength).padEnd(maxLength, '\0');
}

export function cleanPacketString(str: string): string {
    return str.replace(/\0/g, '');
}
