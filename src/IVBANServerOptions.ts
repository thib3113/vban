import { EServicePINGApplicationType, EServicePINGFeatures } from './packets';

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
        color?: { blue: 74; green: 232; red: 57 };
        nVersion?: number;
        GPSPosition?: string;
        userPosition?: string;
        langCode?: string;
        deviceName?: string;
        userName?: string;
        userComment?: string;
    };
    autoReplyToPing?: boolean;
}
