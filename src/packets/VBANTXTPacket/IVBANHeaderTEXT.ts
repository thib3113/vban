import { IVBANHeader } from '../IVBANHeader';
import { EFormatBit } from '../../commons';
import { ETextEncoding } from './ETextEncoding';

export interface IVBANHeaderTEXT extends Omit<IVBANHeader, 'sp' | 'sr'> {
    bps?: number;
    channelsIdents?: number;
    formatBit?: EFormatBit;
    encoding: ETextEncoding;
}
