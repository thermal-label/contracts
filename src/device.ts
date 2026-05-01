/**
 * Wire-protocol-only transport types.
 *
 * Distinct runtime APIs (node-usb vs WebUSB, node serialport vs Web
 * Serial, classic Bluetooth SPP vs BLE GATT) are *implementations* of
 * these transport keys, not separate keys. Per-platform packages
 * declare which transport types their implementations satisfy; the
 * registry stays wire-protocol-honest.
 *
 * The two Bluetooth keys stay split — BR/EDR vs BLE radios, SDP vs
 * advertisement discovery, classic vs BLE pairing flows, and Web
 * Bluetooth being GATT-only by spec all force the separation.
 */
export type TransportType =
  | 'usb'
  | 'tcp'
  | 'serial'
  | 'bluetooth-spp'
  | 'bluetooth-gatt';

/**
 * Verification status for a device, transport, or engine.
 *
 * - `'verified'` — known-good against a recent reporter.
 * - `'partial'` — works for some operations / paths but not all.
 * - `'broken'` — known-broken; do not promise support.
 * - `'untested'` — no accepted report yet.
 */
export type SupportStatus = 'verified' | 'partial' | 'broken' | 'untested';

/**
 * USB transport parameters.
 *
 * VID/PID stored as hex strings (e.g. `'0x0922'`) matching what every
 * datasheet, lsusb output, and forum post uses. Consumers that need
 * numbers parseInt at the boundary.
 */
export interface UsbTransport {
  /** Hex string, e.g. `'0x0922'`. */
  vid: string;
  /** Hex string, e.g. `'0x0020'`. */
  pid: string;
}

/** TCP transport parameters. */
export interface TcpTransport {
  /** TCP port (JetDirect printers use 9100). */
  port: number;
  /** mDNS service type for zero-config discovery. */
  mdns?: { serviceType: string; subtypes?: readonly string[] };
}

/**
 * Physical serial transport parameters (UART / USB-serial).
 *
 * For Bluetooth SPP printers — even though most platforms surface the
 * RFCOMM channel as a /dev/rfcomm or COM port — use the
 * `bluetooth-spp` key instead so the runtime picker can present it as
 * "Bluetooth" rather than "Serial port".
 */
export interface SerialTransport {
  defaultBaud: number;
  supportedBauds?: readonly number[];
  /** Optional flow-control hint; most label printers want 'none'. */
  flowControl?: 'none' | 'hardware' | 'software';
}

/**
 * Bluetooth SPP (Serial Port Profile, classic Bluetooth).
 *
 * Verified working on Windows and Linux via the OS-paired RFCOMM
 * device path (the runtime's serial implementation satisfies both
 * `serial` and `bluetooth-spp` transport keys). macOS still untested.
 * Baud rate is deliberately absent: SPP negotiates its own framing,
 * and the value on /dev/rfcomm0 is fictional.
 */
export interface BluetoothSppTransport {
  /** Bluetooth name prefix for OS pickers. */
  namePrefix?: string;
  /** RFCOMM channel; some printers publish via SDP, others fix it. */
  rfcommChannel?: number;
}

/**
 * Bluetooth Low Energy GATT.
 *
 * UUIDs are typically discovered by sniffing GATT traffic from the
 * manufacturer's mobile app (nRF Connect, LightBlue) — they are
 * rarely published in printer documentation.
 */
export interface BluetoothGattTransport {
  /** Primary GATT service UUID for this printer family. */
  serviceUuid: string;
  /** GATT characteristic UUID for write (TX to printer). */
  txCharacteristicUuid: string;
  /**
   * GATT characteristic UUID for read/notify (RX from printer).
   * Omit if the TX characteristic also handles notifications.
   */
  rxCharacteristicUuid?: string;
  /** Device name prefix for the browser picker filter, e.g. `'QL-820'`. */
  namePrefix?: string;
  /** Negotiable BLE MTU; default 20 (BLE 4.0 minimum). */
  mtu?: number;
}

/**
 * Per-transport schema for a device.
 *
 * Only the keys this device actually supports are present. Each key
 * carries the parameters its transport needs — VID/PID under `usb`,
 * port under `tcp`, etc. — instead of bunching them at the top level.
 */
export interface DeviceTransports {
  usb?: UsbTransport;
  tcp?: TcpTransport;
  serial?: SerialTransport;
  'bluetooth-spp'?: BluetoothSppTransport;
  'bluetooth-gatt'?: BluetoothGattTransport;
}

/**
 * Engine-level capability flags.
 *
 * Mirrors `DeviceEntry.capabilities` but for properties of the
 * printhead / sensor / cutter on this specific engine. Open shape —
 * drivers extend with family-specific keys via the index signature
 * without touching the contracts package.
 *
 * **Promotion rule:** a capability earns a named key here iff (a) it
 * is implemented by ≥2 active drivers AND (b) at least one registry
 * consumer (picker, rasterizer, docs badge, runtime UX) actually
 * branches on it. Today: `mediaDetection` and `autocut`.
 * Single-vendor (e.g. `twoColor`, `genuineMediaRequired`) lands on
 * the index signature until a second vendor adopts.
 */
export interface PrintEngineCapabilities {
  /**
   * Whether this engine reports loaded media via `getStatus()`.
   *
   * What apps do on mismatch is an app-level decision; the contracts
   * library does not block prints. See `hardwareQuirks` on entries
   * where the printer's mismatch behaviour is non-obvious (Brother
   * QL hard-rejects, Dymo 5xx silently misprints).
   */
  mediaDetection?: boolean;

  /** Auto-cutter on this engine's paper path. */
  autocut?: boolean;

  /**
   * Driver-specific capability keys land here. Examples today:
   * `twoColor` (Brother-only, two-colour ribbon path) and
   * `genuineMediaRequired` (Dymo-only). Promote to a named key when
   * a second active driver implements with compatible semantics.
   */
  [k: string]: unknown;
}

/**
 * Per-engine routing hints.
 *
 * Transport-layer routing is keyed by transport (`bind.usb`, future
 * `bind.tcp`) and consumed by the transport implementation.
 * Protocol-layer routing (`bind.address`) sits as a flat sibling and
 * is consumed by the protocol implementation — opaque to the
 * registry.
 *
 * **USB-composite example (LabelWriter Duo):** each engine binds to
 * its own USB interface via `bind.usb.bInterfaceNumber`.
 *
 * **Protocol-addressed example (LabelWriter Twin Turbo):** both
 * engines share the chassis USB endpoint and select via
 * `bind.address` — for `lw-450`, `bind.address: 1` is encoded as
 * `ESC q 0x01` prepended to the job. `'auto'` is not a stored value
 * — it is a routing mode in `PrintOptions.engine`.
 *
 * If a future protocol grows more than one in-band routing
 * dimension, promote `bind.address` to `bind.protocol: { ... }`.
 */
export interface EngineBind {
  /** USB-composite routing — engine bound to a specific USB interface. */
  usb?: { bInterfaceNumber: number };
  /** Opaque protocol-layer address; protocol module knows how to encode. */
  address?: number;
}

/**
 * A print engine — one printhead with one protocol.
 *
 * Most devices have a single engine. The LabelWriter Duo has two
 * (label + tape) with different protocols and different USB
 * interfaces. The Twin Turbo also has two (left + right) sharing one
 * transport with in-band protocol-level addressing.
 */
export interface PrintEngine {
  /**
   * Semantic role identifier — used as the lookup key on the runtime
   * adapter (`printer.engines[role]`). For single-engine devices:
   * `'primary'`. For composite devices: descriptive (`'label'`,
   * `'tape'`, `'left'`, `'right'`).
   */
  role: string;

  /** Driver-family-specific wire-protocol tag. */
  protocol: string;

  dpi: number;

  /** Native dot count across the head. */
  headDots: number;

  /**
   * Per-engine routing hints. Omit on single-engine devices.
   * See `EngineBind` for transport-layer vs protocol-layer routing.
   */
  bind?: EngineBind;

  /**
   * Filter for which entries from the driver's media registry this
   * engine accepts. Resolved against `MediaDescriptor.targetModels`.
   * Driver-defined string set; `undefined` = engine accepts every
   * media in the driver's registry.
   */
  mediaCompatibility?: readonly string[];

  /** Engine-level capability flags. See `PrintEngineCapabilities`. */
  capabilities?: PrintEngineCapabilities;
}

/**
 * A single accepted verification report against a device.
 *
 * Mirrors the fields the org-level `hardware-status.yaml` schema
 * already records — issue number, reporter, date, result. Folded
 * inline into the device entry so there is one source of truth per
 * driver instead of a parallel YAML overlay.
 */
export interface DeviceReport {
  /** Issue / PR number where the report was accepted. */
  issue: number;

  /** Reporter's GitHub handle or attribution string. */
  reporter: string;

  /** ISO date (YYYY-MM-DD) the report was filed. */
  date: string;

  /** Verification outcome from this report. */
  result: SupportStatus;

  os?: 'Linux' | 'macOS' | 'Windows';

  /** Free-form notes (markdown allowed). */
  notes?: string;

  /** True if the reporter is also the implementer / maintainer. */
  selfVerified?: boolean;
}

/**
 * Verification state for a device.
 *
 * Always present on `DeviceEntry` (defaults to `{ status: 'untested' }`)
 * so consumer types stay unconditional.
 */
export interface DeviceSupport {
  /** Worst-case status across declared transports and engines. */
  status: SupportStatus;

  /** Per-transport status, where the data records it. */
  transports?: Partial<Record<TransportType, SupportStatus>>;

  /**
   * Per-engine status — useful for the Duo's "label works, tape
   * doesn't" case. Keys must match `engines[].role`.
   */
  engines?: Record<string, SupportStatus>;

  /** ISO date of the most recent accepted report. */
  lastVerified?: string;

  /** Driver package version the most recent reports were filed against. */
  packageVersion?: string;

  /** Editorial caveats. Markdown. Changes with firmware revisions. */
  quirks?: string;

  /** Accepted verification reports backing the status above. */
  reports?: readonly DeviceReport[];
}

/**
 * A device entry in a driver's registry.
 *
 * Each driver's `data/devices.json` lists entries of this shape. The
 * driver still owns the data; contracts owns only the shape.
 */
export interface DeviceEntry {
  /** Stable key used as the registry export name (e.g. `'LW_450'`). */
  key: string;

  /** Human-readable model name, e.g. `'LabelWriter 450'`. */
  name: string;

  /** Driver family this device belongs to, e.g. `'labelwriter'`. */
  family: string;

  /** Wire-protocol transports this device exposes. */
  transports: DeviceTransports;

  /**
   * Print engines in this device. Always an array, never empty —
   * single-engine devices fabricate a `'primary'` entry. Composite
   * devices (Duo, Twin) carry one entry per independent engine.
   */
  engines: readonly PrintEngine[];

  /**
   * Chassis-level capability flags — properties of the box, not the
   * printhead. Most boolean capabilities are engine-level; this bag
   * is for genuinely chassis-y things (Brother's `editorLite`
   * USB-Mass-Storage trick, eventual battery / display flags). Open
   * shape so drivers can extend without touching contracts.
   */
  capabilities?: Readonly<Record<string, unknown>>;

  /**
   * In-source hardware quirks — immutable facts about the chassis.
   *
   * Distinct from `support.quirks`, which is editorial and changes
   * with firmware revisions. Example: "PID collides with the
   * LabelManager PnP variant; needs usb_modeswitch on Linux".
   */
  hardwareQuirks?: string;

  /** Always defined; defaults to `{ status: 'untested' }`. */
  support: DeviceSupport;
}

/**
 * A driver's full device registry.
 *
 * `schemaVersion: 1` is the initial published shape. Bump when a
 * future change is genuinely incompatible; the aggregator and
 * cross-driver consumers refuse unknown values rather than silently
 * mishandle shape divergence.
 */
export interface DeviceRegistry {
  schemaVersion: 1;
  /** Driver family identifier — matches `DeviceEntry.family`. */
  driver: string;
  devices: readonly DeviceEntry[];
}
