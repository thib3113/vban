import { VBANServicePacket } from './VBANServicePacket';
import { IVBANHeaderService } from './IVBANHeaderService';
import { Buffer } from 'buffer';
import { EServiceType } from './EServiceType';
import { IVBANHeaderCommon } from '../IVBANHeaderCommon';
import { VBANRealTimeRegisterAnswerPacket } from './VBANRealTimeRegisterAnswerPacket';

export interface IRealTimeRegisterPacket {
    /**
     *  Time out in second (to stop RT packet broadcast)
     */
    timeout: number;
}

export class VBANRealTimeRegisterPacket extends VBANServicePacket {
    public data: IRealTimeRegisterPacket;
    constructor(headers: IVBANHeaderService, data: IRealTimeRegisterPacket) {
        super(headers);

        this.data = data;
    }

    public static fromUDPPacket(headers: IVBANHeaderCommon): VBANRealTimeRegisterPacket | VBANRealTimeRegisterAnswerPacket {
        const fn = headers.part1;
        const serviceFunction = fn & 0b01111111;
        const isReply = (fn & 0b10000000) >= 1;

        if (isReply) {
            return VBANRealTimeRegisterAnswerPacket.fromUDPPacket(headers);
        }

        return new VBANRealTimeRegisterPacket(
            {
                ...headers,
                service: EServiceType.RTPACKETREGISTER,
                serviceFunction,
                isReply
            },
            {
                timeout: headers.part3
            }
        );
    }

    public toUDPPacket(): ReturnType<(typeof VBANRealTimeRegisterPacket)['toUDPPacket']> {
        return VBANRealTimeRegisterPacket.toUDPPacket(this);
    }

    public static toUDPPacket(packet: VBANRealTimeRegisterPacket): Buffer {
        if (packet.data.timeout > 255 || packet.data.timeout < 0) {
            throw new Error('timeout need to be between 0 and 255');
        }

        return this.convertToUDPPacket(
            {
                streamName: packet.streamName,
                sp: packet.subProtocol,
                sr: packet.sr,
                frameCounter: packet.frameCounter,
                part1: ((packet.isReply ? 0b10000000 : 0) & 0b10000000) | (packet.serviceFunction & 0b01111111),
                part2: packet.service,
                part3: packet.data.timeout
            },
            Buffer.from(''),
            packet.sr
        );
    }
}
