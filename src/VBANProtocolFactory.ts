import { Buffer } from 'buffer';
import { PACKET_IDENTIFICATION } from './commons.js';
import {
    ESubProtocol,
    VBANAudioPacket,
    VBANPacket,
    VBANSerialPacket,
    VBANServicePacket,
    VBANServicePacketFactory,
    VBANTEXTPacket
} from './packets/index.js';

export class VBANProtocolFactory {
    public static processPacket(packet: Buffer): VBANAudioPacket | VBANSerialPacket | VBANTEXTPacket | VBANServicePacket {
        const headerBuffer = packet.subarray(0, 28);
        const dataBuffer = packet.subarray(28);

        if (headerBuffer.toString('ascii', 0, PACKET_IDENTIFICATION.length) !== PACKET_IDENTIFICATION) {
            throw new Error('Invalid Header');
        }

        // SR / Sub protocol (5 + 3 bits)
        const header1 = headerBuffer.readUInt8(PACKET_IDENTIFICATION.length);

        // first 3 bits only
        const subProtocol: ESubProtocol = header1 & 0b11100000;

        return VBANProtocolFactory.getConstructor(subProtocol).fromUDPPacket(headerBuffer, dataBuffer);
    }

    public static getConstructor(
        protocol: ESubProtocol
    ): typeof VBANAudioPacket | typeof VBANSerialPacket | typeof VBANTEXTPacket | typeof VBANServicePacketFactory {
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
                throw new Error(`unknown protocol ${protocol}`);
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
