import { Buffer } from 'buffer';
import {
    ERegistrationAnswer,
    EServiceFunction,
    EServiceType,
    ESubProtocol,
    VBANProtocolFactory,
    VBANRealTimeRegisterAnswerPacket
} from '../../src';

describe('VBANRealTimeRegisterAnswerPacket.test.ts', () => {
    describe('from Buffer', () => {
        it('should handle basic convert buffer to packet', () => {
            const buffer = Buffer.from(`5642414e608020015642414e20536572766963650000000001000000`, 'hex');

            const packet = VBANProtocolFactory.processPacket(buffer);
            expect(packet).toBeInstanceOf(VBANRealTimeRegisterAnswerPacket);

            if (packet instanceof VBANRealTimeRegisterAnswerPacket) {
                expect(packet.subProtocol).toBe(ESubProtocol.SERVICE);
                //always 0 for a Service packet
                expect(packet.sr).toBe(0);

                // expect(packet.streamName).toBe('VBAN Service');

                expect(packet.frameCounter).toBe(1);
                expect(packet.isReply).toBe(true);
                expect(packet.service).toBe(EServiceType.RTPACKETREGISTER);
                expect(packet.serviceFunction).toBe(EServiceFunction.PING0);

                const { data } = packet;

                expect(data.answer).toBe(ERegistrationAnswer.RT_PACKET_SERVICE_REGISTERED);
            } else {
                throw new Error(`you can't be there`);
            }
        });
    });
    describe('from packet', () => {
        const basicPackages = {
            headers: {
                streamName: 'VBAN Service',
                frameCounter: 1,
                isReply: true,
                service: EServiceType.RTPACKETREGISTER,
                serviceFunction: 0
            }
        };
        it('should handle basic convert packet to buffer', () => {
            const packet = new VBANRealTimeRegisterAnswerPacket(basicPackages.headers, {
                answer: ERegistrationAnswer.RT_PACKET_SERVICE_REGISTERED
            });

            const buffer = VBANProtocolFactory.toUDPBuffer(packet);
            expect(buffer).toStrictEqual(Buffer.from('5642414e608020015642414e20536572766963650000000001000000', 'hex'));
        });
    });

    it('decode / encode test', () => {
        const packet = new VBANRealTimeRegisterAnswerPacket(
            {
                streamName: 'VBAN Service',
                frameCounter: 1,
                isReply: true,
                service: EServiceType.RTPACKETREGISTER,
                serviceFunction: 0
            },
            {
                answer: ERegistrationAnswer.RT_PACKET_SERVICE_REGISTERED
            }
        );

        const buffer = VBANProtocolFactory.toUDPBuffer(packet);
        expect(buffer).toStrictEqual(Buffer.from('5642414e608020015642414e20536572766963650000000001000000', 'hex'));

        const packet2 = VBANProtocolFactory.processPacket(buffer);
        expect(packet2).toStrictEqual(packet);
    });
});
