import { Buffer } from 'node:buffer';
import type { VBANPacketTypes } from './packets/index.js';
import {
    ESubProtocol,
    VBANAudioPacket,
    VBANPacket,
    VBANSerialPacket,
    VBANServicePacket,
    VBANServicePacketFactory,
    VBANTEXTPacket
} from './packets/index.js';
import { VBANUnknownPacket } from './packets/VBANUnknownPacket/index.js';

export class VBANProtocolFactory {
    public static processPacket(packet: Buffer): VBANPacketTypes {
        const { headers, data } = VBANPacket.parsePacket(packet);

        let objectPacket = VBANProtocolFactory.getConstructor(headers.sp)?.fromUDPPacket(headers, data);

        if (objectPacket) {
            return objectPacket;
        }

        return VBANUnknownPacket.fromUDPPacket(headers, data);
    }

    public static getConstructor(
        protocol: ESubProtocol
    ): undefined | typeof VBANAudioPacket | typeof VBANSerialPacket | typeof VBANTEXTPacket | typeof VBANServicePacketFactory {
        switch (protocol) {
            case ESubProtocol.AUDIO:
                return VBANAudioPacket;
            case ESubProtocol.SERIAL:
                return VBANSerialPacket;
            case ESubProtocol.TEXT:
                return VBANTEXTPacket;
            case ESubProtocol.SERVICE:
                return VBANServicePacketFactory;
            default:
                return undefined;
        }
    }

    public static toUDPBuffer(packet: Pick<VBANPacket, 'subProtocol'>): Buffer {
        switch (packet.subProtocol) {
            case ESubProtocol.AUDIO:
                return VBANAudioPacket.toUDPPacket(packet as VBANAudioPacket);
            case ESubProtocol.SERIAL:
                return VBANSerialPacket.toUDPPacket(packet as VBANSerialPacket);
            case ESubProtocol.TEXT:
                return VBANTEXTPacket.toUDPPacket(packet as VBANTEXTPacket);
            case ESubProtocol.SERVICE:
                return VBANServicePacketFactory.toUDPPacket(packet as VBANServicePacket);
            default:
                throw new Error('unknown packet instance');
        }
    }
}
