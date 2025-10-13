//sub protocols
export enum ESubProtocol {
    // specific, not handled by VBAN
    UNKNOWN = -1,
    // 0x00
    AUDIO = 0,
    // 0x20
    SERIAL = 32,
    // 0x40
    TEXT = 64,
    // 0x60
    SERVICE = 96
}
