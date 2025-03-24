import { EServicePINGApplicationType, EServicePINGFeatures } from './packets/index.js';
import { RemoteInfo } from 'dgram';

export interface IVBANServerOptions {
    application?: {
        applicationName?: string;
        manufacturerName?: string;
        applicationType?: EServicePINGApplicationType;
        features?: Array<EServicePINGFeatures>;
        bitFeatureEx?: number;
        PreferredRate?: number;
        minRate?: number;
        maxRate?: number;
        color?: { blue: number; green: number; red: number };
        nVersion?: number;
        GPSPosition?: string;
        userPosition?: string;
        langCode?: string;
        deviceName?: string;
        userName?: string;
        userComment?: string;
        hostname?: string;
    };
    /**
     * will auto send a reply when another app will send a ping
     */
    autoReplyToPing?: boolean;
    /**
     * Return false to stop processing the packet
     */
    beforeProcessPacket?: (msg: Buffer, sender: RemoteInfo) => boolean;
}
