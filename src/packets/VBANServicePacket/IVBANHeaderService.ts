import { IVBANHeader } from '../IVBANHeader';
import { EServiceType } from './EServiceType';
import { EServiceFunction } from './EServiceFunction';

export interface IVBANHeaderService extends Omit<IVBANHeader, 'sp' | 'sr'> {
    service: EServiceType;
    /**
     * can be 0 for PING0, or 0x80 for REPLY
     */
    serviceFunction: EServiceFunction;
    isReply?: boolean;
}
