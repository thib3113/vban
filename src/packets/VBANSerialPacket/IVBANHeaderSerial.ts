import { IVBANHeader } from '../IVBANHeader.js';
import { ISerialBitMode } from './ISerialBitMode.js';
import { EFormatBit } from '../../commons.js';
import { ESerialStreamType } from './ESerialStreamType.js';

export interface IVBANHeaderSerial extends Omit<IVBANHeader, 'sp' | 'sr'> {
    /**
     * {@link VBANSerialPacket.bitMode}
     */
    bitMode: ISerialBitMode;
    /**
     * {@link VBANSerialPacket.channelsIdents}
     */
    channelsIdents: number;
    /**
     * {@link VBANSerialPacket.bps}
     */
    bps: number;
    /**
     * {@link VBANSerialPacket.formatBit}
     */
    formatBit: EFormatBit;
    /**
     * {@link VBANSerialPacket.streamType}
     */
    streamType: ESerialStreamType;
}
