import { BITS_SPEEDS, EFormatBit, ESubProtocol, VBANProtocolFactory, VBANSerialPacket } from '../../src';
import { Buffer } from 'buffer';

describe('VBANSerial.test.ts', () => {
    describe('from Buffer', () => {
        it('should handle basic convert buffer to packet', () => {
            const buffer = Buffer.from('5642414e2e0000004d4944493100000000000000000000009b000000b00270', 'hex');

            const packet = VBANProtocolFactory.processPacket(buffer);
            expect(packet).toBeInstanceOf(VBANSerialPacket);
            if (packet instanceof VBANSerialPacket) {
                expect(packet.subProtocol).toBe(ESubProtocol.SERIAL);
                //always 0 for a Serial packet
                expect(packet.sr).toBe(0);

                expect(packet.streamName).toBe('MIDI1');

                expect(packet.frameCounter).toBe(155);
                expect(packet.bitMode).toStrictEqual({
                    stop: 1,
                    start: false,
                    parity: false,
                    multipart: false
                });
                expect(packet.channelsIdents).toBe(0);
                expect(packet.bps).toBe(BITS_SPEEDS[14]);
                expect(packet.formatBit).toBe(0);
                expect(packet.streamType).toBe(0);
                expect(packet.data).toStrictEqual(Buffer.from([176, 2, 112]));
            } else {
                throw new Error(`you can't be there`);
            }
        });
    });
    describe('from packet', () => {
        const basicPackages = {
            headers: {
                streamName: 'MIDI1',
                frameCounter: 155,
                bitMode: {
                    stop: 1,
                    start: false,
                    parity: false,
                    multipart: false
                },
                channelsIdents: 0,
                streamType: 0,
                bps: BITS_SPEEDS[14],
                formatBit: EFormatBit.VBAN_DATATYPE_BYTE8
            },
            data: Buffer.from([176, 2, 112])
        };
        it('should handle basic convert packet to buffer', () => {
            const packet = new VBANSerialPacket(basicPackages.headers, basicPackages.data);

            const buffer = VBANProtocolFactory.toUDPBuffer(packet);
            expect(buffer).toStrictEqual(Buffer.from('5642414e2e0000004d4944493100000000000000000000009b000000b00270', 'hex'));
        });

        it('should refuse to handle an invalid bitMode.stop', () => {
            const packet = new VBANSerialPacket(
                { ...basicPackages.headers, bitMode: { ...basicPackages.headers.bitMode, stop: 4 } },
                basicPackages.data
            );

            expect.assertions(2);
            try {
                VBANProtocolFactory.toUDPBuffer(packet);
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('fail to found mode for stop 4');
            }
        });
        describe('try bitmode', () => {
            describe('parity', () => {
                it('should handle bitmode parity true', () => {
                    const packet = new VBANSerialPacket(
                        { ...basicPackages.headers, bitMode: { ...basicPackages.headers.bitMode, parity: true } },
                        basicPackages.data
                    );

                    const buffer = VBANProtocolFactory.toUDPBuffer(packet);
                    expect(buffer).toStrictEqual(Buffer.from('5642414e2e0800004d4944493100000000000000000000009b000000b00270', 'hex'));
                });
                it('should handle bitmode parity false', () => {
                    const packet = new VBANSerialPacket(
                        { ...basicPackages.headers, bitMode: { ...basicPackages.headers.bitMode, parity: false } },
                        basicPackages.data
                    );

                    const buffer = VBANProtocolFactory.toUDPBuffer(packet);
                    expect(buffer).toStrictEqual(Buffer.from('5642414e2e0000004d4944493100000000000000000000009b000000b00270', 'hex'));
                });
            });
            describe('start', () => {
                it('should handle bitmode start true', () => {
                    const packet = new VBANSerialPacket(
                        { ...basicPackages.headers, bitMode: { ...basicPackages.headers.bitMode, start: true } },
                        basicPackages.data
                    );

                    const buffer = VBANProtocolFactory.toUDPBuffer(packet);
                    expect(buffer).toStrictEqual(Buffer.from('5642414e2e0400004d4944493100000000000000000000009b000000b00270', 'hex'));
                });
                it('should handle bitmode start false', () => {
                    const packet = new VBANSerialPacket(
                        { ...basicPackages.headers, bitMode: { ...basicPackages.headers.bitMode, start: false } },
                        basicPackages.data
                    );

                    const buffer = VBANProtocolFactory.toUDPBuffer(packet);
                    expect(buffer).toStrictEqual(Buffer.from('5642414e2e0000004d4944493100000000000000000000009b000000b00270', 'hex'));
                });
            });
            describe('multipart', () => {
                it('should handle bitmode multipart true', () => {
                    const packet = new VBANSerialPacket(
                        { ...basicPackages.headers, bitMode: { ...basicPackages.headers.bitMode, multipart: true } },
                        basicPackages.data
                    );

                    const buffer = VBANProtocolFactory.toUDPBuffer(packet);
                    expect(buffer).toStrictEqual(Buffer.from('5642414e2e8000004d4944493100000000000000000000009b000000b00270', 'hex'));
                });
                it('should handle bitmode multipart false', () => {
                    const packet = new VBANSerialPacket(
                        { ...basicPackages.headers, bitMode: { ...basicPackages.headers.bitMode, multipart: false } },
                        basicPackages.data
                    );

                    const buffer = VBANProtocolFactory.toUDPBuffer(packet);
                    expect(buffer).toStrictEqual(Buffer.from('5642414e2e0000004d4944493100000000000000000000009b000000b00270', 'hex'));
                });
            });
        });
    });
});
