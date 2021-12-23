import { IVBANHeader } from '../IVBANHeader';
import { EFormatBit } from '../../commons';
import { ETextStreamType } from './ETextStreamType';

export interface IVBANHeaderTEXT extends Omit<IVBANHeader, 'sp' | 'sr'> {
    bps?: number;
    channelsIdents?: number;
    formatBit: EFormatBit;
    streamType: ETextStreamType;
}