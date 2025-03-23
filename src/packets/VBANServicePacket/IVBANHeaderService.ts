import { IVBANHeader } from '../IVBANHeader.js';
import { EServiceType } from './EServiceType.js';
import { EServiceFunction } from './EServiceFunction.js';

export interface IVBANHeaderService extends Omit<IVBANHeader, 'sp' | 'sr'> {
    service: EServiceType;
    /**
     * can be 0 for PING0, or 0x80 for REPLY
     */
    serviceFunction: EServiceFunction;
    isReply?: boolean;
}
