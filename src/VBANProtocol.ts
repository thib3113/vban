import Buffer from 'buffer';
import { PACKET_IDENTIFICATION } from './commons';
import { ESubProtocol, VBANAudioPacket, VBANSerialPacket, VBANServicePacket, VBANTEXTPacket } from './packets';

export class VBANProtocol {
    private static frameCounter: Map<string, number>;
    public static processPacket(packet: Buffer): VBANAudioPacket | VBANSerialPacket | VBANTEXTPacket | VBANServicePacket {
        const headerBuffer = packet.slice(0, 28);
        const dataBuffer = packet.slice(28);

        if (headerBuffer.toString('ascii', 0, PACKET_IDENTIFICATION.length) !== PACKET_IDENTIFICATION) {
            throw new Error('Invalid Header');
        }

        // SR / Sub protocol (5 + 3 bits)
        const srsp = headerBuffer.readUInt8(PACKET_IDENTIFICATION.length);

        const sp = srsp & 0b11100000; // first 3 bits only
        let subProtocol: ESubProtocol = sp;

        switch (subProtocol) {
            case ESubProtocol.AUDIO:
                return VBANAudioPacket.fromUDPPacket(headerBuffer, dataBuffer);
            case ESubProtocol.SERIAL:
                return VBANSerialPacket.fromUDPPacket(headerBuffer, dataBuffer);
            case ESubProtocol.TEXT:
                return VBANTEXTPacket.fromUDPPacket(headerBuffer, dataBuffer);
            case ESubProtocol.SERVICE:
                return VBANServicePacket.fromUDPPacket(headerBuffer, dataBuffer);
            default:
                throw new Error(`unknown sub protocol ${sp}`);
        }
    }
    //
    // private static checkFrameCounter(headers: IVbanHeader) {
    //     //check frameCounter
    //     const frameCounterKey = 'str';
    //     const frameCounter = this.frameCounter.get(frameCounterKey);
    //     if (frameCounter && frameCounter > headers.frameCounter && headers.frameCounter > 0) {
    //         console.log('frameCounter error');
    //     }
    //
    //     this.frameCounter.set(frameCounterKey, headers.frameCounter);
    // }

    /**
     * Split a packet into header and audio data
     * @param {Buffer} packet VBAN packet
     * @return {Object} The header and audio from the packet
    //  */
    // public static processPacket(packet: Buffer) {
    //     const header = this.processHeader(packet.slice(0, 28));
    //     const data = packet.slice(28);
    //
    //     return {
    //         header,
    //         data
    //     };
    // }
}
