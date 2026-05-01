import type { PrinterAdapter } from './adapter.js';
import type { DeviceEntry, TransportType } from './device.js';

/**
 * A printer that was discovered on one of the supported transports.
 *
 * Returned by `PrinterDiscovery.listPrinters()`. Pass the matching
 * fields (`vid`, `pid`, `serialNumber`, or `host`/`port`) into
 * `openPrinter()` to open a specific device.
 */
export interface DiscoveredPrinter {
  /** Registry entry for the detected model. */
  device: DeviceEntry;

  /** Serial number, if the transport exposes it (USB descriptor, mDNS TXT, etc.). */
  serialNumber?: string;

  /** Which transport this printer was discovered on. */
  transport: TransportType;

  /**
   * Transport-specific connection identifier. Opaque to consumers — a
   * USB device path, a TCP `host:port`, or a BLE address, depending on
   * transport.
   */
  connectionId: string;
}

/**
 * Options for `PrinterDiscovery.openPrinter()`.
 *
 * Leave empty to open the first available printer. Provide one or more
 * fields to narrow the match.
 */
export interface OpenOptions {
  /** Match by USB Vendor ID. */
  vid?: number;

  /** Match by USB Product ID. */
  pid?: number;

  /** Match by USB / mDNS serial number. */
  serialNumber?: string;

  /** TCP host (IP or hostname). */
  host?: string;

  /** TCP port. Default 9100. */
  port?: number;

  /**
   * Serial port path. Examples: `/dev/rfcomm0` (Linux, Bluetooth SPP),
   * `/dev/ttyUSB0` (Linux, USB-serial adapter), `COM3` (Windows).
   */
  serialPath?: string;

  /**
   * Serial baud rate. Default 9600. Ignored for RFCOMM / Bluetooth SPP
   * (the underlying link handles flow control) but required by the
   * serialport and Web Serial APIs.
   */
  baudRate?: number;

  /**
   * Registry key of the device descriptor to use. Required by drivers
   * when the transport carries no model signal (serial / RFCOMM); ignored
   * when the transport enumerates (USB / TCP / mDNS).
   *
   * Each driver matches the key against its own registry — pass
   * `'LW_330'` to the labelwriter driver, `'QL_820NWB'` to the Brother
   * driver, etc. Unknown keys behave like any other "no match" —
   * `openPrinter` throws.
   */
  deviceKey?: string;
}

/**
 * Interface for discovering available printers.
 *
 * Each driver implements this for its supported transports. A unified
 * CLI can aggregate implementations across all installed driver
 * packages to auto-detect printers regardless of family.
 */
export interface PrinterDiscovery {
  /** Driver family identifier — matches `DeviceEntry.family`. */
  readonly family: string;

  /** List connected printers on this driver's supported transports. */
  listPrinters(): Promise<DiscoveredPrinter[]>;

  /**
   * Open a printer matching the given options.
   *
   * If no options are provided, opens the first available printer.
   */
  openPrinter(options?: OpenOptions): Promise<PrinterAdapter>;
}
