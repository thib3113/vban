import { Buffer } from 'node:buffer';

import { expect, jest } from '@jest/globals';
import { EServiceType } from '../src/packets/VBANServicePacket/EServiceType.js';
import { EServiceFunction } from '../src/packets/VBANServicePacket/EServiceFunction.js';
import { ESubProtocol } from '../src/packets/ESubProtocol.js';
import { MAX_FRAME_COUNTER } from '../src/packets/VBANSpecs.js';
import { VBANServicePacket } from '../src/packets/VBANServicePacket/VBANServicePacket.js';

jest.resetModules();
const processPacketMock = jest.fn();
const toUDPBufferMock = jest.fn();
jest.unstable_mockModule('../src/VBANProtocolFactory', () => {
    return {
        VBANProtocolFactory: {
            processPacket: (...args: Array<any>) => processPacketMock(...args),
            toUDPBuffer: (...args: Array<any>) => toUDPBufferMock(...args)
        }
    };
});

const VBANPingPacketObject = jest.fn();
const mockVBANPingPacketConstructor = jest.fn().mockReturnValue(VBANPingPacketObject);
jest.unstable_mockModule('../src/packets/VBANServicePacket/subPackets/VBANPingPacket.js', () => {
    return {
        VBANPingPacket: mockVBANPingPacketConstructor
    };
});

const socketMock = {
    on: jest.fn(),
    bind: jest.fn(),
    address: jest.fn(),
    send: jest.fn(),
    close: jest.fn()
};
const createSocketMock = jest.fn();
const osMock = {
    hostname: jest.fn()
};

jest.unstable_mockModule('node:os', () => {
    return { default: osMock };
});

jest.unstable_mockModule('node:dgram', () => {
    return {
        default: {
            createSocket: createSocketMock
        }
    };
});

const { VBANServer } = await import('../src/VBANServer.js');

const { VBANPingPacket } = await import('../src/packets/VBANServicePacket/subPackets/VBANPingPacket.js');

beforeEach(() => {
    jest.resetAllMocks();

    createSocketMock.mockImplementation(() => socketMock);
});

describe('VBANServer.test.ts', () => {
    describe('init', () => {
        it('should init and set default', () => {
            const server = new VBANServer();

            expect(createSocketMock).toHaveBeenCalled();
            expect(createSocketMock).toHaveBeenCalledWith('udp4');

            //have set autoReplyToPing by default
            // @ts-ignore
            expect(server.options.autoReplyToPing).toBe(true);

            expect(socketMock.on).toHaveBeenCalledWith('listening', expect.any(Function));
            expect(socketMock.on).toHaveBeenCalledWith('close', expect.any(Function));
            expect(socketMock.on).toHaveBeenCalledWith('error', expect.any(Function));
            expect(socketMock.on).toHaveBeenCalledWith('message', expect.any(Function));
        });
        it('should react to default events', () => {
            type fn = (...args: Array<unknown>) => void;
            let listeningFn: fn, closeFn: fn, errorFn: fn;

            [...new Array(3)].forEach(() => {
                // @ts-ignore
                socketMock.on.mockImplementationOnce((event: string, fn) => {
                    switch (event) {
                        case 'listening':
                            // @ts-ignore
                            listeningFn = fn;
                            break;
                        case 'error':
                            // @ts-ignore
                            errorFn = fn;
                            break;
                        case 'close':
                            // @ts-ignore
                            closeFn = fn;
                    }
                });
            });

            const server = new VBANServer();

            expect(socketMock.on).toHaveBeenCalledWith('listening', expect.any(Function));
            expect(socketMock.on).toHaveBeenCalledWith('close', expect.any(Function));
            expect(socketMock.on).toHaveBeenCalledWith('error', expect.any(Function));

            // @ts-ignore
            server.emit = jest.fn();

            // @ts-ignore
            if (!listeningFn || !closeFn || !errorFn) {
                throw new Error('something is wrong');
            }

            //listening
            server.isListening = false;
            const listeningArgs = ['a', 'b', 'c'];
            listeningFn(...listeningArgs);
            expect(server.isListening).toBe(true);
            // @ts-ignore
            expect(server.emit).toHaveBeenCalledWith('listening', ...listeningArgs);
            (server.emit as jest.Mock).mockReset();

            //close
            server.isListening = true;
            closeFn();
            expect(server.isListening).toBe(false);
            expect(server.emit).not.toHaveBeenCalled();
            (server.emit as jest.Mock).mockReset();

            //error
            const errorArgs = ['b', 'd', 'c'];
            errorFn(...errorArgs);
            // @ts-ignore
            expect(server.emit).toHaveBeenCalledWith('error', ...errorArgs);
            (server.emit as jest.Mock).mockReset();
        });
    });
    describe('address', () => {
        it('should return the address object from udp', () => {
            socketMock.address.mockImplementationOnce(() => ({ foo: 'bar' }));

            expect(new VBANServer().address()).toStrictEqual({ foo: 'bar' });
            expect(socketMock.address).toHaveBeenCalledWith();
        });
    });
    describe('bind', () => {
        it('should call udp.bind', async () => {
            socketMock.bind.mockImplementationOnce((...args: Array<unknown>) => {
                const last = args.pop();
                if (typeof last === 'function') {
                    last();
                }
            });

            const server = new VBANServer();

            expect(socketMock.bind).not.toHaveBeenCalled();
            await server.bind();
            expect(socketMock.bind).toHaveBeenCalled();
        });
    });
    describe('getFrameCounter', () => {
        it('should return an incrementing number for the same protocol', () => {
            const server = new VBANServer();

            // @ts-ignore
            server.frameCounter = new Map<ESubProtocol, number>();
            // @ts-ignore
            server.frameCounter.set(ESubProtocol.AUDIO, 10);
            // @ts-ignore
            expect(server.getFrameCounter(ESubProtocol.AUDIO)).toBe(11);
            // @ts-ignore
            expect(server.getFrameCounter(ESubProtocol.AUDIO)).toBe(12);
            // @ts-ignore
            expect(server.getFrameCounter(ESubProtocol.AUDIO)).toBe(13);
        });
        it('should auto init the key', () => {
            const server = new VBANServer();

            // @ts-ignore
            server.frameCounter = new Map<ESubProtocol, number>();
            // @ts-ignore
            expect(server.getFrameCounter(ESubProtocol.AUDIO)).toBe(1);
            // @ts-ignore
            expect(server.getFrameCounter(ESubProtocol.AUDIO)).toBe(2);
            // @ts-ignore
            expect(server.getFrameCounter(ESubProtocol.AUDIO)).toBe(3);
        });
        it('should reset if bigger or equal to MAX_FRAME_COUNTER', () => {
            const server = new VBANServer();

            // @ts-ignore
            server.frameCounter = new Map<ESubProtocol, number>();
            // @ts-ignore
            server.frameCounter.set(ESubProtocol.AUDIO, MAX_FRAME_COUNTER);
            // @ts-ignore
            expect(server.getFrameCounter(ESubProtocol.AUDIO)).toBe(1);
            // @ts-ignore
            expect(server.getFrameCounter(ESubProtocol.AUDIO)).toBe(2);
            // @ts-ignore
            expect(server.getFrameCounter(ESubProtocol.AUDIO)).toBe(3);
        });
    });

    describe('send', () => {
        it('should send', async () => {
            const server = new VBANServer();

            const packet = new VBANServicePacket({
                streamName: 'VBAN Service',
                service: EServiceType.CHATUTF8,
                serviceFunction: EServiceFunction.PING0,
                isReply: false
            });

            socketMock.send.mockImplementationOnce((...args) => {
                const fn = args.pop();

                if (typeof fn !== 'function') {
                    throw new Error(`unrecognized service function: ${fn}`);
                }

                fn(null);
            });
            const udpPacket = Buffer.from('foo:bar');
            toUDPBufferMock.mockImplementationOnce(() => udpPacket);

            await server.send(packet, 6980, '127.0.0.1');

            expect(socketMock.send).toHaveBeenCalledWith(udpPacket, 6980, '127.0.0.1', expect.any(Function));
        });
        it('should handle error', async () => {
            const server = new VBANServer();

            const packet = new VBANServicePacket({
                streamName: 'VBAN Service',
                service: EServiceType.CHATUTF8,
                serviceFunction: EServiceFunction.PING0,
                isReply: false
            });

            const err = new Error();

            socketMock.send.mockImplementationOnce((...args) => {
                const fn = args.pop();

                if (typeof fn !== 'function') {
                    throw new Error(`unrecognized service function: ${fn}`);
                }

                fn(err);
            });

            const udpPacket = Buffer.from('foo:bar');
            toUDPBufferMock.mockImplementationOnce(() => udpPacket);

            await expect(server.send(packet, 6980, '127.0.0.1')).rejects.toThrow(err);

            expect(socketMock.send).toHaveBeenCalledWith(udpPacket, 6980, '127.0.0.1', expect.any(Function));
        });
    });

    describe('sendPing', () => {
        it('should send ping', () => {
            const server = new VBANServer({
                application: {
                    applicationName: 'jest tests',
                    manufacturerName: 'jest'
                }
            });
            const getFrameCounterMock = jest.fn();
            const sendMock = jest.fn();
            //set frameCounter
            // @ts-ignore
            server.getFrameCounter = getFrameCounterMock;
            // @ts-ignore
            server.send = sendMock;

            getFrameCounterMock.mockImplementationOnce(() => 126);

            server.sendPing({ address: '127.0.0.1', port: 6980 });

            expect(getFrameCounterMock).toHaveBeenCalledWith(ESubProtocol.SERVICE);

            expect(server.send).toHaveBeenCalledWith(expect.anything(), 6980, '127.0.0.1');

            const packet = (server.send as jest.Mock).mock.calls[0][0];
            // @ts-ignore
            const construct = packet.constructor as jest.Mock;
            expect(construct).toHaveBeenCalledWith(
                { frameCounter: 126, isReply: false, service: 0, serviceFunction: 0, streamName: 'VBAN Service' },
                {
                    GPSPosition: '',
                    PreferredRate: 0,
                    applicationName: 'jest tests',
                    applicationType: 16777216,
                    bitFeatureEx: 0,
                    color: { blue: 0, green: 128, red: 128 },
                    deviceName: 'NodeJs Server',
                    features: [1, 768, 65536, 256],
                    langCode: 'fr-fr',
                    manufacturerName: 'jest',
                    maxRate: 705600,
                    minRate: 6000,
                    nVersion: 12345,
                    reservedASCII: '',
                    reservedEx: '',
                    reservedEx2: '',
                    reservedLongASCII: undefined,
                    userComment: '',
                    userName: '',
                    userPosition: ''
                }
            );
        });
    });

    describe('messageHandler', () => {
        it('should send a message', () => {
            const server = new VBANServer({
                autoReplyToPing: false
            });

            const emitMock = jest.fn();
            // @ts-ignore
            server.emit = emitMock;
            const packet = { bar: 'foo' };
            processPacketMock.mockImplementationOnce(() => packet);

            const sender = { address: '127.0.0.1', port: 6980 };
            const udpBuffer = Buffer.from('aaaaaaaaaaa');
            // @ts-ignore
            server.messageHandler(udpBuffer, sender);

            expect(processPacketMock).toHaveBeenCalledWith(udpBuffer);
            expect(emitMock).toHaveBeenCalledWith('message', packet, sender, udpBuffer);
        });

        describe('beforeProcessPacket', () => {
            it('should refuse', () => {
                const beforeProcessMock = jest.fn().mockReturnValue(false);
                const server = new VBANServer({
                    autoReplyToPing: false,
                    // @ts-ignore
                    beforeProcessPacket: beforeProcessMock
                });

                const emitMock = jest.fn();
                // @ts-ignore
                server.emit = emitMock;

                const sender = { address: '127.0.0.1', port: 6980 };
                const udpBuffer = Buffer.from('aaaaaaaaaaa');
                // @ts-ignore
                server.messageHandler(udpBuffer, sender);

                expect(beforeProcessMock).toHaveBeenCalledWith(udpBuffer, sender);
                expect(processPacketMock).not.toHaveBeenCalled();
                expect(emitMock).not.toHaveBeenCalled();
            });
            it('should accept', () => {
                const beforeProcessMock = jest.fn().mockReturnValue(true);
                const server = new VBANServer({
                    autoReplyToPing: false,
                    // @ts-ignore
                    beforeProcessPacket: beforeProcessMock
                });

                const emitMock = jest.fn();
                // @ts-ignore
                server.emit = emitMock;
                const packet = { bar: 'foo2' };
                processPacketMock.mockImplementationOnce(() => packet);

                const sender = { address: '127.0.0.1', port: 6980 };
                const udpBuffer = Buffer.from('aaaaaaaaaaa');
                // @ts-ignore
                server.messageHandler(udpBuffer, sender);

                expect(beforeProcessMock).toHaveBeenCalledWith(udpBuffer, sender);
                expect(processPacketMock).toHaveBeenCalledWith(udpBuffer);
                expect(emitMock).toHaveBeenCalledWith('message', packet, sender, udpBuffer);
            });
        });

        describe('autoReply', () => {
            it('should autoReply to ping', async () => {
                const server = new VBANServer({
                    autoReplyToPing: true
                });

                const emitMock = jest.fn();
                // @ts-ignore
                server.emit = emitMock;
                // @ts-ignore
                const packet = new VBANPingPacket({});
                packet.service = EServiceType.IDENTIFICATION;
                packet.isReply = false;
                processPacketMock.mockImplementationOnce(() => packet);
                const sendPingMock = jest.fn();
                // @ts-ignore
                server.sendPing = sendPingMock;

                const sender = { address: '127.0.0.1', port: 6980 };
                const udpBuffer = Buffer.from('aaaaaaaaaaa');
                // @ts-ignore
                await server.messageHandler(udpBuffer, sender);
                expect(processPacketMock).toHaveBeenCalledWith(udpBuffer);
                expect(emitMock).toHaveBeenCalledWith('message', packet, sender, udpBuffer);

                expect(sendPingMock).toHaveBeenCalledWith(sender, true);
            });
        });
    });

    describe('close', () => {
        it('should call close udp', async () => {
            socketMock.close.mockImplementationOnce((...args: Array<unknown>) => {
                const last = args.pop();
                if (typeof last === 'function') {
                    last();
                }
            });

            const server = new VBANServer();

            expect(socketMock.close).not.toHaveBeenCalled();
            await server.close();

            expect(socketMock.close).toHaveBeenCalled();
        });
    });
});
