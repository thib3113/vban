import { Buffer } from 'node:buffer';
import { VBANServicePacket } from './VBANServicePacket.js';
import { EServiceType } from './EServiceType.js';
import { VBANPacket } from '../VBANPacket.js';
import { VBANPingPacket } from './subPackets/VBANPingPacket.js';
import { VBANChatPacket } from './subPackets/VBANChatPacket.js';
import { VBANRealTimeRegisterPacket } from './subPackets/VBANRealTimeRegisterPacket.js';
import { VBANRealTimePacket } from './subPackets/VBANRealTimePacket.js';
import { VBANRequestReplyPacket } from './subPackets/VBANRequestReplyPacket.js';

export class VBANServicePacketFactory {
    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer): undefined | VBANServicePacket {
        const headers = VBANPacket.prepareFromUDPPacket(headersBuffer);
        const service = headers.part2;

        return this.getConstructor(service)?.fromUDPPacket(headers, dataBuffer);
    }

    private static getConstructor(
        protocol: EServiceType
    ):
        | undefined
        | typeof VBANPingPacket
        | typeof VBANChatPacket
        | typeof VBANRealTimeRegisterPacket
        | typeof VBANRealTimePacket
        | typeof VBANRequestReplyPacket {
        switch (protocol) {
            case EServiceType.IDENTIFICATION:
                return VBANPingPacket;
            case EServiceType.CHATUTF8:
                return VBANChatPacket;
            case EServiceType.RTPACKET:
                return VBANRealTimePacket;
            case EServiceType.RTPACKETREGISTER:
                return VBANRealTimeRegisterPacket;
            case EServiceType.VBAN_SERVICE_REQUESTREPLY:
                return VBANRequestReplyPacket;
            default:
                return undefined;
        }
    }

    static toUDPPacket(packet: VBANServicePacket): Buffer {
        return packet.toUDPPacket();
    }
}
