import { ESubProtocol } from './ESubProtocol';

export interface IVBANHeader {
    sr: number;
    rawSampleRate: number;
    sp: ESubProtocol;
    streamName: string;
    frameCounter: number;
}
