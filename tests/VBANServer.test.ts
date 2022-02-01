import { Buffer } from 'buffer';
import { EServiceType, ESubProtocol, MAX_FRAME_COUNTER, VBANPacket, VBANServicePacket } from '../src';
// noinspection ES6PreferShortImport
import { VBANServer } from '../src/VBANServer';

jest.resetModules();
const processPacketMock = jest.fn();
const toUDPBufferMock = jest.fn();
jest.mock('../src/VBANProtocolFactory', () => {
    return {
        VBANProtocolFactory: {
            processPacket: (...args: any) => processPacketMock(...args),
            toUDPBuffer: (...args: any) => toUDPBufferMock(...args)
        }
    };
});

jest.mock('../src/packets/VBANServicePacket/VBANServicePacket');

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

beforeEach(() => {
    jest.resetAllMocks();

    jest.mock('os', () => {
        return osMock;
    });

    jest.mock('dgram', () => {
        return {
            createSocket: createSocketMock
        };
    });

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
        it('should crash if it fail to create an udp socket', () => {
            createSocketMock.mockImplementation(() => {
                throw new Error('fake error');
            });
            expect.assertions(3);
            try {
                new VBANServer();
            } catch (e) {
                expect(createSocketMock).toHaveBeenCalledWith('udp4');
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('fail to open udp4 socket. Is dgram dependency available ?');
            }
        });
        it('should crash if it fail to get os details', () => {
            jest.resetModules();
            jest.mock('os', () => {
                throw new Error('fake error');
            });
            expect.assertions(2);
            try {
                new VBANServer();
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('fail to retrieve OS informations. Is os dependency available ?');
            }
        });
        it('should react to default events', () => {
            type fn = (...args: Array<unknown>) => void;
            let listeningFn: fn, closeFn: fn, errorFn: fn;

            [...new Array(3)].forEach(() => {
                socketMock.on.mockImplementationOnce((event: string, fn) => {
                    switch (event) {
                        case 'listening':
                            listeningFn = fn;
                            break;
                        case 'error':
                            errorFn = fn;
                            break;
                        case 'close':
                            closeFn = fn;
                    }
                });
            });

            const server = new VBANServer();

            expect(socketMock.on).toHaveBeenCalledWith('listening', expect.any(Function));
            expect(socketMock.on).toHaveBeenCalledWith('close', expect.any(Function));
            expect(socketMock.on).toHaveBeenCalledWith('error', expect.any(Function));

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
        it('should call udp.bind', () => {
            socketMock.bind.mockImplementationOnce(() => ({ bar: 'foo' }));

            const server = new VBANServer();

            expect(server.bind()).toBe(server);
            expect(socketMock.bind).toHaveBeenCalledWith();
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
        it('should send', () => {
            const server = new VBANServer();

            const packet = { subProtocol: ESubProtocol.AUDIO } as VBANPacket;
            const udpPacket = Buffer.from('foo:bar');
            toUDPBufferMock.mockImplementationOnce(() => udpPacket);

            server.send(packet, 6980, '127.0.0.1');

            expect(socketMock.send).toHaveBeenCalledWith(udpPacket, 6980, '127.0.0.1');
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
            server.send = sendMock;

            getFrameCounterMock.mockImplementationOnce(() => 126);

            server.sendPing({ address: '127.0.0.1', port: 6980 });

            expect(getFrameCounterMock).toHaveBeenCalledWith(ESubProtocol.SERVICE);

            expect(server.send).toHaveBeenCalledWith(expect.anything(), 6980, '127.0.0.1');

            const packet = (server.send as jest.Mock).mock.calls[0][0];
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
            server.emit = emitMock;
            const packet = { bar: 'foo' };
            processPacketMock.mockImplementationOnce(() => packet);

            const sender = { address: '127.0.0.1', port: 6980 };
            const udpBuffer = Buffer.from('aaaaaaaaaaa');
            // @ts-ignore
            server.messageHandler(udpBuffer, sender);

            expect(processPacketMock).toHaveBeenCalledWith(udpBuffer);
            expect(emitMock).toHaveBeenCalledWith('message', packet, sender);
        });

        describe('beforeProcessPacket', () => {
            it('should refuse', () => {
                const beforeProcessMock = jest.fn().mockReturnValue(false);
                const server = new VBANServer({
                    autoReplyToPing: false,
                    beforeProcessPacket: beforeProcessMock
                });

                const emitMock = jest.fn();
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
                    beforeProcessPacket: beforeProcessMock
                });

                const emitMock = jest.fn();
                server.emit = emitMock;
                const packet = { bar: 'foo2' };
                processPacketMock.mockImplementationOnce(() => packet);

                const sender = { address: '127.0.0.1', port: 6980 };
                const udpBuffer = Buffer.from('aaaaaaaaaaa');
                // @ts-ignore
                server.messageHandler(udpBuffer, sender);

                expect(beforeProcessMock).toHaveBeenCalledWith(udpBuffer, sender);
                expect(processPacketMock).toHaveBeenCalledWith(udpBuffer);
                expect(emitMock).toHaveBeenCalledWith('message', packet, sender);
            });
        });

        describe('autoReply', () => {
            it('should autoReply to ping', () => {
                const server = new VBANServer({
                    autoReplyToPing: true
                });

                const emitMock = jest.fn();
                server.emit = emitMock;
                // @ts-ignore
                const packet = new VBANServicePacket({});
                packet.service = EServiceType.IDENTIFICATION;
                packet.isReply = false;
                processPacketMock.mockImplementationOnce(() => packet);
                const sendPingMock = jest.fn();
                server.sendPing = sendPingMock;

                const sender = { address: '127.0.0.1', port: 6980 };
                const udpBuffer = Buffer.from('aaaaaaaaaaa');
                // @ts-ignore
                server.messageHandler(udpBuffer, sender);
                expect(processPacketMock).toHaveBeenCalledWith(udpBuffer);
                expect(emitMock).toHaveBeenCalledWith('message', packet, sender);

                expect(sendPingMock).toHaveBeenCalledWith(sender, true);
            });
        });
    });

    describe('close', () => {
        it('should call close udp', () => {
            const server = new VBANServer();

            const fn = () => true;

            server.close(fn);

            expect(socketMock.close).toHaveBeenCalledWith(fn);
        });
    });
});
