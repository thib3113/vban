import { VBANServicePacket } from '../VBANServicePacket.js';
import { IVBANHeaderService } from '../IVBANHeaderService.js';
import { EServiceType } from '../EServiceType.js';
import { prepareStringForPacket } from '../../../commons.js';
import { IVBANHeaderCommon } from '../../IVBANHeaderCommon.js';
import { Buffer } from 'node:buffer';

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
        // Use allocUnsafe for performance as the buffer is fully overwritten below.
        // This avoids zero-filling the memory.
        const dataBuffer = Buffer.allocUnsafe(676);
        const written = dataBuffer.write(prepareStringForPacket(packet.data, 676), 0, 'utf8');
        if (written < 676) {
            dataBuffer.fill(0, written);
        }

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
