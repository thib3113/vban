import { ESubProtocol } from './ESubProtocol';

export interface IVBANHeader {
    sr: number;
    srIndex?: number;
    sp: ESubProtocol;
    streamName: string;
    frameCounter?: number;
}
