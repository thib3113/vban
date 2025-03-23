import { IVBANHeader } from '../IVBANHeader.js';

export interface IVBANHeaderAudio extends Omit<IVBANHeader, 'sp'> {
    nbSample: number;
    nbChannel: number;
    bitResolution: number;
    codec: number;
}
