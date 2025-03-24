import { IVBANHeader } from '../IVBANHeader.js';
import { EFormatBit } from '../../commons.js';
import { ETextEncoding } from './ETextEncoding.js';

export interface IVBANHeaderTEXT extends Omit<IVBANHeader, 'sp' | 'sr'> {
    bps?: number;
    channelsIdents?: number;
    formatBit?: EFormatBit;
    encoding: ETextEncoding;
}
