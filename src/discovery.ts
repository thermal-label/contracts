import { type PrinterAdapter } from './adapter.js';
import { type DeviceDescriptor, type TransportType } from './device.js';

/**
 * A printer that was discovered on one of the supported transports.
 *
 * Returned by `PrinterDiscovery.listPrinters()`. Pass the matching
 * fields (`vid`, `pid`, `serialNumber`, or `host`/`port`) into
 * `openPrinter()` to open a specific device.
 */
export interface DiscoveredPrinter {
  /** Static description of the detected model. */
  device: DeviceDescriptor;

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
}

/**
 * Interface for discovering available printers.
 *
 * Each driver implements this for its supported transports. A unified
 * CLI can aggregate implementations across all installed driver
 * packages to auto-detect printers regardless of family.
 */
export interface PrinterDiscovery {
  /** Driver family identifier — matches `DeviceDescriptor.family`. */
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
