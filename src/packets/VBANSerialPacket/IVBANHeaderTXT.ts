import { IVBANHeader } from '../IVBANHeader';
import { ISerialBitMode } from './ISerialBitMode';
import { EFormatBit } from '../../commons';
import { ESerialStreamType } from './ESerialStreamType';

export interface IVBANHeaderTXT extends Omit<IVBANHeader, 'sp'> {
    bitMode: ISerialBitMode;
    channelsIdents: number;
    bps: number;
    formatBit: EFormatBit;
    streamType: ESerialStreamType;
}
