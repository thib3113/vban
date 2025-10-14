import { Buffer } from 'node:buffer';
import type { VBANPacketConstructorsTypes, VBANPacketTypes } from './packets/index.js';
import { ESubProtocol, VBANAudioPacket, VBANPacket, VBANSerialPacket, VBANServicePacketFactory, VBANTEXTPacket } from './packets/index.js';
import { VBANUnknownPacket } from './packets/VBANUnknownPacket/index.js';

type constructorsTypes = VBANPacketConstructorsTypes | typeof VBANServicePacketFactory;
const constructorsMaps = new Map<ESubProtocol, constructorsTypes>([
    [ESubProtocol.AUDIO, VBANAudioPacket],
    [ESubProtocol.SERIAL, VBANSerialPacket],
    [ESubProtocol.TEXT, VBANTEXTPacket],
    [ESubProtocol.SERVICE, VBANServicePacketFactory],
    [ESubProtocol.UNKNOWN, VBANUnknownPacket]
]);

export class VBANProtocolFactory {
    public static processPacket(packet: Buffer): VBANPacketTypes {
        const { headers, data } = VBANPacket.parsePacket(packet);

        return (
            VBANProtocolFactory.getConstructor(headers.sp)?.fromUDPPacket(headers, data) ?? VBANUnknownPacket.fromUDPPacket(headers, data)
        );
    }

    public static getConstructor(protocol: ESubProtocol): constructorsTypes {
        return constructorsMaps.get(protocol) ?? VBANUnknownPacket;
    }

    public static toUDPBuffer(packet: Pick<VBANPacket, 'subProtocol'>): Buffer {
        const constructor = constructorsMaps.get(packet.subProtocol) ?? VBANUnknownPacket;

        // forced, so user can pass a custom packet, and constructor will try to build it .
        return constructor.toUDPPacket(packet as any);
    }
}
