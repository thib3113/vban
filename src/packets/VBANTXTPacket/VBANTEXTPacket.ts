import { VBANPacket } from '../VBANPacket';
import Buffer from 'buffer';
import { ESubProtocol } from '../ESubProtocol';
import { BITS_SPEEDS, EFormatBit } from '../../commons';
import { ETextStreamType } from './ETextStreamType';
import { IVBANHeader } from '../IVBANHeader';

interface IVBANHeaderTEXT extends IVBANHeader {
    bps: number;
    channelsIdents: number;
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
        super(headers);

        this.bps = headers.bps;
        this.channelsIdents = headers.channelsIdents;
        this.formatBit = headers.formatBit;
        this.streamType = headers.streamType;

        this.text = txt;
        this.dataBuffer = dataBuffer;
    }

    public static fromUDPPacket(headersBuffer: Buffer, dataBuffer: Buffer) {
        const headers = this.prepareFromUDPPacket(headersBuffer);

        if (!BITS_SPEEDS[headers.rawSampleRate]) {
            throw new Error(`unknown bits speed ${headers.rawSampleRate}`);
        }

        const bps = BITS_SPEEDS[headers.rawSampleRate] as number;

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

        let textEncoding: BufferEncoding | null = null;
        if (streamType === ETextStreamType.VBAN_TXT_UTF8) {
            textEncoding = 'utf8';
        } else if (streamType === ETextStreamType.VBAN_TXT_WCHAR) {
            //need to test this, voicemeeter seems to doesn't use it
            textEncoding = 'utf16le';
        } else if (streamType === ETextStreamType.VBAN_TXT_ASCII) {
            textEncoding = 'ascii';
        }

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
}
