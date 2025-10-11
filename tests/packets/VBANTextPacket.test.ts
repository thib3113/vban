import { Buffer } from 'node:buffer';
import { BITS_SPEEDS, EFormatBit, ESubProtocol, ETextEncoding, VBANProtocolFactory, VBANTEXTPacket } from '../../src/index.js';

describe('VBANTextPacket.test.ts', () => {
    describe('from Buffer', () => {
        it('should handle basic convert buffer to packet', () => {
            const buffer = Buffer.from(`5642414e52000010436f6d6d616e64310000000000000000180000006d79207465737420746578743b`, 'hex');

            const packet = VBANProtocolFactory.processPacket(buffer);
            expect(packet).toBeInstanceOf(VBANTEXTPacket);

            if (packet instanceof VBANTEXTPacket) {
                expect(packet.subProtocol).toBe(ESubProtocol.TEXT);
                //always 0 for a Service packet
                expect(packet.sr).toBe(0);

                expect(packet.streamName).toBe('Command1');
                expect(packet.frameCounter).toBe(24);
                expect(packet.bps).toBe(BITS_SPEEDS[18]);
                expect(packet.channelsIdents).toBe(0);
                expect(packet.formatBit).toBe(0);
                expect(packet.encoding).toBe(16);
                expect(packet.text).toBe('my test text;');
                expect(packet.dataBuffer).toStrictEqual(Buffer.from([109, 121, 32, 116, 101, 115, 116, 32, 116, 101, 120, 116, 59]));
            } else {
                throw new Error(`you can't be there`);
            }
        });
    });
    describe('from packet', () => {
        const basicPackages = {
            headers: {
                streamName: 'Command1',
                frameCounter: 24,
                bps: BITS_SPEEDS[18],
                channelsIdents: 0,
                formatBit: EFormatBit.VBAN_DATATYPE_BYTE8,
                encoding: ETextEncoding.VBAN_TXT_UTF8
            },
            data: 'my test text;',
            dataBuffer: Buffer.from([109, 121, 32, 116, 101, 115, 116, 32, 116, 101, 120, 116, 59])
        };
        it('should handle basic convert packet to buffer', () => {
            const packet = new VBANTEXTPacket(basicPackages.headers, basicPackages.data, basicPackages.dataBuffer);

            const buffer = VBANProtocolFactory.toUDPBuffer(packet);
            expect(buffer).toStrictEqual(
                Buffer.from('5642414e52000010436f6d6d616e64310000000000000000180000006d79207465737420746578743b', 'hex')
            );
        });
    });

    it('decode / encode test', () => {
        const packet = new VBANTEXTPacket(
            {
                streamName: 'Command1',
                frameCounter: 24,
                bps: BITS_SPEEDS[18],
                channelsIdents: 0,
                formatBit: EFormatBit.VBAN_DATATYPE_BYTE8,
                encoding: ETextEncoding.VBAN_TXT_UTF8
            },
            'my test text;',
            Buffer.from([109, 121, 32, 116, 101, 115, 116, 32, 116, 101, 120, 116, 59])
        );

        const buffer = VBANProtocolFactory.toUDPBuffer(packet);
        expect(buffer).toStrictEqual(
            Buffer.from('5642414e52000010436f6d6d616e64310000000000000000180000006d79207465737420746578743b', 'hex')
        );

        const packet2 = VBANProtocolFactory.processPacket(buffer);
        expect(packet2).toStrictEqual(packet);
    });
});
