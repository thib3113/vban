import { Buffer } from 'node:buffer';
import { VBANPacket } from '../VBANPacket.js';
import { IVBANHeaderCommon } from '../IVBANHeaderCommon.js';

export class VBANUnknownPacket extends VBANPacket {
    public subProtocol = -1;

    public data: Buffer;

    public part1: number;

    public part2: number;

    public part3: number;

    constructor(headers: IVBANHeaderCommon, data: Buffer) {
        super(headers);

        this.part1 = headers.part1;
        this.part2 = headers.part2;
        this.part3 = headers.part3;

        this.data = data;
    }

    public toUDPPacket(): ReturnType<(typeof VBANUnknownPacket)['toUDPPacket']> {
        return VBANUnknownPacket.toUDPPacket(this);
    }

    public static toUDPPacket(packet: VBANUnknownPacket): Buffer {
        return VBANUnknownPacket.convertToUDPPacket(
            {
                streamName: packet.streamName,
                sp: packet.subProtocol,
                sr: packet.sr,
                frameCounter: packet.frameCounter,
                part1: packet.part1,
                part2: packet.part2,
                part3: packet.part3
            },
            packet.data,
            packet.sr
        );
    }

    public static fromUDPPacket(headersBuffer: Buffer, data: Buffer): VBANUnknownPacket {
        const headers = VBANPacket.prepareFromUDPPacket(headersBuffer);
        return new VBANUnknownPacket(headers, data);
    }
}
