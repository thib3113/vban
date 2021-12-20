import { IVBANHeader } from '../IVBANHeader';

export interface IVBANHeaderAudio extends IVBANHeader {
    nbSample: number;
    nbChannel: number;
    bitResolution: number;
    codec: number;
}