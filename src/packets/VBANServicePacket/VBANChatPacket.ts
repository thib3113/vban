import { VBANServicePacket } from './VBANServicePacket';
import { IVBANHeaderService } from './IVBANHeaderService';
import { Buffer } from 'buffer';
import { EServiceType } from './EServiceType';
import { prepareStringForPacket } from '../../commons';
import { IVBANHeaderCommon } from '../IVBANHeaderCommon';

export class VBANChatPacket extends VBANServicePacket {
    public data: string;
    constructor(headers: IVBANHeaderService, data: string) {
        super(headers);

        this.data = data;
    }

    public static fromUDPPacket(headers: IVBANHeaderCommon, dataBuffer: Buffer): VBANChatPacket {
        const fn = headers.part1;
        const serviceFunction = fn & 0b01111111;
        const isReply = (fn & 0b10000000) >= 1;

        console.log(headers);

        return new VBANChatPacket(
            {
                ...headers,
                service: EServiceType.CHATUTF8,
                serviceFunction,
                isReply
            },
            dataBuffer.toString()
        );
    }

    public toUDPPacket(): ReturnType<(typeof VBANChatPacket)['toUDPPacket']> {
        return VBANChatPacket.toUDPPacket(this);
    }

    public static toUDPPacket(packet: VBANChatPacket): Buffer {
        // 704 is the size for a service packet
        const dataBuffer = Buffer.alloc(676);
        dataBuffer.write(prepareStringForPacket(packet.data, 676), 0, 'utf8');

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
            dataBuffer,
            packet.sr
        );
    }
}
