import { Buffer } from 'node:buffer';
import type { VBANPacketTypes } from './packets/index.js';
import {
    ESubProtocol,
    VBANAudioPacket,
    VBANPacket,
    VBANSerialPacket,
    VBANServicePacket,
    VBANServicePacketFactory,
    VBANTEXTPacket
} from './packets/index.js';
import { VBANUnknownPacket } from './packets/VBANUnknownPacket/index.js';
import { createDebugger } from './debugLogger.js';
import { randomBytes } from 'node:crypto';

const debug = createDebugger('VBANProtocolFactory');
export class VBANProtocolFactory {
    public static processPacket(packet: Buffer): VBANPacketTypes {
        const localDebug = debug.extend(randomBytes(1).toString('hex'));
        localDebug('start processPacket');
        const { headers, data } = VBANPacket.parsePacket(packet);

        try {
            let objectPacket = VBANProtocolFactory.getConstructor(headers.sp)?.fromUDPPacket(headers, data);

            if (objectPacket) {
                return objectPacket;
            }

            return VBANUnknownPacket.fromUDPPacket(headers, data);
        } finally {
            localDebug('end processPacket');
        }
    }

    public static getConstructor(
        protocol: ESubProtocol
    ): undefined | typeof VBANAudioPacket | typeof VBANSerialPacket | typeof VBANTEXTPacket | typeof VBANServicePacketFactory {
        switch (protocol) {
            case ESubProtocol.AUDIO:
                return VBANAudioPacket;
            case ESubProtocol.SERIAL:
                return VBANSerialPacket;
            case ESubProtocol.TEXT:
                return VBANTEXTPacket;
            case ESubProtocol.SERVICE:
                return VBANServicePacketFactory;
            default:
                return undefined;
        }
    }

    public static toUDPBuffer(packet: Pick<VBANPacket, 'subProtocol'>): Buffer {
        const localDebug = debug.extend(randomBytes(1).toString('hex'));
        localDebug('start converting to UDP');
        try {
            switch (packet.subProtocol) {
                case ESubProtocol.AUDIO:
                    return VBANAudioPacket.toUDPPacket(packet as VBANAudioPacket);
                case ESubProtocol.SERIAL:
                    return VBANSerialPacket.toUDPPacket(packet as VBANSerialPacket);
                case ESubProtocol.TEXT:
                    return VBANTEXTPacket.toUDPPacket(packet as VBANTEXTPacket);
                case ESubProtocol.SERVICE:
                    return VBANServicePacketFactory.toUDPPacket(packet as VBANServicePacket);
                default:
                    throw new Error('unknown packet instance');
            }
        } finally {
            localDebug('end converting to UDP');
        }
    }
}
