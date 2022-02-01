# VBAN
[![NPM version](https://img.shields.io/npm/v/vban.svg)](https://www.npmjs.com/package/vban)
[![CI](https://github.com/thib3113/vban/actions/workflows/CI.yml/badge.svg)](https://github.com/thib3113/vban/actions/workflows/CI.yml)
[![codecov](https://codecov.io/gh/thib3113/vban/branch/main/graph/badge.svg?token=MZKEJ9F2WR)](https://codecov.io/gh/thib3113/vban)
[![Downloads](https://img.shields.io/npm/dm/vban.svg)](https://www.npmjs.com/package/vban)
[![License](https://img.shields.io/github/license/thib3113/vban.svg)](https://github.com/thib3113/vban/blob/main/LICENSE)
[![Known Vulnerabilities](https://snyk.io/test/github/thib3113/vban/badge.svg)](https://snyk.io/test/github/thib3113/vban)
[![vban](https://snyk-widget.herokuapp.com/badge/npm/vban/badge.svg)](https://snyk.io/advisor/npm-package/vban)
[![GitHub stars](https://img.shields.io/github/stars/thib3113/vban.svg?style=social&label=Star)](https://github.com/thib3113/vban/stargazers/)
[![Package Quality](https://packagequality.com/shield/vban.svg)](https://packagequality.com/#?package=vban)

[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=thib3113_vban&metric=bugs)](https://sonarcloud.io/dashboard?id=thib3113_vban)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=thib3113_vban&metric=code_smells)](https://sonarcloud.io/dashboard?id=thib3113_vban)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=thib3113_vban&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=thib3113_vban)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=thib3113_vban&metric=ncloc)](https://sonarcloud.io/dashboard?id=thib3113_vban)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=thib3113_vban&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=thib3113_vban)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=thib3113_vban&metric=alert_status)](https://sonarcloud.io/dashboard?id=thib3113_vban)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=thib3113_vban&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=thib3113_vban)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=thib3113_vban&metric=security_rating)](https://sonarcloud.io/dashboard?id=thib3113_vban)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=thib3113_vban&metric=sqale_index)](https://sonarcloud.io/dashboard?id=thib3113_vban)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=thib3113_vban&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=thib3113_vban)

![Dependencies update - renovate](https://img.shields.io/badge/renovate-enabled-green?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjUgNSAzNzAgMzcwIj48Y2lyY2xlIGN4PSIxODkiIGN5PSIxOTAiIHI9IjE4NCIgZmlsbD0iI2ZlMiIvPjxwYXRoIGZpbGw9IiM4YmIiIGQ9Ik0yNTEgMjU2bC0zOC0zOGExNyAxNyAwIDAxMC0yNGw1Ni01NmMyLTIgMi02IDAtN2wtMjAtMjFhNSA1IDAgMDAtNyAwbC0xMyAxMi05LTggMTMtMTNhMTcgMTcgMCAwMTI0IDBsMjEgMjFjNyA3IDcgMTcgMCAyNGwtNTYgNTdhNSA1IDAgMDAwIDdsMzggMzh6Ii8+PHBhdGggZmlsbD0iI2Q1MSIgZD0iTTMwMCAyODhsLTggOGMtNCA0LTExIDQtMTYgMGwtNDYtNDZjLTUtNS01LTEyIDAtMTZsOC04YzQtNCAxMS00IDE1IDBsNDcgNDdjNCA0IDQgMTEgMCAxNXoiLz48cGF0aCBmaWxsPSIjYjMwIiBkPSJNMjg1IDI1OGw3IDdjNCA0IDQgMTEgMCAxNWwtOCA4Yy00IDQtMTEgNC0xNiAwbC02LTdjNCA1IDExIDUgMTUgMGw4LTdjNC01IDQtMTIgMC0xNnoiLz48cGF0aCBmaWxsPSIjYTMwIiBkPSJNMjkxIDI2NGw4IDhjNCA0IDQgMTEgMCAxNmwtOCA3Yy00IDUtMTEgNS0xNSAwbC05LThjNSA1IDEyIDUgMTYgMGw4LThjNC00IDQtMTEgMC0xNXoiLz48cGF0aCBmaWxsPSIjZTYyIiBkPSJNMjYwIDIzM2wtNC00Yy02LTYtMTctNi0yMyAwLTcgNy03IDE3IDAgMjRsNCA0Yy00LTUtNC0xMSAwLTE2bDgtOGM0LTQgMTEtNCAxNSAweiIvPjxwYXRoIGZpbGw9IiNiNDAiIGQ9Ik0yODQgMzA0Yy00IDAtOC0xLTExLTRsLTQ3LTQ3Yy02LTYtNi0xNiAwLTIybDgtOGM2LTYgMTYtNiAyMiAwbDQ3IDQ2YzYgNyA2IDE3IDAgMjNsLTggOGMtMyAzLTcgNC0xMSA0em0tMzktNzZjLTEgMC0zIDAtNCAybC04IDdjLTIgMy0yIDcgMCA5bDQ3IDQ3YTYgNiAwIDAwOSAwbDctOGMzLTIgMy02IDAtOWwtNDYtNDZjLTItMi0zLTItNS0yeiIvPjxwYXRoIGZpbGw9IiMxY2MiIGQ9Ik0xNTIgMTEzbDE4LTE4IDE4IDE4LTE4IDE4em0xLTM1bDE4LTE4IDE4IDE4LTE4IDE4em0tOTAgODlsMTgtMTggMTggMTgtMTggMTh6bTM1LTM2bDE4LTE4IDE4IDE4LTE4IDE4eiIvPjxwYXRoIGZpbGw9IiMxZGQiIGQ9Ik0xMzQgMTMxbDE4LTE4IDE4IDE4LTE4IDE4em0tMzUgMzZsMTgtMTggMTggMTgtMTggMTh6Ii8+PHBhdGggZmlsbD0iIzJiYiIgZD0iTTExNiAxNDlsMTgtMTggMTggMTgtMTggMTh6bTU0LTU0bDE4LTE4IDE4IDE4LTE4IDE4em0tODkgOTBsMTgtMTggMTggMTgtMTggMTh6bTEzOS04NWwyMyAyM2M0IDQgNCAxMSAwIDE2TDE0MiAyNDBjLTQgNC0xMSA0LTE1IDBsLTI0LTI0Yy00LTQtNC0xMSAwLTE1bDEwMS0xMDFjNS01IDEyLTUgMTYgMHoiLz48cGF0aCBmaWxsPSIjM2VlIiBkPSJNMTM0IDk1bDE4LTE4IDE4IDE4LTE4IDE4em0tNTQgMThsMTgtMTcgMTggMTctMTggMTh6bTU1LTUzbDE4LTE4IDE4IDE4LTE4IDE4em05MyA0OGwtOC04Yy00LTUtMTEtNS0xNiAwTDEwMyAyMDFjLTQgNC00IDExIDAgMTVsOCA4Yy00LTQtNC0xMSAwLTE1bDEwMS0xMDFjNS00IDEyLTQgMTYgMHoiLz48cGF0aCBmaWxsPSIjOWVlIiBkPSJNMjcgMTMxbDE4LTE4IDE4IDE4LTE4IDE4em01NC01M2wxOC0xOCAxOCAxOC0xOCAxOHoiLz48cGF0aCBmaWxsPSIjMGFhIiBkPSJNMjMwIDExMGwxMyAxM2M0IDQgNCAxMSAwIDE2TDE0MiAyNDBjLTQgNC0xMSA0LTE1IDBsLTEzLTEzYzQgNCAxMSA0IDE1IDBsMTAxLTEwMWM1LTUgNS0xMSAwLTE2eiIvPjxwYXRoIGZpbGw9IiMxYWIiIGQ9Ik0xMzQgMjQ4Yy00IDAtOC0yLTExLTVsLTIzLTIzYTE2IDE2IDAgMDEwLTIzTDIwMSA5NmExNiAxNiAwIDAxMjIgMGwyNCAyNGM2IDYgNiAxNiAwIDIyTDE0NiAyNDNjLTMgMy03IDUtMTIgNXptNzgtMTQ3bC00IDItMTAxIDEwMWE2IDYgMCAwMDAgOWwyMyAyM2E2IDYgMCAwMDkgMGwxMDEtMTAxYTYgNiAwIDAwMC05bC0yNC0yMy00LTJ6Ii8+PC9zdmc+
)


[![NPM](https://nodei.co/npm/vban.png)](https://nodei.co/npm/vban/)

Implementation of the VBAN protocol in node.js ( rev 9, oct 2021 )

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

technical documentation is available [here](https://thib3113.github.io/vban/)

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
