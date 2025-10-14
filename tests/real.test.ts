import { VBANPacketTypes, VBANProtocolFactory } from '../src/index.js';
import { beforeEach, describe, expect } from '@jest/globals';
import { Buffer } from 'node:buffer';
import { testsPackets } from './datas/testPackets.js';

describe.each(testsPackets)(`testing $description`, (data) => {
    let parsed: VBANPacketTypes;

    beforeEach(() => {
        parsed = VBANProtocolFactory.processPacket(Buffer.from(data.base64Packet, 'base64'));
    });

    it('should round robin', async () => {
        expect(parsed.toUDPPacket()).toStrictEqual(Buffer.from(data.base64Packet, 'base64'));
    });

    it('should be the correct packet type', async () => {
        expect(parsed).toBeInstanceOf(data.result.class);
    });
});
