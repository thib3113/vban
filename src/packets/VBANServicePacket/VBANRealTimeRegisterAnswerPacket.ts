import { Buffer } from 'buffer';
import { VBANServicePacket } from './VBANServicePacket.js';
import { IVBANHeaderService } from './IVBANHeaderService.js';
import { EServiceType } from './EServiceType.js';
import { IVBANHeaderCommon } from '../IVBANHeaderCommon.js';

export enum ERegistrationAnswer {
    /**
     * no RT packet service (could mean the packet ID is not existing).
     */
    NO_RT_PACKET_SERVICE = 0,
    /**
     * RT packet service registered
     */
    RT_PACKET_SERVICE_REGISTERED = 1,
    /**
     * RT packet service busy (no more slot).
     */
    RT_PACKET_SERVICE_BUSY = 2
}

export interface IRealTimeRegisterAnswerPacket {
    /**
     * Registration answer
     */
    answer: ERegistrationAnswer;
}

export class VBANRealTimeRegisterAnswerPacket extends VBANServicePacket {
    public data: IRealTimeRegisterAnswerPacket;
    constructor(headers: IVBANHeaderService, data: IRealTimeRegisterAnswerPacket) {
        super(headers);

        this.data = data;
    }

    public static fromUDPPacket(headers: IVBANHeaderCommon): VBANRealTimeRegisterAnswerPacket {
        const fn = headers.part1;
        const serviceFunction = fn & 0b01111111;
        const isReply = (fn & 0b10000000) >= 1;

        return new VBANRealTimeRegisterAnswerPacket(
            {
                ...headers,
                service: EServiceType.RTPACKETREGISTER,
                serviceFunction,
                isReply
            },
            {
                answer: headers.part3
            }
        );
    }

    public toUDPPacket(): ReturnType<(typeof VBANRealTimeRegisterAnswerPacket)['toUDPPacket']> {
        return VBANRealTimeRegisterAnswerPacket.toUDPPacket(this);
    }

    public static toUDPPacket(packet: VBANRealTimeRegisterAnswerPacket): Buffer {
        return this.convertToUDPPacket(
            {
                streamName: packet.streamName,
                sp: packet.subProtocol,
                sr: packet.sr,
                frameCounter: packet.frameCounter,
                part1: ((packet.isReply ? 0b10000000 : 0) & 0b10000000) | (packet.serviceFunction & 0b01111111),
                part2: packet.service,
                part3: packet.data.answer
            },
            Buffer.from(''),
            packet.sr
        );
    }
}
