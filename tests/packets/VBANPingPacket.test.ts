import { Buffer } from 'buffer';
import {
    EServiceFunction,
    EServicePINGApplicationType,
    EServicePINGFeatures,
    EServiceType,
    ESubProtocol,
    VBANPingPacket,
    VBANProtocolFactory
} from '../../src/index.js';

describe('VBANPingPacket.test.ts', () => {
    describe('from Buffer', () => {
        it('should handle basic convert buffer to packet', () => {
            const buffer = Buffer.from(
                `5642414e600000005642414e2053657276696365000000000f000000200000000103010000000000000000007017000040c40a004ae83900030002020000000000000000000000000000000066722d667200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000057696e646f777320504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000056422d417564696f20536f6674776172650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000566f6963656d656574657220506f7461746f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000686f73746e616d65000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`,
                'hex'
            );

            const packet = VBANProtocolFactory.processPacket(buffer);
            expect(packet).toBeInstanceOf(VBANPingPacket);

            if (packet instanceof VBANPingPacket) {
                expect(packet.subProtocol).toBe(ESubProtocol.SERVICE);
                //always 0 for a Service packet
                expect(packet.sr).toBe(0);

                expect(packet.streamName).toBe('VBAN Service');

                expect(packet.frameCounter).toBe(15);
                expect(packet.isReply).toBe(false);
                expect(packet.service).toBe(EServiceType.IDENTIFICATION);
                expect(packet.serviceFunction).toBe(EServiceFunction.PING0);

                const { data } = packet;

                expect(data.applicationType).toBe(EServicePINGApplicationType.VIRTUALMIXER);
                expect(data.features).toStrictEqual(
                    expect.arrayContaining([
                        EServicePINGFeatures.AUDIO,
                        EServicePINGFeatures.SERIAL,
                        EServicePINGFeatures.MIDI,
                        EServicePINGFeatures.TXT
                    ])
                );
                expect(data.bitFeatureEx).toBe(0);
                expect(data.PreferredRate).toBe(0);
                expect(data.minRate).toBe(6000);
                expect(data.maxRate).toBe(705600);
                expect(data.color).toStrictEqual({
                    blue: 74,
                    green: 232,
                    red: 57
                });
                expect(data.nVersion).toBe(33685507);
                expect(data.GPSPosition).toBe('');
                expect(data.userPosition).toBe('');
                expect(data.langCode).toBe('fr-fr');
                expect(data.reservedASCII).toBe('');
                expect(data.reservedEx).toBe('');
                expect(data.reservedEx2).toBe('');
                expect(data.deviceName).toBe('Windows PC');
                expect(data.manufacturerName).toBe('VB-Audio Software');
                expect(data.applicationName).toBe('Voicemeeter Potato');
                expect(data.hostname).toBe('hostname');
                expect(data.userName).toBe('');
                expect(data.userComment).toBe('');
            } else {
                throw new Error(`you can't be there`);
            }
        });
        it('should refuse an unknown service function', () => {
            const buffer = Buffer.from(
                `5642414e600014005642414e2053657276696365000000000f000000200000000103010000000000000000007017000040c40a004ae83900030002020000000000000000000000000000000066722d667200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000057696e646f777320504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000056422d417564696f20536f6674776172650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000566f6963656d656574657220506f7461746f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000686f73746e616d65000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`,
                'hex'
            );

            expect.assertions(2);
            try {
                VBANProtocolFactory.processPacket(buffer);
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('unknown protocol 20');
            }
        });
    });
    describe('from packet', () => {
        const basicPackages = {
            headers: {
                streamName: 'VBAN Service',
                frameCounter: 15,
                isReply: false,
                service: 0,
                serviceFunction: 0
            },
            data: {
                applicationType: EServicePINGApplicationType.VIRTUALMIXER,
                features: [EServicePINGFeatures.AUDIO, EServicePINGFeatures.SERIAL, EServicePINGFeatures.MIDI, EServicePINGFeatures.TXT],
                bitFeatureEx: 0,
                PreferredRate: 0,
                minRate: 6000,
                maxRate: 705600,
                color: {
                    blue: 74,
                    green: 232,
                    red: 57
                },
                nVersion: 33685507,
                GPSPosition: '',
                userPosition: '',
                langCode: 'fr-fr',
                reservedASCII: '',
                reservedEx: '',
                reservedEx2: '',
                deviceName: 'Windows PC',
                manufacturerName: 'VB-Audio Software',
                applicationName: 'Voicemeeter Potato',
                hostname: 'hostname',
                userName: '',
                userComment: ''
            }
        };
        it('should handle basic convert packet to buffer', () => {
            const packet = new VBANPingPacket(basicPackages.headers, basicPackages.data);

            const buffer = VBANProtocolFactory.toUDPBuffer(packet);
            expect(buffer).toStrictEqual(
                Buffer.from(
                    '5642414e600000005642414e2053657276696365000000000f000000200000000103010000000000000000007017000040c40a004ae83900030002020000000000000000000000000000000066722d667200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000057696e646f777320504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000056422d417564696f20536f6674776172650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000566f6963656d656574657220506f7461746f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000686f73746e616d65000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                    'hex'
                )
            );
        });
    });

    it('decode / encode test', () => {
        const packet = new VBANPingPacket(
            {
                streamName: 'VBAN Service',
                frameCounter: 15,
                isReply: false,
                service: 0,
                serviceFunction: 0
            },
            {
                applicationType: EServicePINGApplicationType.VIRTUALMIXER,
                features: [EServicePINGFeatures.AUDIO, EServicePINGFeatures.SERIAL, EServicePINGFeatures.MIDI, EServicePINGFeatures.TXT],
                bitFeatureEx: 0,
                PreferredRate: 0,
                minRate: 6000,
                maxRate: 705600,
                color: {
                    blue: 74,
                    green: 232,
                    red: 57
                },
                nVersion: 33685507,
                GPSPosition: '',
                userPosition: '',
                langCode: 'fr-fr',
                reservedASCII: '',
                reservedEx: '',
                reservedEx2: '',
                deviceName: 'Windows PC',
                manufacturerName: 'VB-Audio Software',
                applicationName: 'Voicemeeter Potato',
                hostname: 'hostname',
                userName: '',
                userComment: ''
            }
        );

        const buffer = VBANProtocolFactory.toUDPBuffer(packet);
        expect(buffer).toStrictEqual(
            Buffer.from(
                '5642414e600000005642414e2053657276696365000000000f000000200000000103010000000000000000007017000040c40a004ae83900030002020000000000000000000000000000000066722d667200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000057696e646f777320504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000056422d417564696f20536f6674776172650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000566f6963656d656574657220506f7461746f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000686f73746e616d65000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                'hex'
            )
        );

        const packet2 = VBANProtocolFactory.processPacket(buffer);
        expect(packet2).toStrictEqual(packet);
    });
});
