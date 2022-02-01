import { Buffer } from 'buffer';
import { PACKET_IDENTIFICATION } from './commons';
import { ESubProtocol, VBANAudioPacket, VBANSerialPacket, VBANServicePacket, VBANTEXTPacket } from './packets';

export class VBANProtocolFactory {
    public static processPacket(packet: Buffer): VBANAudioPacket | VBANSerialPacket | VBANTEXTPacket | VBANServicePacket {
        const headerBuffer = packet.slice(0, 28);
        const dataBuffer = packet.slice(28);

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
    ): typeof VBANAudioPacket | typeof VBANSerialPacket | typeof VBANTEXTPacket | typeof VBANServicePacket {
        switch (protocol) {
            case ESubProtocol.AUDIO:
                return VBANAudioPacket;
            case ESubProtocol.SERIAL:
                return VBANSerialPacket;
            case ESubProtocol.TEXT:
                return VBANTEXTPacket;
            case ESubProtocol.SERVICE:
                return VBANServicePacket;
            default:
                throw new Error(`unknown protocol ${protocol}`);
        }
    }

    public static toUDPBuffer(packet: VBANAudioPacket | VBANSerialPacket | VBANTEXTPacket | VBANServicePacket | unknown): Buffer {
        let buffer: Buffer;
        if (packet instanceof VBANAudioPacket) {
            buffer = VBANAudioPacket.toUDPPacket(packet);
        } else if (packet instanceof VBANSerialPacket) {
            buffer = VBANSerialPacket.toUDPPacket(packet);
        } else if (packet instanceof VBANTEXTPacket) {
            buffer = VBANTEXTPacket.toUDPPacket(packet);
        } else if (packet instanceof VBANServicePacket) {
            buffer = VBANServicePacket.toUDPPacket(packet);
        } else {
            throw new Error('unknown packet instance');
        }
        return buffer;
    }
}
