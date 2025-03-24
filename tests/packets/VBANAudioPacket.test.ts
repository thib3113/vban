import { Buffer } from 'buffer';
import { EBitsResolutions, ECodecs, ESubProtocol, sampleRates, VBANAudioPacket, VBANProtocolFactory } from '../../src/index.js';

describe('VBANAudioPacket.test.ts', () => {
    const soundBuffer = Buffer.from([
        11, 0, 246, 255, 11, 0, 246, 255, 11, 0, 246, 255, 11, 0, 246, 255, 10, 0, 246, 255, 9, 0, 245, 255, 8, 0, 245, 255, 5, 0, 246, 255,
        4, 0, 246, 255, 3, 0, 247, 255, 1, 0, 247, 255, 255, 255, 247, 255, 254, 255, 248, 255, 253, 255, 249, 255, 250, 255, 250, 255, 249,
        255, 251, 255, 248, 255, 252, 255, 246, 255, 254, 255, 245, 255, 0, 0, 244, 255, 0, 0, 243, 255, 2, 0, 243, 255, 4, 0, 242, 255, 6,
        0, 242, 255, 8, 0, 243, 255, 11, 0, 243, 255, 13, 0, 244, 255, 15, 0, 244, 255, 17, 0, 245, 255, 20, 0, 246, 255, 22, 0, 246, 255,
        23, 0, 246, 255, 25, 0, 247, 255, 27, 0, 248, 255, 28, 0, 248, 255, 28, 0, 248, 255, 29, 0, 248, 255, 30, 0, 247, 255, 29, 0, 246,
        255, 28, 0, 245, 255, 28, 0, 243, 255, 27, 0, 243, 255, 26, 0, 242, 255, 25, 0, 241, 255, 24, 0, 238, 255, 23, 0, 236, 255, 21, 0,
        236, 255, 19, 0, 234, 255, 19, 0, 232, 255, 16, 0, 231, 255, 15, 0, 230, 255, 13, 0, 228, 255, 12, 0, 228, 255, 12, 0, 227, 255, 11,
        0, 226, 255, 11, 0, 226, 255, 10, 0, 227, 255, 10, 0, 227, 255, 11, 0, 229, 255, 11, 0, 231, 255, 12, 0, 232, 255, 12, 0, 234, 255,
        14, 0, 238, 255, 15, 0, 240, 255, 16, 0, 244, 255, 17, 0, 247, 255, 19, 0, 249, 255, 20, 0, 252, 255, 21, 0, 255, 255, 22, 0, 0, 0,
        24, 0, 2, 0, 24, 0, 4, 0, 24, 0, 6, 0, 25, 0, 7, 0, 25, 0, 8, 0, 25, 0, 8, 0, 25, 0, 8, 0, 23, 0, 8, 0, 22, 0, 7, 0, 21, 0, 6, 0,
        19, 0, 4, 0, 17, 0, 3, 0, 14, 0, 0, 0, 12, 0, 0, 0, 10, 0, 254, 255, 8, 0, 252, 255, 6, 0, 250, 255, 4, 0, 249, 255, 1, 0, 247, 255,
        0, 0, 246, 255, 255, 255, 246, 255, 254, 255, 246, 255, 252, 255, 245, 255, 251, 255, 246, 255, 250, 255, 247, 255, 249, 255, 248,
        255, 248, 255, 249, 255, 248, 255, 251, 255, 248, 255, 253, 255, 248, 255, 255, 255, 249, 255, 0, 0, 250, 255, 3, 0, 251, 255, 6, 0,
        252, 255
    ]);

    describe('from Buffer', () => {
        it('should handle basic convert buffer to packet', () => {
            const buffer = Buffer.from(
                '5642414e0366010153747265616d33000000000000000000ef211d000b00f6ff0b00f6ff0b00f6ff0b00f6ff0a00f6ff0900f5ff0800f5ff0500f6ff0400f6ff0300f7ff0100f7fffffff7fffefff8fffdfff9fffafffafff9fffbfff8fffcfff6fffefff5ff0000f4ff0000f3ff0200f3ff0400f2ff0600f2ff0800f3ff0b00f3ff0d00f4ff0f00f4ff1100f5ff1400f6ff1600f6ff1700f6ff1900f7ff1b00f8ff1c00f8ff1c00f8ff1d00f8ff1e00f7ff1d00f6ff1c00f5ff1c00f3ff1b00f3ff1a00f2ff1900f1ff1800eeff1700ecff1500ecff1300eaff1300e8ff1000e7ff0f00e6ff0d00e4ff0c00e4ff0c00e3ff0b00e2ff0b00e2ff0a00e3ff0a00e3ff0b00e5ff0b00e7ff0c00e8ff0c00eaff0e00eeff0f00f0ff1000f4ff1100f7ff1300f9ff1400fcff1500ffff160000001800020018000400180006001900070019000800190008001900080017000800160007001500060013000400110003000e0000000c0000000a00feff0800fcff0600faff0400f9ff0100f7ff0000f6fffffff6fffefff6fffcfff5fffbfff6fffafff7fff9fff8fff8fff9fff8fffbfff8fffdfff8fffffff9ff0000faff0300fbff0600fcff',
                'hex'
            );

            const packet = VBANProtocolFactory.processPacket(buffer);
            expect(packet).toBeInstanceOf(VBANAudioPacket);
            if (packet instanceof VBANAudioPacket) {
                expect(packet.subProtocol).toBe(ESubProtocol.AUDIO);
                expect(packet.sr).toBe(48000);
                expect(packet.streamName).toBe('Stream3');
                expect(packet.frameCounter).toBe(1909231);
                expect(packet.nbSample).toBe(103);
                expect(packet.nbChannel).toBe(2);
                expect(packet.bitResolution).toBe(EBitsResolutions.VBAN_DATATYPE_INT16);

                expect(packet.bitResolutionObject).toBe(VBANAudioPacket.bitResolutions[EBitsResolutions.VBAN_DATATYPE_INT16]);
                expect(packet.bitResolutionObject).toStrictEqual({ bitDepth: 16, signed: true, float: false });

                expect(packet.data).toStrictEqual(soundBuffer);
            } else {
                throw new Error(`you can't be there`);
            }
        });
    });
    describe('from packet', () => {
        const basicPackages = {
            headers: {
                subProtocol: 0,
                sr: sampleRates[3],
                streamName: 'Stream3',
                frameCounter: 1909231,
                nbSample: 103,
                nbChannel: 2,
                bitResolution: EBitsResolutions.VBAN_DATATYPE_INT16,
                codec: ECodecs.VBAN_CODEC_PCM
            },
            data: soundBuffer
        };
        it('should handle basic convert packet to buffer', () => {
            const packet = new VBANAudioPacket(basicPackages.headers, basicPackages.data);

            const buffer = VBANProtocolFactory.toUDPBuffer(packet);
            expect(buffer).toStrictEqual(
                Buffer.from(
                    '5642414e0366010153747265616d33000000000000000000ef211d000b00f6ff0b00f6ff0b00f6ff0b00f6ff0a00f6ff0900f5ff0800f5ff0500f6ff0400f6ff0300f7ff0100f7fffffff7fffefff8fffdfff9fffafffafff9fffbfff8fffcfff6fffefff5ff0000f4ff0000f3ff0200f3ff0400f2ff0600f2ff0800f3ff0b00f3ff0d00f4ff0f00f4ff1100f5ff1400f6ff1600f6ff1700f6ff1900f7ff1b00f8ff1c00f8ff1c00f8ff1d00f8ff1e00f7ff1d00f6ff1c00f5ff1c00f3ff1b00f3ff1a00f2ff1900f1ff1800eeff1700ecff1500ecff1300eaff1300e8ff1000e7ff0f00e6ff0d00e4ff0c00e4ff0c00e3ff0b00e2ff0b00e2ff0a00e3ff0a00e3ff0b00e5ff0b00e7ff0c00e8ff0c00eaff0e00eeff0f00f0ff1000f4ff1100f7ff1300f9ff1400fcff1500ffff160000001800020018000400180006001900070019000800190008001900080017000800160007001500060013000400110003000e0000000c0000000a00feff0800fcff0600faff0400f9ff0100f7ff0000f6fffffff6fffefff6fffcfff5fffbfff6fffafff7fff9fff8fff8fff9fff8fffbfff8fffdfff8fffffff9ff0000faff0300fbff0600fcff',
                    'hex'
                )
            );
        });
        it('should disallow using unknown bitResolution', () => {
            expect.assertions(2);
            try {
                new VBANAudioPacket({ ...basicPackages.headers, bitResolution: 33 }, basicPackages.data);
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('fail to found bitResolution with ID 33');
            }
        });
    });
    it('decode / encode test', () => {
        const packet = new VBANAudioPacket(
            {
                sr: sampleRates[3],
                streamName: 'Stream3',
                frameCounter: 1909231,
                nbSample: 103,
                nbChannel: 2,
                bitResolution: EBitsResolutions.VBAN_DATATYPE_INT16,
                codec: ECodecs.VBAN_CODEC_PCM
            },
            soundBuffer
        );

        const buffer = VBANProtocolFactory.toUDPBuffer(packet);
        expect(buffer).toStrictEqual(
            Buffer.from(
                '5642414e0366010153747265616d33000000000000000000ef211d000b00f6ff0b00f6ff0b00f6ff0b00f6ff0a00f6ff0900f5ff0800f5ff0500f6ff0400f6ff0300f7ff0100f7fffffff7fffefff8fffdfff9fffafffafff9fffbfff8fffcfff6fffefff5ff0000f4ff0000f3ff0200f3ff0400f2ff0600f2ff0800f3ff0b00f3ff0d00f4ff0f00f4ff1100f5ff1400f6ff1600f6ff1700f6ff1900f7ff1b00f8ff1c00f8ff1c00f8ff1d00f8ff1e00f7ff1d00f6ff1c00f5ff1c00f3ff1b00f3ff1a00f2ff1900f1ff1800eeff1700ecff1500ecff1300eaff1300e8ff1000e7ff0f00e6ff0d00e4ff0c00e4ff0c00e3ff0b00e2ff0b00e2ff0a00e3ff0a00e3ff0b00e5ff0b00e7ff0c00e8ff0c00eaff0e00eeff0f00f0ff1000f4ff1100f7ff1300f9ff1400fcff1500ffff160000001800020018000400180006001900070019000800190008001900080017000800160007001500060013000400110003000e0000000c0000000a00feff0800fcff0600faff0400f9ff0100f7ff0000f6fffffff6fffefff6fffcfff5fffbfff6fffafff7fff9fff8fff8fff9fff8fffbfff8fffdfff8fffffff9ff0000faff0300fbff0600fcff',
                'hex'
            )
        );

        const packet2 = VBANProtocolFactory.processPacket(buffer);
        expect(packet2).toStrictEqual(packet);
    });
});
