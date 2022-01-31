import { IVBANHeader } from '../IVBANHeader';
import { ISerialBitMode } from './ISerialBitMode';
import { EFormatBit } from '../../commons';
import { ESerialStreamType } from './ESerialStreamType';

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
