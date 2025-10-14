import { ESubProtocol } from './ESubProtocol.js';

export interface IVBANHeader {
    sr?: number;
    srIndex?: number;
    sp: ESubProtocol;
    streamName: string;
    frameCounter?: number;
}
