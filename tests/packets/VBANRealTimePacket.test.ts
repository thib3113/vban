import {
    EServiceFunction,
    EServiceType,
    ESubProtocol,
    VBANProtocolFactory,
    VBANRealTimePacket,
    VBANRealTimeRegisterAnswerPacket
} from '../../src/index.js';

describe('VBANRealTimePacket.test.ts', () => {
    describe('from Buffer', () => {
        it('should handle basic convert buffer to packet', () => {
            const buffer = Buffer.from(`5642414e60002100566f6963656d65657465722d5254500000000000`, 'hex');

            const packet = VBANProtocolFactory.processPacket(buffer);
            expect(packet).toBeInstanceOf(VBANRealTimePacket);

            if (packet instanceof VBANRealTimePacket) {
                // packet.frameCounter = 0;
                // packet.data = Buffer.from('test message');
                // packet.toUDPPacket();

                expect(packet.subProtocol).toBe(ESubProtocol.SERVICE);
                //always 0 for a Service packet
                expect(packet.sr).toBe(0);

                expect(packet.streamName).toBe('Voicemeeter-RTP');

                expect(packet.frameCounter).toBe(0);
                expect(packet.isReply).toBe(false);
                expect(packet.service).toBe(EServiceType.RTPACKET);
                expect(packet.serviceFunction).toBe(EServiceFunction.PING0);

                const { data } = packet;

                expect(data).toStrictEqual(Buffer.from(''));
            } else {
                throw new Error(`you can't be there`);
            }
        });
    });
    describe('from packet', () => {
        const basicPackages = {
            headers: {
                streamName: 'Voicemeeter-RTP',
                frameCounter: 0,
                isReply: false,
                service: EServiceType.RTPACKET,
                serviceFunction: 0
            }
        };
        it('should handle basic convert packet to buffer', () => {
            const packet = new VBANRealTimePacket(basicPackages.headers, Buffer.from(''));

            const buffer = VBANProtocolFactory.toUDPBuffer(packet);
            expect(buffer).toStrictEqual(Buffer.from('5642414e60002100566f6963656d65657465722d5254500000000000', 'hex'));
        });
    });

    it('decode / encode test', () => {
        const packet = new VBANRealTimePacket(
            {
                streamName: 'Voicemeeter-RTP',
                frameCounter: 0,
                isReply: false,
                service: EServiceType.RTPACKET,
                serviceFunction: 0
            },
            Buffer.from('')
        );

        const buffer = VBANProtocolFactory.toUDPBuffer(packet);
        expect(buffer).toStrictEqual(Buffer.from('5642414e60002100566f6963656d65657465722d5254500000000000', 'hex'));

        const packet2 = VBANProtocolFactory.processPacket(buffer);
        expect(packet2).toStrictEqual(packet);
    });

    it('should return an answer packet', async () => {
        const buffer = Buffer.from(`5642414e608020015642414e2053657276696365000f000001000000`, 'hex');

        const packet = VBANProtocolFactory.processPacket(buffer);
        expect(packet).toBeInstanceOf(VBANRealTimeRegisterAnswerPacket);
    });
});
