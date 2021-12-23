import { VBANPacket } from '../VBANPacket';
import { Buffer } from 'buffer';
import { ESubProtocol } from '../ESubProtocol';
import { BITS_SPEEDS, EFormatBit } from '../../commons';
import { ETextStreamType } from './ETextStreamType';
import { IVBANHeader } from '../IVBANHeader';

interface IVBANHeaderTEXT extends Omit<IVBANHeader, 'sp' | 'sr'> {
    bps?: number;
    channelsIdents?: number;
    formatBit: EFormatBit;
    streamType: ETextStreamType;
}

export class VBANTEXTPacket extends VBANPacket {
    public subProtocol: ESubProtocol = ESubProtocol.TEXT;
    public bps: number;
    public channelsIdents: number;
    public formatBit: EFormatBit;
    public streamType: ETextStreamType;
    /**
     * if data can be decoded, it will be decoded in text
     */
    public text: string;
    public dataBuffer?: Buffer;

    constructor(headers: IVBANHeaderTEXT, txt: string = '', dataBuffer?: Buffer) {
        super({
            ...headers,
            sp: ESubProtocol.TEXT,
            sr: headers.bps ?? 0
        });

        this.bps = this.sr;
        this.channelsIdents = headers.channelsIdents ?? 0;
        this.formatBit = headers.formatBit;
        this.streamType = headers.streamType;

        this.text = txt;
        this.dataBuffer = dataBuffer;
    }

    public static toUDPPacket(packet: VBANTEXTPacket): Buffer {
        const data = packet.text ? Buffer.from(packet.text, this.getEncoding(packet.streamType)) : packet.dataBuffer ?? Buffer.from('');

        return this.convertToUDPPacket(
            {
                streamName: packet.streamName,
                sp: packet.subProtocol,
                sr: packet.bps,
                frameCounter: packet.frameCounter,
                part1: 0,
                part2: packet.channelsIdents,
                part3: (packet.formatBit & 0b00000111) | (packet.streamType & 0b11110000)
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

        const bps = BITS_SPEEDS[headers.srIndex] as number;

        const channelsIdents = headers.part2;

        const dataFormat = headers.part3;
        const formatBit = dataFormat & 0b00000111;
        if (!EFormatBit[formatBit]) {
            throw new Error(`unknown format bit ${formatBit}`);
        }

        const streamType = dataFormat & 0b11110000;
        if (!ETextStreamType[streamType]) {
            throw new Error(`unknown text stream type ${streamType}`);
        }

        let textEncoding = this.getEncoding(streamType);

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

    static getEncoding(streamType: ETextStreamType): BufferEncoding | undefined {
        let textEncoding: BufferEncoding | undefined;
        if (streamType === ETextStreamType.VBAN_TXT_UTF8) {
            textEncoding = 'utf8';
        } else if (streamType === ETextStreamType.VBAN_TXT_WCHAR) {
            //need to test this, voicemeeter seems to doesn't use it
            textEncoding = 'utf16le';
        } else if (streamType === ETextStreamType.VBAN_TXT_ASCII) {
            textEncoding = 'ascii';
        }

        return textEncoding;
    }
}
