import { VBANServicePacket } from './VBANServicePacket';
import { IVBANHeaderService } from './IVBANHeaderService';
import { Buffer } from 'buffer';
import { EServiceType } from './EServiceType';
import { IVBANHeaderCommon } from '../IVBANHeaderCommon';

export class VBANRealTimePacket extends VBANServicePacket {
    /**
     * not clear about the content of this buffer
     */
    public data: Buffer;
    constructor(headers: IVBANHeaderService, data: Buffer) {
        super(headers);

        this.data = data;
    }

    public static fromUDPPacket(headers: IVBANHeaderCommon, dataBuffer: Buffer): VBANRealTimePacket {
        const fn = headers.part1;
        const serviceFunction = fn & 0b01111111;
        const isReply = (fn & 0b10000000) >= 1;

        return new VBANRealTimePacket(
            {
                ...headers,
                service: EServiceType.RTPACKET,
                serviceFunction,
                isReply
            },
            dataBuffer
        );
    }

    public toUDPPacket(): ReturnType<(typeof VBANRealTimePacket)['toUDPPacket']> {
        return VBANRealTimePacket.toUDPPacket(this);
    }

    public static toUDPPacket(packet: VBANRealTimePacket): Buffer {
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
            Buffer.from(''),
            packet.sr
        );
    }
}
