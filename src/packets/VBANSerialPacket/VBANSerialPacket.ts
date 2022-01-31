import { VBANPacket } from '../VBANPacket';
import { ESubProtocol } from '../ESubProtocol';
import { BITS_SPEEDS, EFormatBit, serialStopModes } from '../../commons';
import { ISerialBitMode } from './ISerialBitMode';
import { ESerialStreamType } from './ESerialStreamType';
import { IVBANHeaderSerial } from './IVBANHeaderSerial';
import { Buffer } from 'buffer';

export class VBANSerialPacket extends VBANPacket {
    /**
     * {@link VBANSerialPacket.subProtocol}
     */
    public static subProtocol: ESubProtocol = ESubProtocol.SERIAL;
    /**
     * @inheritDoc
     */
    public subProtocol: ESubProtocol = VBANSerialPacket.subProtocol;
    /**
     * This field is used to give possible information on COM port and serial transmission mode related
     * to a Hardware COM port. This is made to possibly emulate COM to COM port connections and
     * let the receiver configure the physical COM port in the right mode.
     */
    public bitMode: ISerialBitMode;
    /**
     * Can be used to define a sub channel (sub serial link) and then manage up to 256 different
     * serial virtual pipes (ZERO by default).
     */
    public channelsIdents: number;
    /**
     * SR / bps : Bit rate is given in bps for information only. But it can be useful if serial data come from or go to
     * a particular COM port. Set to ZERO if there is no particular bit rate.
     */
    public bps: number;
    /**
     * not used . Replaced by {@link VBANSerialPacket.bps}
     */
    public sr: number = 0;
    /**
     * Data type used to store data in the packet (ZERO per default). The index is stored on 3 first bits.
     * Bit 3 must be ZERO. Bits 4 to 7 gives additional mode
     */
    public formatBit: EFormatBit;
    /**
     * type of stream . MIDI or SERIAL ... But in practice, only serial is used (MIDI is serial)
     */
    public streamType: ESerialStreamType;

    public data: Buffer;

    constructor(headers: IVBANHeaderSerial, data: Buffer) {
        super({
            ...headers,
            sp: VBANSerialPacket.subProtocol
        });

        this.bitMode = headers.bitMode;
        this.channelsIdents = headers.channelsIdents;
        this.bps = headers.bps;
        this.formatBit = headers.formatBit;
        this.streamType = headers.streamType;

        this.data = data;

        //reset sr
        this.sr = 0;
    }

    public static toUDPPacket(packet: VBANSerialPacket): Buffer {
        let part1 = 0;

        const mode = serialStopModes.find((m) => m.stop === packet.bitMode.stop)?.mode;
        if (mode === undefined) {
            throw new Error(`fail to found mode for stop ${packet.bitMode.stop}`);
        }
        part1 |= mode & 0b00000011;

        if (packet.bitMode.start) {
            part1 |= 0b00000100;
        }

        if (packet.bitMode.parity) {
            part1 |= 0b00001000;
        }

        if (packet.bitMode.multipart) {
            part1 |= 0b10000000;
        }

        return this.convertToUDPPacket(
            {
                streamName: packet.streamName,
                sp: packet.subProtocol,
                sr: packet.bps,
                frameCounter: packet.frameCounter,
                part1,
                part2: packet.channelsIdents,
                part3: (packet.formatBit & 0b00000111) | (packet.streamType & 0b11110000)
            },
            packet.data
        );
    }

    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer): VBANSerialPacket {
        const headers = this.prepareFromUDPPacket(headersBuffer);

        if (!headers.srIndex || !BITS_SPEEDS[headers.srIndex]) {
            throw new Error(`unknown bits speed ${headers.srIndex}`);
        }

        const bps = BITS_SPEEDS[headers.srIndex];

        const bitModeRaw = headers.part1;

        const stopMode = bitModeRaw & 0b00000011;

        const stop = serialStopModes.find((m) => m.mode === stopMode)?.stop ?? null;

        const start = (bitModeRaw & 0b00000100) === 4;
        const parity = (bitModeRaw & 0b00001000) === 8;
        const multipart = (bitModeRaw & 0b10000000) === 128;

        const bitMode = {
            stop,
            start,
            parity,
            multipart
        };

        const channelsIdents = headers.part2;

        const dataFormat = headers.part3;
        const formatBit = dataFormat & 0b00000111;
        if (!EFormatBit[formatBit]) {
            throw new Error(`unknown format bit ${formatBit}`);
        }

        const streamType = dataFormat & 0b11110000;
        if (!ESerialStreamType[streamType]) {
            throw new Error(`unknown stream type ${streamType}`);
        }

        return new VBANSerialPacket(
            {
                ...headers,
                bps,
                bitMode,
                channelsIdents,
                formatBit,
                streamType
            },
            dataBuffer
        );
    }
}
