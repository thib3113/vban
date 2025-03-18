import { VBANPacket } from '../VBANPacket';
import { Buffer } from 'buffer';
import { ESubProtocol } from '../ESubProtocol';
import { BITS_SPEEDS, EFormatBit } from '../../commons';
import { ETextEncoding } from './ETextEncoding';
import { IVBANHeaderTEXT } from './IVBANHeaderTEXT';

export class VBANTEXTPacket extends VBANPacket {
    /**
     * {@link VBANTEXTPacket.subProtocol}
     */
    public static readonly subProtocol: ESubProtocol = ESubProtocol.TEXT;
    public subProtocol: ESubProtocol = VBANTEXTPacket.subProtocol;
    /**
     * Bit rate is given in bps for information only. But it can be used internally to limit the bandwidth of
     * the stream and for example gives more priority to audio stream or RT MIDI stream. It can be set
     * to ZERO if there is no particular bit rate.
     */
    public bps: number;
    /**
     * Can be used to define a sub channel (sub text channel) and then manage up to 256 different
     * virtual pipes (ZERO by default).
     */
    public channelsIdents: number;
    /**
     * Data type used to store data in the packet (ZERO/VBAN_DATATYPE_BYTE8 per default).
     */
    public formatBit: EFormatBit;
    /**
     * Text format
     */
    public encoding: ETextEncoding;
    /**
     * not used . Replaced by {@link VBANTEXTPacket.bps}
     */
    sr: number;
    /**
     * if data can be decoded, it will be decoded in text
     */
    public text: string;
    /**
     * you can access the raw dataBuffer (if available) to try another decoding
     */
    public dataBuffer?: Buffer;

    constructor(headers: IVBANHeaderTEXT, txt: string = '', dataBuffer?: Buffer) {
        super({
            ...headers,
            sp: VBANTEXTPacket.subProtocol,
            sr: 0
        });

        this.bps = headers.bps ?? BITS_SPEEDS[0];
        this.channelsIdents = headers.channelsIdents ?? 0;
        this.formatBit = headers.formatBit ?? EFormatBit.VBAN_DATATYPE_BYTE8;
        this.encoding = headers.encoding;

        this.text = txt;
        this.dataBuffer = dataBuffer;

        //force sr to 0
        this.sr = 0;
    }

    public static toUDPPacket(packet: VBANTEXTPacket): Buffer {
        const data = packet.text
            ? Buffer.from(packet.text, VBANTEXTPacket.getEncoding(packet.encoding))
            : packet.dataBuffer ?? Buffer.from('');

        //search bpsId
        const bpsId =
            Number(
                Object.entries(BITS_SPEEDS)
                    .find(([, bps]) => bps && bps === packet.bps)
                    ?.shift()
            ) || 0;

        return this.convertToUDPPacket(
            {
                streamName: packet.streamName,
                sp: packet.subProtocol,
                sr: packet.bps,
                frameCounter: packet.frameCounter,
                part1: 0,
                part2: packet.channelsIdents,
                part3: (packet.formatBit & 0b00000111) | (packet.encoding & 0b11110000)
            },
            data,
            bpsId
        );
    }

    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer) {
        const headers = this.prepareFromUDPPacket(headersBuffer);

        if (headers.srIndex === undefined || BITS_SPEEDS[headers.srIndex] === undefined) {
            throw new Error(`unknown bits speed ${headers.srIndex}`);
        }

        const bps = BITS_SPEEDS[headers.srIndex];

        const channelsIdents = headers.part2;

        const dataFormat = headers.part3;
        const formatBit = dataFormat & 0b00000111;
        if (!EFormatBit[formatBit]) {
            throw new Error(`unknown format bit ${formatBit}`);
        }

        const encoding = dataFormat & 0b11110000;
        if (!ETextEncoding[encoding]) {
            throw new Error(`unknown text stream type ${encoding}`);
        }

        const textEncoding = VBANTEXTPacket.getEncoding(encoding);

        let text;
        if (textEncoding) {
            text = dataBuffer.toString(textEncoding);
        }

        return new VBANTEXTPacket(
            {
                ...headers,
                bps,
                channelsIdents,
                formatBit,
                encoding
            },
            text,
            dataBuffer
        );
    }

    static getEncoding(streamType: ETextEncoding): BufferEncoding | undefined {
        let textEncoding: BufferEncoding | undefined;
        if (streamType === ETextEncoding.VBAN_TXT_UTF8) {
            textEncoding = 'utf8';
        } else if (streamType === ETextEncoding.VBAN_TXT_WCHAR) {
            //need to test this, voicemeeter seems to don't use it
            textEncoding = 'utf16le';
        } else if (streamType === ETextEncoding.VBAN_TXT_ASCII) {
            textEncoding = 'ascii';
        }

        return textEncoding;
    }
}
