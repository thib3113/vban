import { Buffer } from 'node:buffer';
import { VBANServicePacket } from '../VBANServicePacket.js';
import type { IVBANHeaderService } from '../IVBANHeaderService.js';
import { EServiceType } from '../EServiceType.js';
import type { IVBANHeaderCommon } from '../../IVBANHeaderCommon.js';

export class VBANRequestReplyPacket extends VBANServicePacket {
    public answer: string;
    constructor(headers: IVBANHeaderService, data: Buffer) {
        super(headers);

        this.answer = data?.toString('utf8');
    }

    public static fromUDPPacket(headers: IVBANHeaderCommon, data: Buffer): VBANRequestReplyPacket {
        const fn = headers.part1;
        const serviceFunction = fn & 0b01111111;
        const isReply = (fn & 0b10000000) >= 1;

        return new VBANRequestReplyPacket(
            {
                ...headers,
                service: EServiceType.VBAN_SERVICE_REQUESTREPLY,
                serviceFunction,
                isReply
            },
            data
        );
    }

    public toUDPPacket(): ReturnType<(typeof VBANRequestReplyPacket)['toUDPPacket']> {
        return VBANRequestReplyPacket.toUDPPacket(this);
    }

    public static toUDPPacket(packet: VBANRequestReplyPacket): Buffer {
        return this.convertToUDPPacket(
            {
                streamName: packet.streamName,
                sp: packet.subProtocol,
                sr: packet.sr,
                frameCounter: packet.frameCounter,
                part1: ((packet.isReply ? 0b10000000 : 0) & 0b10000000) | (packet.serviceFunction & 0b01111111),
                part2: packet.service,
                part3: 0
            },
            Buffer.from(packet.answer, 'utf8')
        );
    }
}
