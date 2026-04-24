/**
 * Supported transport types a driver can use to talk to a printer.
 *
 * - `usb`: raw USB via a platform USB API (e.g. `node-usb`).
 * - `tcp`: network printer on port 9100 (JetDirect) or a driver-specific port.
 * - `serial`: Node.js serial port — physical UART, USB-serial adapter, or
 *   Bluetooth SPP bound to `/dev/rfcomm0` / `COM3`.
 * - `webusb`: WebUSB in the browser.
 * - `web-serial`: Web Serial API in the browser — covers USB-serial adapters
 *   and OS-paired Bluetooth SPP devices.
 * - `web-bluetooth`: Web Bluetooth GATT in the browser. Classic Bluetooth
 *   SPP printers (e.g. Brother QL-820NWB) do NOT use this — they use
 *   `serial` / `web-serial` instead.
 */
export type TransportType = 'usb' | 'tcp' | 'serial' | 'webusb' | 'web-serial' | 'web-bluetooth';

/**
 * BLE connection parameters for a `web-bluetooth` transport.
 *
 * These values are discovered by sniffing GATT traffic from the
 * manufacturer's mobile app — use nRF Connect or LightBlue on the live
 * device. They are not typically published in printer documentation.
 */
export interface BluetoothConfig {
  /** Primary GATT service UUID for this printer family. */
  serviceUuid: string;

  /** GATT characteristic UUID for write (TX to printer). */
  txCharacteristicUuid: string;

  /**
   * GATT characteristic UUID for read/notify (RX from printer).
   * Omit if the TX characteristic also handles notifications.
   */
  rxCharacteristicUuid?: string;

  /** Device name prefix for the browser picker filter, e.g. `"QL-820"`. */
  namePrefix?: string;

  /**
   * Maximum transmission unit in bytes.
   * Default 20 (the BLE 4.0 minimum). Negotiate a larger value if the
   * peripheral supports it.
   */
  mtu?: number;
}

/**
 * Static description of a supported printer model.
 *
 * Each driver's device registry extends this with family-specific fields
 * (head geometry, cutter support, compression, etc.). Structural typing
 * means any superset is accepted wherever `DeviceDescriptor` is expected.
 */
export interface DeviceDescriptor {
  /** Human-readable model name, e.g. `"Brother QL-820NWB"`. */
  name: string;

  /**
   * USB Vendor ID. Required when `transports` includes `'usb'` or `'webusb'`.
   * Undefined for network-only printers (e.g. a LabelWriter 550 Turbo
   * accessed purely over Ethernet).
   */
  vid?: number;

  /**
   * USB Product ID. Required when `transports` includes `'usb'` or `'webusb'`.
   * Undefined for network-only printers.
   */
  pid?: number;

  /** Driver family this device belongs to, e.g. `'brother-ql'`. */
  family: string;

  /** Supported transport types for this device. */
  transports: TransportType[];

  /**
   * BLE connection parameters. Present only when `transports` includes
   * `'web-bluetooth'`.
   */
  bluetooth?: BluetoothConfig;
}
