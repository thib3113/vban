import { VBANPacket } from '../VBANPacket';
import { Buffer } from 'buffer';
import { ESubProtocol } from '../ESubProtocol';
import { BITS_SPEEDS, EFormatBit } from '../../commons';
import { ETextEncoding } from './ETextEncoding';
import { IVBANHeaderTEXT } from './IVBANHeaderTEXT';

export class VBANTEXTPacket extends VBANPacket {
    public static subProtocol: ESubProtocol = ESubProtocol.TEXT;
    public subProtocol: ESubProtocol = VBANTEXTPacket.subProtocol;
    public bps: number;
    public channelsIdents: number;
    public formatBit: EFormatBit;
    public encoding: ETextEncoding;
    /**
     * if data can be decoded, it will be decoded in text
     */
    public text: string;
    public dataBuffer?: Buffer;

    constructor(headers: IVBANHeaderTEXT, txt: string = '', dataBuffer?: Buffer) {
        super({
            ...headers,
            sp: VBANTEXTPacket.subProtocol,
            sr: headers.bps ?? 0
        });

        this.bps = this.sr;
        this.channelsIdents = headers.channelsIdents ?? 0;
        this.formatBit = headers.formatBit;
        this.encoding = headers.streamType;

        this.text = txt;
        this.dataBuffer = dataBuffer;
    }

    public static toUDPPacket(packet: VBANTEXTPacket): Buffer {
        const data = packet.text ? Buffer.from(packet.text, this.getEncoding(packet.encoding)) : packet.dataBuffer ?? Buffer.from('');

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
            packet.bps
        );
    }

    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer) {
        const headers = this.prepareFromUDPPacket(headersBuffer);

        if (!headers.srIndex || !BITS_SPEEDS[headers.srIndex]) {
            throw new Error(`unknown bits speed ${headers.srIndex}`);
        }

        const bps = BITS_SPEEDS[headers.srIndex];

        const channelsIdents = headers.part2;

        const dataFormat = headers.part3;
        const formatBit = dataFormat & 0b00000111;
        if (!EFormatBit[formatBit]) {
            throw new Error(`unknown format bit ${formatBit}`);
        }

        const streamType = dataFormat & 0b11110000;
        if (!ETextEncoding[streamType]) {
            throw new Error(`unknown text stream type ${streamType}`);
        }

        const textEncoding = this.getEncoding(streamType);

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
                streamType
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
            //need to test this, voicemeeter seems to doesn't use it
            textEncoding = 'utf16le';
        } else if (streamType === ETextEncoding.VBAN_TXT_ASCII) {
            textEncoding = 'ascii';
        }

        return textEncoding;
    }
}
