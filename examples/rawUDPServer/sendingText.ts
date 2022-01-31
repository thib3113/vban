import dgram from 'dgram';
import { VBANTEXTPacket, EFormatBit, ETextEncoding } from '../../src';

const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);

    // when server start, send a message

    //We will send a text message each time we receive a packet (for example)
    //try to create a new TEXT packet
    const textPacket = new VBANTEXTPacket(
        {
            streamName: 'Command1', //the streamName waited by the other tool
            formatBit: EFormatBit.VBAN_DATATYPE_BYTE8, //the storage format, currently this is the only option available
            encoding: ETextEncoding.VBAN_TXT_UTF8 //we will send it in UTF8, most of VM Tools use UTF8
        },
        'test' // => the message we want to send (always in UTF8, if streamType is not UTF8, the library will convert)
    );

    //send it to 127.0.0.1 on port 6980
    server.send(VBANTEXTPacket.toUDPPacket(textPacket), 6980, '127.0.0.1');
});

server.bind(7000);
