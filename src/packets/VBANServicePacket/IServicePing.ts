import { EServicePINGApplicationType } from './EServicePINGApplicationType';
import { EServicePINGFeatures } from './EServicePINGFeatures';

export interface IServicePing {
    /* VBAN device type*/
    applicationType: EServicePINGApplicationType;
    /* VBAN features */
    features: Array<EServicePINGFeatures>;
    /* VBAN extra bit feature */
    bitFeatureEx: number;
    /* VBAN Preferred sample rate */
    PreferredRate: number;
    /* VBAN Min samplerate supported */
    minRate: number;
    /* VBAN Max Samplerate supported */
    maxRate: number;
    /* user color RGB(r,g,b) */
    color: { red: number; green: number; blue: number };
    /* App version 4 bytes number */
    nVersion: number;
    /* Device position */
    GPSPosition: string;
    /* Device position defined by a user process */
    userPosition: string;
    /* main language used by user */
    LangCode: string;
    /* unused : must be ZERO*/
    reservedASCII: string;
    /* unused : must be ZERO*/
    reservedEx: string;
    /* unused : must be ZERO*/
    reservedEx2: string;
    /* Device Name (physical device) */
    deviceName: string;
    /* Manufacturer Name */
    manufacturerName: string;
    /* Application Name */
    applicationName: string;
    /* unused must be zero */
    reservedLongASCII: string;
    /* User Name */
    userName: string;
    /* User Comment/ Mood/ Remark/ message */
    userComment: string;
}
