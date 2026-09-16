import type { PrinterAdapter } from './adapter.js';
import type { DeviceEntry, TransportType } from './device.js';
import type { MediaDescriptor } from './media.js';

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
   * transport. Never parse it; for network printers use `host` /
   * `port` instead.
   */
  connectionId: string;

  /**
   * Network address the printer was discovered at. Set for
   * network-discovered printers (`transport: 'tcp'`) so callers can
   * re-open with `openPrinter({ host, port, deviceKey: device.key })`
   * without a second identification round trip.
   */
  host?: string;

  /** TCP port that goes with `host`; the registry entry's `transports.tcp.port`. */
  port?: number;
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
   * when the transport carries no model signal (serial / RFCOMM) and
   * when a network printer cannot be identified (no SNMP answer, or a
   * model the driver's registry does not list); ignored when the
   * transport enumerates (USB). When given on a network open it wins
   * over identification: the driver uses this descriptor and asks the
   * printer nothing.
   *
   * Each driver matches the key against its own registry — pass
   * `'LW_330'` to the labelwriter driver, `'QL_820NWBc'` to the Brother
   * driver, etc. Unknown keys behave like any other "no match" —
   * `openPrinter` throws.
   */
  deviceKey?: string;

  /**
   * SNMP community used to identify and read status from a network
   * printer. Default `'public'`. Only meaningful with `host`; drivers
   * pass it through to the SNMP helpers in `@thermal-label/transport`.
   */
  snmpCommunity?: string;
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

  /**
   * The driver's media registry, for callers that must let a user pick
   * media by id or name instead of relying on `getStatus().detectedMedia`
   * (a CLI `--media` flag; network printers whose media cannot be
   * detected). Optional: drivers without a media catalog omit it, and
   * callers report `driver <family> does not expose a media catalog`.
   * (Code span on purpose: typedoc emits the text raw and VitePress
   * reads a bare `<family>` as an unclosed element.)
   */
  listMedia?(): readonly MediaDescriptor[];
}

/**
 * Options for the unified driver-web `requestPrinters(opts)` factory.
 *
 * One factory per driver, dispatched on the `transport` discriminator.
 * The browser's transport-appropriate picker (`navigator.usb` /
 * `navigator.serial` / `navigator.bluetooth`) opens; the picked
 * port/device is wrapped in the matching transport class; the
 * factory tries to auto-identify which registry entry the picked
 * device corresponds to.
 *
 * **Auto-identification capability per transport:**
 *
 * | Transport          | Auto-identify via                              |
 * | ------------------ | ---------------------------------------------- |
 * | `'usb'`            | `usbDevice.vendorId`/`productId` vs registry   |
 * | `'bluetooth-gatt'` | observed service UUID vs registry              |
 * | `'serial'`         | (none in the standard Web Serial API)          |
 * | `'bluetooth-spp'`  | (none in the standard Web Serial API)          |
 *
 * If auto-identification can't decide and `deviceKey` was omitted,
 * the factory throws `DeviceIdentificationRequiredError` carrying
 * the candidate registry entries (filtered by transport) and a
 * `continueWith` closure to resume after operator confirmation.
 */
export type ConnectOptions =
  | { transport: 'usb'; deviceKey?: string }
  | { transport: 'serial'; deviceKey?: string; baudRate?: number }
  | { transport: 'bluetooth-spp'; deviceKey?: string; baudRate?: number }
  | { transport: 'bluetooth-gatt'; deviceKey?: string };
