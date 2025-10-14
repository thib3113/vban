import { VBANServer, VBANTEXTPacket, ETextEncoding, EFormatBit } from 'vban';

// This script sends a VBAN TEXT packet every 2 seconds
// You can run simple/receive-any.js to see the packets being received.

const VBAN_PORT = 6980;
const VBAN_IP = '127.0.0.1';

const server = new VBANServer();

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);

    // when server start, send a message

    //We will send a text message each time we receive a packet (for example)
    setInterval(() => {
        console.log('send a test message');
        //try to create a new TEXT packet
        const textPacket = new VBANTEXTPacket(
            {
                streamName: 'Command1', //the streamName waited by the other tool
                formatBit: EFormatBit.VBAN_DATATYPE_BYTE8, //the storage format, currently this is the only option available
                encoding: ETextEncoding.VBAN_TXT_UTF8 //we will send it in UTF8, most of VM Tools use UTF8
            },
            'test' // => the message we want to send (always in UTF8, if streamType is not UTF8, the library will convert)
        );

        server.send(textPacket, VBAN_PORT, VBAN_IP);
    }, 2000);
});

server.bind(7000);
