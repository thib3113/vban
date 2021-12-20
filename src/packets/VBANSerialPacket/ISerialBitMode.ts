export interface ISerialBitMode {
    /**
     * STOP BIT
     * - 1 stop bit
     * - 1,5 stop bit.
     * - 2 stop bit.
     * - null : unused
     */
    stop: number | null;
    /**
     *  PARITY CHECKING:
     * - false : no parity checking
     * - true : parity checking.
     */
    parity: boolean;
    /**
     * Set to true if the serial data block requires several VBAN Packets (1436 BYTE max) to be
     * completed.
     */
    multipart: boolean;
    /**
     * START BIT
     * - false : no start bit
     * - true : start bit.
     */
    start: boolean;
}