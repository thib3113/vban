# VBAN
Implementation of the VBAN protocol in node-js ( rev 9, oct 2021 )

https://www.vb-audio.com/Voicemeeter/VBANProtocol_Specifications.pdf

## Install
```
npm i vban
```

## Examples
```typescript
// define your server, type, features, rates, a color, a name / username ... All are optionnal
const server = new VBANServer({
    application: {
        applicationName: 'VBAN Example',
        manufacturerName: 'Anonymous',
        applicationType: EServicePINGApplicationType.SERVER,
        features: [EServicePINGFeatures.AUDIO, EServicePINGFeatures.MIDI, EServicePINGFeatures.TXT, EServicePINGFeatures.SERIAL],
        bitFeatureEx: 0,
        PreferredRate: 0,
        minRate: 6000,
        maxRate: 705600,
        color: { blue: 74, green: 232, red: 57 },
        nVersion: 12345,
        GPSPosition: '',
        userPosition: '',
        langCode: 'fr-fr',
        deviceName: 'NodeJs Server',
        userName: '',
        userComment: ''
    }
});

//do something on error
server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (packet, sender) => {
    //here you can do the magic !
    //each packet is a VBAN Object parsed
    
    //We will send a text message each time we receive a packet (for example)
    //try to create a new TEXT packet
    const textPacket = new VBANTEXTPacket(
        {
            streamName: 'Command1', //the streamName waited by the other tool
            formatBit: EFormatBit.VBAN_DATATYPE_BYTE8, //the storage format, currently this is the only option available
            streamType: ETextEncoding.VBAN_TXT_UTF8 //we will send it in UTF8, most of VM Tools use UTF8
        },
        'test' // => the message we want to send (always in UTF8, if streamType is not UTF8, the library will convert)
    );

    //send it to 127.0.0.1 on port 6980
    server.send(textPacket, 6980, '127.0.0.1');
})

//listen on event when the server start listening, to log the port used
server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

//start to listen on port 7000
server.bind(7000);
```

More Examples in the [examples folder](./examples)

## Documentation

technical documentation is available [here](https://thib3113.github.io/VBAN/)

## Package Status

This package is a work in progress .

Functionalities in progress :

- [X] Convert UDP packet to objects
- [X] Convert Objects to UDP packet
- [X] Start a VBAN Server, with configuration, and auto SERVICE replies
- [ ] Implements RT-Packet Service

## Thanks to
This project is inspired by [node-VBAN](https://github.com/JMJBower/node-VBAN) from [Jacob Bower](https://github.com/JMJBower).
He does the job for audio part, and the example .

And a big thanks to [VB-Audio](https://www.facebook.com/vbaudiosoftware), for the VBAN protocol

## Donations
If you want to do a donations, please do it on the VBAN creator website : https://vb-audio.com/Services/licensing.htm
