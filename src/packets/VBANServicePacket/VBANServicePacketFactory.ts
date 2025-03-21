import { Buffer } from 'buffer';
import { VBANServicePacket } from './VBANServicePacket';
import { EServiceType } from './EServiceType';
import { VBANPacket } from '../VBANPacket';
import { VBANPingPacket } from './VBANPingPacket';
import { VBANChatPacket } from './VBANChatPacket';
import { VBANRealTimeRegisterPacket } from './VBANRealTimeRegisterPacket';
import { VBANRealTimePacket } from './VBANRealTimePacket';

export class VBANServicePacketFactory {
    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer): VBANServicePacket {
        const headers = VBANPacket.prepareFromUDPPacket(headersBuffer);
        const service = headers.part2;

        return this.getConstructor(service).fromUDPPacket(headers, dataBuffer);
    }

    private static getConstructor(
        protocol: EServiceType
    ): typeof VBANPingPacket | typeof VBANChatPacket | typeof VBANRealTimeRegisterPacket | typeof VBANRealTimePacket {
        switch (protocol) {
            case EServiceType.IDENTIFICATION:
                return VBANPingPacket;
            case EServiceType.CHATUTF8:
                return VBANChatPacket;
            case EServiceType.RTPACKET:
                return VBANRealTimePacket;
            case EServiceType.RTPACKETREGISTER:
                return VBANRealTimeRegisterPacket;
            default:
                throw new Error(`unknown protocol ${protocol}`);
        }
    }

    static toUDPPacket(packet: VBANServicePacket): Buffer {
        return packet.toUDPPacket();
    }
}
