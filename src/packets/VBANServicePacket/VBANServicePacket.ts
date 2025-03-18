import { VBANPacket } from '../VBANPacket';
import { ESubProtocol } from '../ESubProtocol';
import { EServiceType } from './EServiceType';
import { Buffer } from 'buffer';
import { IVBANHeaderService } from './IVBANHeaderService';
import { EServiceFunction } from './EServiceFunction';

export class VBANServicePacket extends VBANPacket {
    /**
     * {@link VBANServicePacket.subProtocol}
     */
    public static readonly subProtocol: ESubProtocol = ESubProtocol.SERVICE;
    public subProtocol: ESubProtocol = VBANServicePacket.subProtocol;
    /**
     * Sub Type of the service packet
     * {@link EServiceType}
     */
    public service: EServiceType;
    /**
     * current function for this function
     */
    public serviceFunction: EServiceFunction;
    /**
     * answer is a reply to another request
     */
    public isReply: boolean = false;

    public data: unknown;

    /**
     * not used .
     */
    public sr: number = 0;

    constructor(headers: IVBANHeaderService) {
        super({
            ...headers,
            sp: VBANServicePacket.subProtocol,
            sr: 0
        });

        this.service = headers.service;
        this.serviceFunction = headers.serviceFunction;
        this.isReply = headers.isReply ?? false;

        //force sr to 0
        this.sr = 0;
    }

    public toUDPPacket(): ReturnType<(typeof VBANServicePacket)['toUDPPacket']> {
        return VBANServicePacket.toUDPPacket(this);
    }

    public static toUDPPacket(packet: VBANServicePacket): Buffer {
        return VBANServicePacket.convertToUDPPacket(
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
