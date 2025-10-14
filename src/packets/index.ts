import { VBANAudioPacket } from './VBANAudioPacket/index.js';
import { VBANSerialPacket } from './VBANSerialPacket/index.js';
import { VBANTEXTPacket } from './VBANTXTPacket/index.js';
import { VBANServicePacket } from './VBANServicePacket/index.js';
import { VBANUnknownPacket } from './VBANUnknownPacket/index.js';

export * from './VBANAudioPacket/index.js';
export * from './VBANSerialPacket/index.js';
export * from './VBANServicePacket/index.js';
export * from './VBANTXTPacket/index.js';
export * from './VBANUnknownPacket/index.js';
export * from './ESubProtocol.js';
export * from './IVBANHeader.js';
export * from './IVBANHeaderCommon.js';
export * from './VBANPacket.js';
export * from './VBANSpecs.js';

const VBANPacketClasses = [VBANAudioPacket, VBANSerialPacket, VBANTEXTPacket, VBANServicePacket, VBANUnknownPacket] as const;

export type VBANPacketConstructorsTypes = (typeof VBANPacketClasses)[number];

export type VBANPacketTypes = InstanceType<VBANPacketConstructorsTypes>;
