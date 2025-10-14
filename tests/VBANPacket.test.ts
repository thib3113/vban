import { describe, expect, it } from '@jest/globals';
import { Buffer } from 'node:buffer';
import {
    ESubProtocol,
    HEADER_LENGTH,
    IVBANHeaderCommon,
    PACKET_IDENTIFICATION,
    STREAM_NAME_LENGTH,
    VBAN_DATA_MAX_SIZE,
    VBANPacket,
    VBANProtocolFactory
} from '../src/index.js';

type TestHeaderProps = Omit<IVBANHeaderCommon, 'sr'> & { srIndex: number; frameCounter: number };

// Helper function to create a header buffer for tests
const createTestHeaderBuffer = (props: TestHeaderProps): Buffer => {
    const buffer = Buffer.alloc(HEADER_LENGTH);

    // VBAN identification
    buffer.write(PACKET_IDENTIFICATION, 0, 'ascii');

    // Sample Rate and Sub-protocol
    const srSpByte = (props.srIndex & 0b00011111) | (props.sp & 0b11100000);
    buffer.writeUInt8(srSpByte, 4);

    // Other header parts
    buffer.writeUInt8(props.part1, 5);
    buffer.writeUInt8(props.part2, 6);
    buffer.writeUInt8(props.part3, 7);

    // Stream Name
    buffer.write(props.streamName.padEnd(STREAM_NAME_LENGTH, '\0'), 8, 'ascii');

    // Frame Counter
    buffer.writeUInt32LE(props.frameCounter, 24);

    return buffer;
};

const defaultHeaderProps: TestHeaderProps = {
    sp: ESubProtocol.AUDIO,
    srIndex: 3, // 48000 Hz
    part1: 255, // samples per frame - 1
    part2: 1, // channels - 1
    part3: 0, // format bit
    streamName: 'TestStream',
    frameCounter: 1
};

describe('VBANPacket', () => {
    describe('getSampleRate', () => {
        it('should return the correct sample rate for a valid index', () => {
            expect(VBANPacket.getSampleRate(3)).toBe(48000);
            expect(VBANPacket.getSampleRate(0)).toBe(6000);
        });

        it('should throw an error for an invalid index', () => {
            expect(() => VBANPacket.getSampleRate(999)).toThrow('unknown sample rate 999');
        });

        it('should throw an error for an undefined index', () => {
            expect(() => VBANPacket.getSampleRate(undefined)).toThrow('unknown sample rate undefined');
        });
    });

    describe('parsePacketHeader', () => {
        it('should correctly parse a valid header buffer', () => {
            const headerBuffer = createTestHeaderBuffer({ ...defaultHeaderProps, streamName: 'Stream1', frameCounter: 123 });
            const headers = VBANPacket.parsePacketHeader(headerBuffer);

            expect(headers.sp).toBe(ESubProtocol.AUDIO);
            expect(headers.srIndex).toBe(3);
            expect(headers.streamName).toBe('Stream1');
            expect(headers.frameCounter).toBe(123);
            expect(headers.part1).toBe(255);
            expect(headers.part2).toBe(1);
            expect(headers.part3).toBe(0);
        });

        it('should throw an error for an invalid packet identification', () => {
            const headerBuffer = createTestHeaderBuffer(defaultHeaderProps);
            headerBuffer.write('XXXX', 0, 'ascii'); // Corrupt the identifier
            expect(() => VBANPacket.parsePacketHeader(headerBuffer)).toThrow('Invalid Header');
        });

        it('should correctly parse different sub-protocols', () => {
            const audioHeader = VBANPacket.parsePacketHeader(createTestHeaderBuffer({ ...defaultHeaderProps, sp: ESubProtocol.AUDIO }));
            expect(audioHeader.sp).toBe(ESubProtocol.AUDIO);

            const serialHeader = VBANPacket.parsePacketHeader(createTestHeaderBuffer({ ...defaultHeaderProps, sp: ESubProtocol.SERIAL }));
            expect(serialHeader.sp).toBe(ESubProtocol.SERIAL);

            const textHeader = VBANPacket.parsePacketHeader(createTestHeaderBuffer({ ...defaultHeaderProps, sp: ESubProtocol.TEXT }));
            expect(textHeader.sp).toBe(ESubProtocol.TEXT);
        });
    });

    describe('convertToUDPPacket', () => {
        // Test cases for different packet configurations
        const packetTestCases = [
            {
                description: 'a standard audio packet',
                headers: { sp: ESubProtocol.AUDIO, sr: 48000, part1: 255, part2: 1, part3: 0, streamName: 'Audio1', frameCounter: 10 },
                data: Buffer.from([0x01, 0x02, 0x03]),
                expectedSrIndex: 3
            },
            {
                description: 'a text packet',
                headers: { sp: ESubProtocol.TEXT, sr: 0, part1: 0, part2: 0, part3: 0, streamName: 'TextStream', frameCounter: 1 },
                data: Buffer.from('hello world', 'utf-8'),
                expectedSrIndex: 0
            },
            {
                description: 'a serial packet with a high sample rate',
                headers: { sp: ESubProtocol.SERIAL, sr: 192000, part1: 1, part2: 2, part3: 3, streamName: 'Serial1', frameCounter: 999 },
                data: Buffer.from([0xff, 0xfe]),
                expectedSrIndex: 5
            },
            {
                description: 'a packet with maximum stream name length',
                headers: {
                    sp: ESubProtocol.AUDIO,
                    sr: 44100,
                    part1: 127,
                    part2: 7,
                    part3: 4,
                    streamName: 'ThisIs16Chars!!',
                    frameCounter: 42
                },
                data: Buffer.from([]),
                expectedSrIndex: 16
            }
        ];

        // Using .each to run tests for all cases
        it.each(packetTestCases)('should correctly convert $description to a UDP packet', ({ headers, data, expectedSrIndex }) => {
            // Using a hash-like object for the data test
            const dataToTest = { content: data };

            const udpPacket = VBANPacket['convertToUDPPacket'](headers, dataToTest.content);

            // Verify the packet structure
            expect(udpPacket.length).toBe(HEADER_LENGTH + data.length);
            expect(udpPacket.toString('ascii', 0, 4)).toBe(PACKET_IDENTIFICATION);

            // Re-parse the generated packet to verify its headers
            const parsedHeaders = VBANPacket.parsePacketHeader(udpPacket.subarray(0, HEADER_LENGTH));

            expect(parsedHeaders.sp).toBe(headers.sp);
            expect(parsedHeaders.srIndex).toBe(expectedSrIndex);
            expect(parsedHeaders.part1).toBe(headers.part1);
            expect(parsedHeaders.part2).toBe(headers.part2);
            expect(parsedHeaders.part3).toBe(headers.part3);
            expect(parsedHeaders.streamName).toBe(headers.streamName);
            expect(parsedHeaders.frameCounter).toBe(headers.frameCounter);

            // Verify the data payload
            const parsedData = udpPacket.subarray(HEADER_LENGTH);
            expect(parsedData).toEqual(dataToTest.content);
        });

        it('should throw an error for an UNKNOWN sub-protocol', () => {
            const headers = { sp: ESubProtocol.UNKNOWN, sr: 48000, part1: 0, part2: 0, part3: 0, streamName: 'Error', frameCounter: 1 };
            const data = Buffer.from('test');
            expect(() => VBANPacket['convertToUDPPacket'](headers, data)).toThrow("You can't convert an unknown packet to UDP packet");
        });

        it('should throw an error if the sample rate index cannot be found', () => {
            const headers = { sp: ESubProtocol.AUDIO, sr: 999999, part1: 0, part2: 0, part3: 0, streamName: 'ErrorSR', frameCounter: 1 };
            const data = Buffer.from('test');
            expect(() => VBANPacket['convertToUDPPacket'](headers, data)).toThrow('fail to find index for sample rate 999999');
        });

        it('should throw an error if data size exceeds VBAN_DATA_MAX_SIZE', () => {
            const headers = { sp: ESubProtocol.AUDIO, sr: 48000, part1: 0, part2: 0, part3: 0, streamName: 'TooBig', frameCounter: 1 };
            const data = Buffer.alloc(VBAN_DATA_MAX_SIZE + 1);
            expect(() => VBANPacket['convertToUDPPacket'](headers, data)).toThrow(
                `VBAN DATA MAX SIZE = ${VBAN_DATA_MAX_SIZE} ! You try to send a packet with ${data.length} bytes`
            );
        });

        it('should use the provided sampleRate index when available', () => {
            const headers = { sp: ESubProtocol.AUDIO, sr: 48000, part1: 0, part2: 0, part3: 0, streamName: 'CustomSR', frameCounter: 1 };
            const data = Buffer.from('test');
            // Provide a different sampleRate index (e.g., for 44100 Hz) than what headers.sr would resolve to
            const udpPacket = VBANPacket['convertToUDPPacket'](headers, data, 2); // 2 is index for 44100Hz

            const srSpByte = udpPacket.readUInt8(4);
            const srIndex = srSpByte & 0b00011111;

            expect(srIndex).toBe(2);
            expect(srIndex).not.toBe(3); // 3 would be for 48000Hz
        });
    });

    describe('Parse and Convert Round Trip', () => {
        const roundTripTestCases = [
            {
                description: 'a ping packet',
                base64Packet:
                    'VkJBTmAAAABWQkFOIFNlcnZpY2UAAAAAAwAAACAAAAABAwEAAAAAAAAAAABwFwAAQMQKAEroOQADAQEJAAAAAAAAAAAAAAAAAAAAAGZyLWZyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbXktcGMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZCLUF1ZGlvIFNvZnR3YXJlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABWb2ljZW1lZXRlciBQb3RhdG8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbXktcGMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
            },
            {
                description: 'a standard audio packet',
                base64Packet:
                    'VkJBTgNmAQFTdHJlYW0yAAAAAAAAAAAAmgcAAAABCAEGARABAQEMAQABCgEGARIBEAEdAREBHQELARgBCQEWAQYBEgEJARcBDAEZAQIBDwEAAQ8BCwEYAQoBFwEHARUBFAEgARIBHgEAAQ0B+wAGAfgABQH2AAAB+QABAfYA/gDoAOsA4QDiAOYA5QDiAN0A0gDNAMUAvwDAALkAwAC6AMEAuwDHAMEAygDGAMIAvgC2ALIArgCrAKoApACpAKQAsACpALEApwCtAKQArQCjAKcAngCgAJkAnwCYAJkAlQCOAIsAhgCDAIQAgwCFAIMAfwB9AIEAgACCAIEAcgBxAG0AbQBuAG0AawBrAHUAdgB7AHoAdgB3AHgAeQB9AH0AfQB+AHsAewB8AHsAeAB5AHgAdgB5AHkAdQB3AHIAcgBxAHQAcQBzAG4AbQBjAGUAZgBhAHAAawBvAGoAawBgAGYAXwBgAFcAYQBYAGUAXwBiAFgAXQBWAF8AWgBlAF4AaABiAGYAYQBoAGEAagBkAG4AZQByAGgAcgBqAHQAaQBwAGkAcgBsAHcAcABxAG8AdgBxAHwAeQA='
            }
            // {
            //     description: 'a text packet',
            //     base64Packet: 'VkJBTkAAAAAAAABUAGUAeAB0AEQAYQB0AGEAAAAAAAAAAAAAZQAAAAAAAABTb21lIHRleHQgZGF0YSBoZXJl'
            // },
            // {
            //     description: 'a packet with no data payload',
            //     base64Packet: 'VkJBTgMA/wEAAE4AbwBEAGEAdABhAAAAAAAAAAAAAAAAAQUAAAAAAAAA'
            // }
        ];

        it.each(roundTripTestCases)('should result in the same base64 string for $description', ({ base64Packet }) => {
            // 1. Decode original packet
            const originalPacketBuffer = Buffer.from(base64Packet, 'base64');

            // 2. Parse it
            const { headers: parsedHeaders, data: parsedData } = VBANPacket.parsePacket(originalPacketBuffer);

            const pkt = VBANProtocolFactory.processPacket(originalPacketBuffer);

            // 3. Prepare headers for re-conversion (we need the sr value, not the srIndex)
            const headersForConversion = {
                ...parsedHeaders,
                sr: VBANPacket.getSampleRate(parsedHeaders.srIndex)
            };

            // 4. Re-convert to a UDP packet
            const reconstructedPacketBuffer = VBANPacket['convertToUDPPacket'](headersForConversion, parsedData);

            const { headers } = VBANPacket.parsePacket(reconstructedPacketBuffer);

            // 5. Encode back to base64 and compare
            expect(reconstructedPacketBuffer.toString('base64')).toBe(base64Packet);
        });
    });
});
