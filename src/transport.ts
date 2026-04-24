/**
 * A bidirectional byte channel to a printer.
 *
 * Implemented by `@thermal-label/transport` for each transport type
 * (USB, TCP, WebUSB, Web Bluetooth). Drivers program against this
 * interface and never touch platform APIs directly.
 */
export interface Transport {
  /** Send bytes to the printer. */
  write(data: Uint8Array): Promise<void>;

  /**
   * Read bytes from the printer.
   *
   * Buffers until `length` bytes are available or the timeout fires.
   *
   * BLE implementations: there is no "read N bytes" primitive in BLE.
   * Implementations must buffer incoming GATT notifications internally
   * and satisfy `read()` calls from that buffer. Document this in your
   * transport class — every BLE implementation must handle buffering
   * consistently so drivers get the same pull-based API on every
   * transport.
   *
   * @throws TransportTimeoutError on timeout.
   * @throws TransportClosedError if the transport is closed mid-read.
   */
  read(length: number, timeout?: number): Promise<Uint8Array>;

  /**
   * Close the connection.
   *
   * Always safe to call multiple times. Always `await` the result.
   */
  close(): Promise<void>;

  /** Whether the transport is currently connected. */
  readonly connected: boolean;
}
