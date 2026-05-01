# contracts — Generic device & media shape

> Promote the per-driver device registries (`labelwriter` `DEVICES`,
> `labelmanager` `DEVICES`, `brother-ql` `DEVICES`) and per-driver
> media registries (`MEDIA`, `D1_CARTRIDGES`, …) onto a shared,
> typed shape that lives in `@thermal-label/contracts`. One source
> of truth that drivers, the docs build, and runtime adapters all
> read.
>
> **Scope of this plan: the shape itself.** Driver migrations, the
> per-device docs pages, and runtime UX patterns each get their own
> plan and reference this one for the contract.

---

## 1. Where we are today

The four packages each carry their own `DEVICES` and (where
applicable) `MEDIA` registries, all extending the contracts-level
`DeviceDescriptor` / `MediaDescriptor` (`contracts/src/device.ts`,
`contracts/src/media.ts`). The shapes diverge in load-bearing ways:

- `labelwriter` `LabelWriterDevice` — `headDots`, `bytesPerRow`,
  `protocol`, `network`, `nfcLock`. Slated for a `PrintEngine`
  sub-object refactor in
  `../labelwriter/plans/backlog/unify-device-registry.md` (§3) which
  also introduces an in-source `quirks` field.
- `labelmanager` `LabelManagerDevice` — `supportedTapes`,
  `experimental`. No head-dot count; rasterizer derives from
  `MEDIA.tapeWidthMm` → `bytesPerLine`.
- `brother-ql` `BrotherQLDevice` — `headPins`, `headDots`,
  `compression`, `twoColor`, `autocut`, `editorLite`,
  `massStoragePid`, …
- `niimbot` — stub today. Same shape problem will land when it grows.

Cross-driver consumers (the docs aggregator at
`thermal-label.github.io/scripts/build-hardware-page.mjs`, future
"works with my printer" lookups in apps) currently navigate this
divergence with hand-maintained allowlists.

The verification *state* lives in a parallel YAML overlay
(`docs/hardware-status.yaml` in each driver repo, schema at
`thermal-label--dot-github/CONTRIBUTING/hardware-status-schema.md`),
merged in by the aggregator at docs-build time. The runtime has no
access to it. This plan folds the overlay into the per-driver JSON
device registry (one file, one source of truth) — the schema fields
survive, the file format and merge step go away.

The user-facing problem is schema sprawl: every new device feature
(twin-roll, NFC, second printhead, two-colour ink, BLE) gets bolted
onto its driver's descriptor in isolation. Cross-driver patterns
(capabilities, multi-engine devices, network presence) get
re-invented per family. This plan settles the shared structural
shape; downstream consumer benefits (per-device docs, runtime
support-state surfacing) ride on top in their own plans.

---

## 2. Goals & non-goals

**Goals**
- One typed, declarative shape per device — covering hardware specs
  (engines, transports, capabilities), media compatibility (which
  registry rows it accepts, with `targetModels` filtering), and
  support state (verification status). Lives in
  `@thermal-label/contracts`; each driver imports it and its
  driver-specific `DEVICES` extends it.
- One typed, declarative shape per media entry — the fields the
  per-driver registries already share (`id`, `name`, dimensions,
  category) plus SKU + `targetModels` metadata.
- A file-format decision: each driver's registry ships as
  `data/devices.json` (JSON5 source-of-truth, compiled to plain
  JSON for the runtime artifact), with verification reports inline.
  Replaces the per-driver `docs/hardware-status.yaml` overlay.
- Pure helpers for the device ↔ media compatibility graph, exported
  from contracts, used by drivers and docs alike.

**Non-goals**
- The per-device documentation page. Lives in
  `../thermal-label.github.io/plans/backlog/per-device-pages.md`.
- The runtime support-state UX (verification prompts, mismatch
  modals, feature-state chips). Deferred to a separate UX plan.
- Replacing the *content* of `hardware-status.yaml` (the
  verification ledger — issue numbers, reporters, dates). The
  fields all survive intact. What this plan changes is the
  *file format* (YAML→JSON) and the *file location* (folded into
  `data/devices.json` per driver, alongside the device entry it
  describes).
- A runtime mismatch policy. The contracts shape declares whether
  an engine reports loaded media (`mediaDetection: boolean`); what
  apps do on mismatch is an app-level decision. **Rails, not walls
  — contracts describe the printer, apps decide the UX.**
- Cross-driver media unification. Each driver still owns its own
  media registry. The shared bits are the *shape* of an entry and
  the *categories* (die-cut / continuous / cartridge / tape).
- Affiliate / retailer links on media entries. Tracked separately in
  `media-purchase-links.md`.
- A schema validator at the contracts level. TypeScript catches
  shape; the per-driver validators (`validate-hardware-status.mjs`)
  still own the data side.

---

## 3. The shape

Each driver ships its `DEVICES` registry as a JSON file
(`packages/core/data/devices.json`), imported via TS native JSON
modules and `satisfies`-checked against the contracts shape. JSON
over the existing YAML overlay because:

- TS native `import data from './devices.json' with { type: 'json' }`
  removes the `yaml` parser dependency.
- The runtime `support` data this plan folds inline is JSON anyway;
  uniform format across the three consumers (driver runtime, docs
  aggregator, validator).
- Comments — the one real loss versus YAML — are recovered by
  allowing JSON5 for the source-of-truth file (compiled to plain
  JSON at build time for the runtime artifact).

This collapses the current two-file setup (`devices.ts` + `docs/
hardware-status.yaml`) into a single `devices.json` per driver, with
the verification reports moving inline. The org-level
`hardware-status-schema.md` stays the canonical reference but
documents JSON instead of YAML.

> Driver libraries still **own** their device entries — the
> `@thermal-label/labelwriter-core` package owns its
> `data/devices.json` with all LabelWriter models, the
> `@thermal-label/brother-core` package owns Brother models, etc.
> The contracts package owns only the *shape*. The docs aggregator
> imports each driver's JSON via npm; nothing here pulls device
> data out of the driver repos.

### 3.1 `device.ts` — the device entry shape

The principle, applied throughout: **fields that are only meaningful
in the context of one transport, one engine, or one feed source
live inside that thing's block, not at the top level**. Avoids the
"junk drawer" descriptor where `vid` is meaningful for some entries,
`port` for others, `baud` for others, with no structural enforcement.

Key shape decisions:

1. **`transports` is a keyed object, not a string array.** Each
   transport key (`usb`, `tcp`, `serial`, `bluetooth-spp`,
   `bluetooth-gatt`) carries its own schema with the fields that
   transport actually needs. No more `vid`/`pid` at the top level.
2. **The `TransportType` set is wire-protocol-only.** The current
   `usb` / `webusb` / `web-serial` / `web-bluetooth` distinctions
   were runtime-API distinctions; the registry doesn't care about
   them. Runtimes declare which transports their implementations
   satisfy (§3.4).
3. **`engines` is always an array.** Single-engine devices have one
   entry; the LabelWriter Duo has two. Never `engine` + optional
   `secondaryEngine` — keeping engines uniformly array-shaped
   avoids the special-case in every consumer.
4. **Engines carry a `bind` block for routing hints.** Per-engine
   routing — both transport-layer and protocol-layer — lives under
   `engines[].bind`. Transport keys (`bind.usb`, future
   `bind.tcp`) carry transport-specific fields; protocol-layer
   routing (`bind.address`) sits as a flat sibling consumed by the
   protocol implementation. Keeps the engine top-level shape flat
   and gives one place to look for "how is this engine addressed."
5. **Composite devices use `engines[]` regardless of how the
   engines are addressed.** Two patterns:
   - **USB-layer addressing** — the LabelWriter Duo exposes each
     engine on its own USB interface; the engine entry carries
     `bind.usb.bInterfaceNumber`.
   - **Protocol-layer addressing** — the LabelWriter Twin Turbo is
     two complete LW 450s in one chassis sharing a single USB
     endpoint; engine selection is in-band via `ESC q [0|1]`. The
     engine entry carries an opaque `bind.address: number` that the
     protocol implementation knows how to encode. `'auto'` is
     **not** a stored address — it's a routing-time concern (§3.3).

   Both Duo and Twin are *two independent print engines*. They have
   independent heads, motors, sensors, NFC readers (where present),
   paper paths, and status. Modelling Twin as one engine with two
   feed sources would squash per-engine status (which roll is out
   of paper? which NFC reader rejected the media?) into a single
   object that lies about the hardware.
6. **Capabilities live where they belong.** Most boolean
   capability flags are engine properties, not chassis properties:
   they describe the printhead, paper path, sensor, or cutter on
   *that* engine. They live in `engine.capabilities`, mirroring
   the device-level `capabilities` block — same "open bag with
   index signature" pattern. Genuinely chassis-level capabilities
   (Brother's `editorLite` USB-Mass-Storage trick, eventual
   battery/display flags) stay in `DeviceEntry.capabilities`. The
   previous `network: 'wifi' | 'wired' | 'none'` field is gone —
   it was a derivation from "is a `tcp` transport present".

   **Rule for what gets named in contracts:** a capability earns
   a named key in contracts iff *both* (a) it is implemented by
   ≥2 active drivers, AND (b) at least one registry consumer
   (picker, rasterizer, docs badge, runtime UX) actually branches
   on it. Single-vendor capabilities go driver-side via the open
   `[k: string]: unknown` index signature, even if the *concept*
   could plausibly generalize — promote when a second vendor
   actually ships the same capability with compatible semantics.
   Cross-vendor with no consumer (e.g. wire-format compression —
   both Dymo and Brother do RLE, but no consumer branches; the
   protocol module decides inside `encode()`) stays
   protocol-internal. When a single-vendor capability does land
   driver-side, name it for the *concept* rather than the
   implementation (`genuineMediaRequired`, not `nfcLock`) so a
   second-vendor adopter with a different mechanism (cassette
   ID, RFID) can land on the same key when we promote.

   By this rule today: `mediaDetection` (Brother + Dymo 5xx +
   LM + likely Niimbot) and `autocut` (Brother QL/PT + LW 4xx/550
   + LM) are named in contracts; `twoColor` (Brother-only) and
   `genuineMediaRequired` (Dymo-only) are driver-side until a
   second vendor lands.
7. **`mediaDetection` is a boolean.** "Does this engine report
   loaded media via `getStatus()`?" — yes/no. What the printer does
   on host/printer mismatch (Brother QL hard-rejects, Dymo 5xx
   silently misprints at NFC dimensions) is honest information but
   it's prose for `hardwareQuirks`, not a contracts-level
   enforcement tier. The contracts library does not refuse prints;
   apps decide whether to confirm, warn, or send.

```ts
export type SupportStatus = 'verified' | 'partial' | 'broken' | 'untested';

export type TransportType =
  | 'usb' | 'tcp' | 'serial' | 'bluetooth-spp' | 'bluetooth-gatt';

export interface UsbTransport {
  /** Hex string, e.g. '0x0922'. The validator parses; consumers parseInt. */
  vid: string;
  pid: string;
}

export interface TcpTransport {
  port: number;
  /** mDNS service type for zero-config discovery. */
  mdns?: { serviceType: string; subtypes?: readonly string[] };
}

export interface SerialTransport {
  defaultBaud: number;
  supportedBauds?: readonly number[];
  /** Optional flow-control hint; most label printers want 'none'. */
  flowControl?: 'none' | 'hardware' | 'software';
}

/**
 * Bluetooth SPP (Serial Port Profile, classic Bluetooth).
 *
 * Verified working on Windows and Linux via the OS-paired
 * RFCOMM device path (the runtime's serial implementation
 * satisfies both `serial` and `bluetooth-spp` transport keys).
 * macOS still untested. Baud rate is deliberately absent: SPP
 * negotiates its own framing, and the value on /dev/rfcomm0 is
 * fictional.
 */
export interface BluetoothSppTransport {
  /** Bluetooth name prefix for OS pickers. */
  namePrefix?: string;
  /** RFCOMM channel; some printers publish via SDP, others fix it. */
  rfcommChannel?: number;
}

export interface BluetoothGattTransport {
  serviceUuid: string;
  txCharacteristicUuid: string;
  rxCharacteristicUuid?: string;
  namePrefix?: string;
  /** Negotiable BLE MTU; default 20 (BLE 4.0 minimum). */
  mtu?: number;
}

export interface DeviceTransports {
  usb?: UsbTransport;
  tcp?: TcpTransport;
  serial?: SerialTransport;
  'bluetooth-spp'?: BluetoothSppTransport;
  'bluetooth-gatt'?: BluetoothGattTransport;
}

/**
 * A print engine — one printhead with one protocol.
 *
 * Most devices have a single engine. The LabelWriter Duo has two
 * (label + tape) with different protocols and different USB
 * interfaces. The Twin Turbo also has two (left + right) sharing
 * one transport with in-band protocol-level addressing.
 */
export interface PrintEngine {
  /**
   * Semantic role identifier — used as the lookup key on the
   * runtime adapter (`printer.engines[role]`). For single-engine
   * devices: `'primary'`. For composite devices: descriptive
   * (`'label'`, `'tape'`, `'left'`, `'right'`).
   */
  role: string;
  /** Driver-family-specific wire-protocol tag. */
  protocol: string;
  dpi: number;
  /** Native dot count across the head. */
  headDots: number;

  /**
   * Per-engine routing hints. Transport-layer routing is keyed by
   * transport (`bind.usb`, future `bind.tcp`) and consumed by the
   * transport implementation. Protocol-layer routing
   * (`bind.address`) sits as a flat sibling and is consumed by the
   * protocol implementation — opaque to the registry. Omit on
   * single-engine devices.
   *
   * USB-composite example (LabelWriter Duo): each engine binds to
   * its own USB interface via `bind.usb.bInterfaceNumber`.
   *
   * Protocol-addressed example (LabelWriter Twin Turbo): both
   * engines share the chassis USB endpoint and select via
   * `bind.address` — for `lw-450`, `bind.address: 1` is encoded as
   * `ESC q 0x01` prepended to the job. `'auto'` is not a stored
   * value — it's a routing mode in print options.
   *
   * If a future protocol grows more than one in-band routing
   * dimension, promote `bind.address` to `bind.protocol: {...}`.
   */
  bind?: {
    usb?: { bInterfaceNumber: number };
    /** Future: per-transport routing for non-USB composites. */
    address?: number;
  };

  /**
   * Filter for which entries from the driver's media registry this
   * engine accepts. Resolved against
   * `LabelWriterMedia.targetModels`, `D1Cartridge.targetModels`,
   * etc. Driver-defined string set.
   */
  mediaCompatibility?: readonly string[];

  /**
   * Engine-level capability flags. Mirrors `DeviceEntry.capabilities`
   * but for properties of the printhead / sensor / cutter on this
   * specific engine. Open shape — drivers extend with family-specific
   * keys (Brother's `compression`, etc.) without touching the
   * contracts package.
   */
  capabilities?: {
    /**
     * Whether this engine reports loaded media via `getStatus()`.
     * What apps do on mismatch is an app-level decision; the
     * contracts library does not block prints. See
     * `hardwareQuirks` on entries where the printer's mismatch
     * behavior is non-obvious (Brother QL error code vs Dymo 5xx
     * silent misprint).
     */
    mediaDetection?: boolean;
    /** Auto-cutter on this engine's paper path. */
    autocut?: boolean;
    /**
     * Driver-specific keys land here via the index signature.
     * Today: `twoColor` (Brother-only, two-colour ribbon path)
     * and `genuineMediaRequired` (Dymo-only, refuses non-genuine
     * media — name is concept-shaped so a second vendor can
     * adopt without rename). Promote to a named key when a
     * second active driver implements with compatible semantics.
     */
    [k: string]: unknown;
  };
}

export interface DeviceSupport {
  /** Worst-case status across declared transports and engines. */
  status: SupportStatus;
  /** Per-transport status, where the data records it. */
  transports?: Partial<Record<TransportType, SupportStatus>>;
  /** Per-engine status — useful for the Duo's "label works, tape doesn't" case. */
  engines?: Record<string, SupportStatus>;
  /** ISO date of the most recent accepted report. */
  lastVerified?: string;
  packageVersion?: string;
  /** Editorial caveats. Markdown. */
  quirks?: string;
  reports?: readonly DeviceReport[];
}

export interface DeviceReport {
  issue: number;
  reporter: string;
  date: string;
  result: SupportStatus;
  os?: 'Linux' | 'macOS' | 'Windows';
  notes?: string;
  selfVerified?: boolean;
}

export interface DeviceEntry {
  /** Stable key used as the registry export name. */
  key: string;
  name: string;
  family: string;

  transports: DeviceTransports;
  engines: readonly PrintEngine[];

  /**
   * Chassis-level capability flags — properties of the box, not
   * the printhead. Most boolean capabilities are engine-level
   * (`engine.capabilities` carries `autocut`, `mediaDetection`,
   * plus driver-side keys like `twoColor` / `genuineMediaRequired`
   * via the index signature); this bag is for genuinely chassis-y
   * things: Brother's `editorLite` (USB-Mass-Storage trick on the
   * USB controller), eventual battery/display flags, etc. Open
   * shape so drivers can extend without touching contracts.
   */
  capabilities?: {
    [k: string]: unknown;
  };

  /**
   * In-source hardware quirks — immutable facts. Distinct from
   * `support.quirks`, which is editorial and changes with firmware
   * revisions. Example: "PID collides with the LabelManager PnP
   * variant; needs usb_modeswitch on Linux".
   */
  hardwareQuirks?: string;

  /** Always defined; defaults to `{ status: 'untested' }`. */
  support: DeviceSupport;
}

export interface DeviceRegistry {
  schemaVersion: 1;
  driver: string;
  devices: readonly DeviceEntry[];
}
```

### 3.2 `media.ts` — generic catalogue fields

```ts
export interface MediaDescriptor {
  // ... existing fields (id, name, widthMm, heightMm, type, palette,
  //                     defaultOrientation, printMargins, cornerRadiusMm)

  /**
   * Vendor SKUs for this media — e.g. Dymo '30321' / 'S0722400',
   * Brother 'DK-22251'. Mixed formats allowed; the registry does no
   * validation. Used by docs (per-device "supported media" table)
   * and by UI consumers that let users search by SKU.
   */
  skus?: readonly string[];

  /**
   * Coarse category for grouping in docs and UI. Driver-extensible;
   * common values listed for cross-driver consistency.
   */
  category?:
    | 'address' | 'shipping' | 'file-folder' | 'multi-purpose'
    | 'name-badge' | 'barcode' | 'price-tag' | 'continuous'
    | 'cartridge' | 'tape' | 'die-cut';

  /**
   * Devices this media is compatible with. Driver-defined string set;
   * matched against `PrintEngine.mediaCompatibility`. Examples:
   * `['standard']` (paper roll fits 672-dot heads),
   * `['4xl', '5xl']` (wide-head only), `['duo']` (D1 cartridges).
   * Omit = fits every device in the family.
   */
  targetModels?: readonly string[];
}
```

### 3.3 Print API — one method, engine as parameter

This belongs in contracts because the `PrintOptions.engine` shape is
how the runtime adapter API meets the registry. Engine selection is
just another routing choice, same shape as `density` or `copies`:

```ts
interface PrintOptions {
  density?: ...;
  copies?: ...;
  /**
   * Engine to route to on multi-engine devices. Role name from
   * `printer.engines` (e.g. 'left', 'right', 'label', 'tape') or
   * 'auto' to defer to firmware (where the protocol supports it).
   *
   * Default:
   * - Single-engine device — ignored.
   * - Multi-engine, protocol supports auto — defaults to 'auto'.
   * - Multi-engine, protocol does not (Duo) — required; throws
   *   EngineRequiredError when omitted.
   */
  engine?: string;
}
```

`'auto'` is a routing mode the protocol module interprets — it
emits whatever firmware-auto byte the protocol defines (`lw-450`:
`ESC q 0xFF` or whichever value DYMO publishes). The registry
does not carry an `autoRoute` flag — the capability is implicit in
whether the protocol module exposes an auto address sentinel.

`printer.engines` is a descriptor + state surface, not an action
surface — engine descriptors carry queries (`getStatus()`,
`mediaCompatibility`, `drivable`) but not `print()`. Operations
live on the printer; queries live on the engine descriptor. This
keeps single- vs multi-engine code shape uniform.

### 3.4 Worked examples — three shapes that need to fit

**Single-engine, USB-only — LabelWriter 450:**

```json
{
  "key": "LW_450",
  "name": "LabelWriter 450",
  "family": "labelwriter",
  "transports": {
    "usb": { "vid": "0x0922", "pid": "0x0020" }
  },
  "engines": [
    {
      "role": "primary",
      "protocol": "lw-450",
      "dpi": 300,
      "headDots": 672,
      "mediaCompatibility": ["standard"]
    }
  ],
  "support": { "status": "untested" }
}
```

(Dymo 4xx-era heads have no NFC reader. The Dymo-side
`genuineMediaRequired` flag is driver-side via the index signature
on later models; on 4xx it's simply absent.)

**Two identical engines on shared transport — LabelWriter 450 Twin Turbo:**

Two complete LW 450 engines glued into one chassis, sharing one USB
endpoint. Each engine has its own head, motor, sensor, paper path,
and status; the only shared resources are the chassis, the power
supply, and the USB connection. Engine selection happens *in-band*
via `ESC q [0|1]` rather than via separate USB interfaces. The
schema captures this with `bind.address` instead of
`bind.usb.bInterfaceNumber`; the engines otherwise look identical
to the Duo case.

```json
{
  "key": "LW_450_TWIN_TURBO",
  "name": "LabelWriter 450 Twin Turbo",
  "family": "labelwriter",
  "transports": {
    "usb": { "vid": "0x0922", "pid": "0x0021" }
  },
  "engines": [
    {
      "role": "left",
      "protocol": "lw-450",
      "dpi": 300,
      "headDots": 672,
      "bind": { "address": 0 },
      "mediaCompatibility": ["standard"]
    },
    {
      "role": "right",
      "protocol": "lw-450",
      "dpi": 300,
      "headDots": 672,
      "bind": { "address": 1 },
      "mediaCompatibility": ["standard"]
    }
  ],
  "hardwareQuirks": "Two independent LabelWriter 450 print engines in one chassis sharing a USB endpoint. Each engine has its own head, motor, sensor, and paper path. Engine addressing is in-band via `ESC q`; the host cannot combine engines for wider paper. Note: Dymo did not produce a 550 Twin Turbo — the Twin range stops in the 4xx generation, so no Twin device has NFC roll authentication.",
  "support": {
    "status": "untested",
    "engines": { "left": "untested", "right": "untested" }
  }
}
```

**Two heterogeneous engines on one chassis — LabelWriter 450 Duo:**

Genuinely two printheads, two protocols, two USB interfaces.
`engines[]` carries both; each one's `bind.usb.bInterfaceNumber`
routes it to the right USB interface. The `role` strings are
descriptive (`label`, `tape`) and become the lookup keys on the
runtime adapter.

```json
{
  "key": "LW_450_DUO",
  "name": "LabelWriter 450 Duo",
  "family": "labelwriter",
  "transports": {
    "usb": { "vid": "0x0922", "pid": "0x0023" }
  },
  "engines": [
    {
      "role": "label",
      "protocol": "lw-450",
      "dpi": 300,
      "headDots": 672,
      "bind": { "usb": { "bInterfaceNumber": 0 } },
      "mediaCompatibility": ["standard"]
    },
    {
      "role": "tape",
      "protocol": "d1-tape",
      "dpi": 180,
      "headDots": 128,
      "bind": { "usb": { "bInterfaceNumber": 1 } },
      "mediaCompatibility": ["d1"],
      "capabilities": { "autocut": true }
    }
  ],
  "hardwareQuirks": "Composite USB device: enumerates as two interfaces. The label side (interface 0) speaks the 450 protocol; the tape side (interface 1) speaks the D1 cartridge dialect.",
  "support": {
    "status": "partial",
    "engines": { "label": "verified", "tape": "untested" },
    "transports": { "usb": "partial" }
  }
}
```

**Multi-transport, network + Bluetooth-SPP — Brother QL-820NWB:**

```json
{
  "key": "QL_820NWB",
  "name": "Brother QL-820NWB",
  "family": "brother",
  "transports": {
    "usb": { "vid": "0x04f9", "pid": "0x209d" },
    "tcp": {
      "port": 9100,
      "mdns": { "serviceType": "_pdl-datastream._tcp" }
    },
    "bluetooth-spp": {
      "namePrefix": "QL-820"
    }
  },
  "engines": [
    {
      "role": "primary",
      "protocol": "ql-raster",
      "dpi": 300,
      "headDots": 720,
      "capabilities": { "mediaDetection": true, "autocut": true, "twoColor": true }
    }
  ],
  "support": { "status": "untested" }
}
```

The SPP block is deliberately sparse: `namePrefix` for the OS
picker, no `baud` (meaningless at SPP layer), no `rfcommChannel`
unless we verify Brother publishes one.

`twoColor` is shown here on `engine.capabilities` but it is *not*
a named contracts key — it lands via the open `[k: string]: unknown`
index signature. Brother-only today; the contracts-level structural
fields are `mediaDetection` and `autocut`.

### 3.5 Runtime resolution — what does an app see?

Three pieces of the picture:

1. **What devices exist** — `devices.json` declares them.
2. **What protocols can be driven** — the driver's TS code registers
   protocol implementations:
   ```ts
   // packages/core/src/protocols.ts
   export const PROTOCOLS = {
     'lw-450': { encode: encodeLw450, parseStatus: parseStatus450 },
     'lw-550': { encode: encodeLw550, parseStatus: parseStatus550 },
     // 'd1-tape': not implemented yet
   } as const;
   ```
3. **What transports the runtime can use** — the per-platform
   package declares which transport types it satisfies:
   ```ts
   // node package
   export const TRANSPORT_IMPLS = {
     usb:              nodeUsbImpl,
     tcp:              nodeNetImpl,
     serial:           nodeSerialImpl,
     'bluetooth-spp':  nodeSerialImpl,  // shared module — see below
   };

   // web package
   export const TRANSPORT_IMPLS = {
     usb:              webUsbImpl,
     serial:           webSerialImpl,
     'bluetooth-gatt': webBluetoothImpl,
   };
   ```

   One implementation can satisfy multiple transport keys when the
   byte stream is shared. `nodeSerialImpl` handles `serial` (read
   path/baud from the entry) and `bluetooth-spp` (read namePrefix,
   trigger OS pairing flow, then open the resulting RFCOMM device).
   The schemas differ; the implementation dispatches on which key
   it's invoked with.

Resolution is the intersection:

```ts
function resolveSupportedDevices(
  registry: DeviceRegistry,
  protocols: ReadonlySet<string>,
  transports: ReadonlySet<TransportType>,
): SupportedDevice[] {
  return registry.devices.flatMap(dev => {
    const declaredTransports = Object.keys(dev.transports) as TransportType[];
    const drivableTransports   = declaredTransports.filter(t =>  transports.has(t));
    const undrivableTransports = declaredTransports.filter(t => !transports.has(t));
    if (drivableTransports.length === 0) return [];

    const engines = dev.engines.map(e => ({
      ...e,
      drivable: protocols.has(e.protocol),
    }));
    if (!engines.some(e => e.drivable)) return [];

    return [{
      ...dev,
      engines,
      drivableTransports,
      undrivableTransports,
      /**
       * True iff every engine on this device has a registered protocol
       * impl. Property of `(device, PROTOCOLS)` only — not affected by
       * which transports the host runtime exposes. Use
       * `undrivableTransports` separately to surface per-transport gaps
       * ("via USB only — Bluetooth requires the web package").
       */
      allEnginesDrivable: engines.every(e => e.drivable),
    }];
  });
}
```

Two dimensions, deliberately kept separate:

- **Engine coverage** is a property of `(device, PROTOCOLS)` — stable
  per package version. Drives the "is this device supported by this
  driver" verdict (`allEnginesDrivable`).
- **Transport coverage** is a property of `(device, TRANSPORT_IMPLS)` —
  varies by host runtime. Surfaced as `drivableTransports` /
  `undrivableTransports`; consumers compose their own UI from the
  arrays. A device with usb+tcp+bluetooth-spp on a Node host without
  SPP is *fully supported* in every sense the user cares about — the
  missing SPP is a per-transport hint, not a device-level demotion.

An earlier draft folded both into a single `fullySupported` boolean
(`allEnginesDrivable && every declared transport drivable`). Dropped:
the transport half produced false negatives in exactly the common
case (multi-transport printer, single-runtime host) and pickers had
to override it.

Two consequences:

- **WebUSB filters fall out automatically.** The web package's
  `usbFilters()` reads the supported set, picks entries with a `usb`
  transport, returns `{ vendorId, productId }` pairs. No
  hand-maintained list.
- **Adding a device that uses an existing protocol = JSON-only
  change.** The driver's TS code doesn't move.
- **Adding a device that needs a new protocol** = JSON entry **plus**
  a new implementation in `PROTOCOLS`. Until the impl ships, the
  entry sits in the registry as "registered, no driver yet" — useful
  for surfacing pending support on the docs page without pretending
  the device works.

For the Duo with only `lw-450` implemented:

```ts
const supported = resolveSupportedDevices(
  DEVICES,
  new Set(['lw-450', 'lw-550']),
  new Set(['usb']),
);
// Duo entry returned with:
//   engines: [
//     { role: 'label', drivable: true,  ... },
//     { role: 'tape',  drivable: false, ... },
//   ]
//   allEnginesDrivable: false
```

The adapter constructs handles only for drivable engines:

```ts
const printer = await openPrinter({ pid: 0x0023 });
printer.engines.label              // EngineDescriptor — defined
printer.engines.tape               // undefined — no impl yet
await printer.print(addressLabel, MEDIA.ADDRESS_STANDARD, { engine: 'label' });
await printer.print(...,           { engine: 'tape' });   // throws — no impl
```

For composite devices the adapter constructor walks `engines[]` and
builds one descriptor per drivable engine. The transport object
passed in is shared; what differs per descriptor is whether it's
bound to a USB sub-interface (Duo) or carries an in-band address
hint (Twin):

```ts
function buildEngineDescriptors(device, sharedTransport) {
  return device.engines.reduce((acc, engine) => {
    const protocol = PROTOCOLS[engine.protocol];
    if (!protocol) return acc;                  // no impl, skip
    const transport = engine.bind?.usb
      ? sharedTransport.openInterface(engine.bind.usb.bInterfaceNumber)
      : sharedTransport;
    acc[engine.role] = createEngineDescriptor({
      ...engine,
      drivable: true,
      protocolImpl: protocol,
      transport,
      // bind.address consumed by the adapter's print() at routing time
    });
    return acc;
  }, {} as Record<string, EngineDescriptor>);
}

// Adapter.print() routes to the right engine descriptor:
async print(image, media, options = {}) {
  const role = resolveEngine(this.engines, this.protocolCaps, options.engine);
  const eng = this.engines[role];
  await eng.protocolImpl.encode(eng.transport, image, media, {
    address: options.engine === 'auto' ? 'auto' : eng.bind?.address,
    ...options,
  });
}
```

One function for descriptor construction, three device classes
(single, USB-composite, in-band composite). One `print()` for all
of them. The shape carries the difference; the code stays uniform.

### 3.6 Compatibility graph helpers

The compatibility graph between devices and media is the same data
serving docs, frontend pickers, and runtime mismatch handling. The
graph itself is symmetric matchstring sets:

```ts
PrintEngine.mediaCompatibility?: ['standard']    // engine accepts this class
MediaDescriptor.targetModels?:    ['standard']    // media fits this class
// Compatible iff intersection is non-empty (or both omit).
```

Helpers exported from contracts:

```ts
// Set intersection over targetModels ∩ mediaCompatibility.
mediaCompatibleWith(media: MediaDescriptor, engine: EngineDescriptor): boolean;

// Filtered media list for pickers and docs.
compatibleMediaFor(engine: EngineDescriptor, registry: MediaRegistry): MediaDescriptor[];

// Identity equality — id match for known media, dimension match as fallback.
mediaIdentitiesMatch(a: MediaDescriptor, b: MediaDescriptor): boolean;
```

Pure functions over the registry and engine descriptor; no I/O, no
runtime state, trivially testable. Apps use these to filter pickers
and compare detected vs selected media — what they *do* with the
comparison (silent, confirm, refuse-to-print) is an app-level call.

> A `compareDetectedToSelected` helper that dictated `'override-blocked'`
> appeared in an earlier draft. It is intentionally absent: contracts
> describes the printer (`mediaDetection: boolean` + `hardwareQuirks`
> prose), apps decide the policy. Rails, not walls.

---

## 4. File format & schema versioning

**Source-of-truth:** `packages/core/data/devices/<KEY>.json5` —
one file per device, JSON5 to preserve comments (important when an
entry encodes a non-obvious quirk that needs a `// see issue #42`
pointer). The per-device split keeps PR blast radius proportional
to the change: a new device is one new file, a verification report
is a one-line edit to one file, and unrelated devices never produce
merge conflicts. The contracts shape is layout-agnostic — a driver
that prefers a single `data/devices.json5` is conformant; the
per-device split is the recommended pattern.

**Build artifact:** `packages/core/data/devices.json` (plain JSON,
defaults filled in, hex strings parsed once, all devices aggregated
into a single `DeviceRegistry`). This is what the runtime imports
and what the npm-published package ships. The compile script globs
`data/devices/*.json5` and emits the aggregated artifact.

**Validator:** each driver runs its existing
`validate-hardware-status.mjs`, extended to validate the whole
entry shape (not just the support block). Validates against
`DeviceRegistry` from `@thermal-label/contracts`.

**Schema versioning:** `schemaVersion: 1` on `DeviceRegistry` is the
shape this plan defines — there are no consumers of an earlier shape
yet, so v1 is the first published version, not a migration window.
The aggregator and any cross-driver consumer reads `schemaVersion`
and refuses unknown values with a clear error rather than silently
mishandling shape divergence; the field exists so that a future
breaking change has a coordination point, not because we're
coordinating one today.

---

## 5. Decisions

- **`engines` always required, never empty?** Yes. LM fabricates a
  primary engine entry. One shape simplifies every downstream
  renderer and resolver.
- **`support` always present on `DeviceEntry`?** Yes, defaulting to
  `{ status: 'untested' }`. Consumers' types stay unconditional.
- **JSON5 source / plain JSON artifact?** Yes — JSON5 for
  `data/devices.json5` (recovers comments); compile to plain JSON
  at build time for the runtime artifact and the npm-published file.
- **`mediaDetection` is a boolean**, not a tier. The contracts
  library does not block prints. Rails, not walls — what the
  printer *does* on mismatch is honest information for
  `hardwareQuirks` prose where it matters; what the *app* does is
  the app's call.
- **`bind.address` is `number`**, not `number | string`. `'auto'`
  is routing-time-only — it lives in `PrintOptions.engine`, not as
  a stored engine address. Multi-engine devices whose protocol
  supports auto default to it when `engine` is omitted; those
  whose protocol does not (Duo) throw `EngineRequiredError`.
- **Per-engine routing lives under `bind`**, not as flat
  `transport` + `address` siblings on the engine. Transport-layer
  routing is keyed by transport (`bind.usb`, future `bind.tcp`);
  protocol-layer routing (`bind.address`) is a flat sibling
  consumed by the protocol implementation. One block, one place to
  look for "how is this engine addressed." Promote `bind.address`
  to `bind.protocol: {...}` if a future protocol grows more than
  one in-band routing dimension.
- **One file per device under `data/devices/`** is the recommended
  source layout (JSON5, glob-built into the aggregated `data/devices.json`
  artifact). PR blast radius scales with the change instead of with
  the registry size. Single-file `data/devices.json5` remains
  conformant for drivers that prefer it.
- **Driver-level "auto" routing.** The protocol module owns the
  byte value (wire-format detail, not registry detail); the
  registry doesn't carry an `autoRoute` flag — the capability is
  implicit in whether `PROTOCOLS[tag]` exposes an auto address
  sentinel.
- **`bluetooth-spp` schema is verified on Windows + Linux;
  macOS still untested.** The OS-paired RFCOMM-as-serial approach
  prints successfully on both, using the existing serial
  implementation. macOS coverage is the remaining gap; surface as
  untested in the docs and add to the verification checklist.
- **One `nodeSerialImpl` satisfies both `serial` and
  `bluetooth-spp`.** Confirmed working. Keep as one module for
  now; revisit if a future SPP printer needs auto-pair, MAC
  matching, or active channel discovery that doesn't fit the
  OS-paired path.
- **UI labelling for SPP transports** is out of scope — it lives
  in the frontend. The registry stays wire-protocol-honest
  (`bluetooth-spp` not `serial`); how the picker presents it
  ("Bluetooth", not "Serial port (COM7)") is a frontend
  string-mapping concern.
- **`bluetooth-spp` and `bluetooth-gatt` stay as separate
  transport keys** — *not* unified under a single `bluetooth` key
  with a `profile` discriminator. The split is forced by reality
  on every front: BR/EDR vs BLE radios, SDP vs advertisement
  discovery, classic vs BLE pairing flows, and — decisively — the
  frontend cannot present them in one picker even if it wanted to.
  Web Bluetooth is GATT-only by spec; classic SPP devices surface
  via Web Serial after OS pairing. Two transport keys, two
  pickers, two impls. A `transportCategory()` helper can group
  them as "Bluetooth" for descriptive purposes (docs page,
  capability summaries) without the schema conflating them.
- **`hardwareQuirks` is markdown.** The existing YAML `quirks`
  was markdown, consistency wins. Revisit if we ever want
  machine-readable warning categories.
- **VID/PID as hex string vs. number?** Hex string (`"0x0922"`) —
  matches what every datasheet, lsusb output, and forum post uses;
  consumers parseInt at the boundary.
- **Print API surface — one method, engine as parameter.** One
  `printer.print(image, media, options)` on the adapter;
  `options.engine` is the routing field, same shape as
  `options.density` / `options.copies`. Engine descriptors in
  `printer.engines` carry queries (`getStatus()`,
  `mediaCompatibility`, `drivable`) but *not* `print()`.

---

## 6. Sequencing across plans

This plan ships first as the contracts surface — `PrintEngine`,
`DeviceTransports`, `DeviceSupport`, `MediaDescriptor` extensions,
helpers, `schemaVersion: 1`. No prior consumers, so this is the
initial published shape rather than an additive overlay on top of
something older.

Driver migrations land independently, each in its own plan:

- `../labelwriter/plans/backlog/migrate-to-contracts-shape.md` —
  subsumes `unify-device-registry`, `expand-media-registry`,
  `duo-tape-support`, `twin-turbo-support`,
  `amendment-support-300-series`. Includes LW
  `hardware-status.yaml` → `data/devices.json5` migration.
- `../brother-ql/plans/backlog/migrate-to-contracts-shape.md` —
  subsumes `add-pt-series`. Includes Brother YAML→JSON5.
- `../labelmanager/plans/backlog/migrate-to-contracts-shape.md` —
  no existing backlog plan. Fabricates `engines[0]`, collapses
  `experimental?` into `support.status`, YAML→JSON5.

Niimbot is a stub; when it grows beyond stub it conforms to this
shape on first commit (no migration plan needed).

The docs build sits on top of all three driver migrations:

- `../thermal-label.github.io/plans/backlog/per-device-pages.md` —
  per-device page generator, denylist renderer, drop YAML pull.

The runtime support-state UX (`shouldPromptForVerification`,
`verificationCTA`, mismatch banner patterns, `untested`-device
toast) is **deferred** to a separate plan. Apps can read
`adapter.device.support` directly today; opinionated helpers can
follow once the shape is in flight.

The org-level `thermal-label--dot-github/CONTRIBUTING/hardware-status-schema.md`
update (YAML→JSON, document inline-in-`devices.json5` location)
lands with the contracts schema PR — contracts owns the canonical
schema reference.

---

## 7. Out of scope

- The per-device documentation page. Lives in the docs build plan.
- Runtime UX patterns (verification CTA, mismatch banners,
  feature-state chips). Deferred plan.
- Manual device add via runtime telemetry. Adding a device still
  requires a PR to `data/devices.json5` (data only when the
  protocol is supported; data + impl when it isn't).
- Cross-driver media id namespace. Each driver keeps its own ids;
  the contracts level only standardises field shapes.
- Affiliate / retailer links on media entries — see
  `media-purchase-links.md`.
- A configurable runtime-impl plugin system. The `TRANSPORT_IMPLS`
  / `PROTOCOLS` registries in §3.5 are static per package. Revisit
  if the ecosystem ever grows third-party transport adapters.
