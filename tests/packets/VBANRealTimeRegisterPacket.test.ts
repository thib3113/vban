import { Buffer } from 'buffer';
import {
    EServiceFunction,
    EServiceType,
    ESubProtocol,
    VBANProtocolFactory,
    VBANRealTimeRegisterAnswerPacket,
    VBANRealTimeRegisterPacket
} from '../../src/index.js';

describe('VBANRealTimeRegisterPacket.test.ts', () => {
    describe('from Buffer', () => {
        it('should handle basic convert buffer to packet', () => {
            const buffer = Buffer.from(`5642414e6000200f5265676973746572205254500000000000000000`, 'hex');

            const packet = VBANProtocolFactory.processPacket(buffer);
            expect(packet).toBeInstanceOf(VBANRealTimeRegisterPacket);

            if (packet instanceof VBANRealTimeRegisterPacket) {
                expect(packet.subProtocol).toBe(ESubProtocol.SERVICE);
                //always 0 for a Service packet
                expect(packet.sr).toBe(0);

                expect(packet.streamName).toBe('Register RTP');

                expect(packet.frameCounter).toBe(0);
                expect(packet.isReply).toBe(false);
                expect(packet.service).toBe(EServiceType.RTPACKETREGISTER);
                expect(packet.serviceFunction).toBe(EServiceFunction.PING0);

                const { data } = packet;

                expect(data.timeout).toBe(15);
            } else {
                throw new Error(`you can't be there`);
            }
        });
    });
    describe('from packet', () => {
        const basicPackages = {
            headers: {
                streamName: 'Register RTP',
                frameCounter: 0,
                isReply: false,
                service: EServiceType.RTPACKETREGISTER,
                serviceFunction: 0
            }
        };
        it('should handle basic convert packet to buffer', () => {
            const packet = new VBANRealTimeRegisterPacket(basicPackages.headers, { timeout: 15 });

            const buffer = VBANProtocolFactory.toUDPBuffer(packet);
            expect(buffer).toStrictEqual(Buffer.from('5642414e6000200f5265676973746572205254500000000000000000', 'hex'));
        });
    });

    it('decode / encode test', () => {
        const packet = new VBANRealTimeRegisterPacket(
            {
                streamName: 'Register RTP',
                frameCounter: 0,
                isReply: false,
                service: EServiceType.RTPACKETREGISTER,
                serviceFunction: 0
            },
            {
                timeout: 15
            }
        );

        const buffer = VBANProtocolFactory.toUDPBuffer(packet);
        expect(buffer).toStrictEqual(Buffer.from('5642414e6000200f5265676973746572205254500000000000000000', 'hex'));

        const packet2 = VBANProtocolFactory.processPacket(buffer);
        expect(packet2).toStrictEqual(packet);
    });

    it('should return an answer packet', async () => {
        const buffer = Buffer.from(`5642414e608020015642414e2053657276696365000f000001000000`, 'hex');

        const packet = VBANProtocolFactory.processPacket(buffer);
        expect(packet).toBeInstanceOf(VBANRealTimeRegisterAnswerPacket);
    });
});
