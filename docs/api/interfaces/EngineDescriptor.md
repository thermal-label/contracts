# Interface: EngineDescriptor

A `PrintEngine` enriched with whether the host runtime has a
registered protocol implementation for it. Returned per-engine by
`resolveSupportedDevices`.

## Extends

- [`PrintEngine`](PrintEngine.md)

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="property-bind"></a> `bind?` | [`EngineBind`](EngineBind.md) | Per-engine routing hints. Omit on single-engine devices. See `EngineBind` for transport-layer vs protocol-layer routing. | [`PrintEngine`](PrintEngine.md).[`bind`](PrintEngine.md#property-bind) |
| <a id="property-capabilities"></a> `capabilities?` | [`PrintEngineCapabilities`](PrintEngineCapabilities.md) | Engine-level capability flags. See `PrintEngineCapabilities`. | [`PrintEngine`](PrintEngine.md).[`capabilities`](PrintEngine.md#property-capabilities) |
| <a id="property-dpi"></a> `dpi` | `number` | - | [`PrintEngine`](PrintEngine.md).[`dpi`](PrintEngine.md#property-dpi) |
| <a id="property-drivable"></a> `drivable` | `boolean` | True iff `protocols` passed to the resolver included this engine's protocol. | - |
| <a id="property-forcedtrailingfeedmm"></a> `forcedTrailingFeedMm?` | `number` | Post-print tape advance the printer (or this driver's encoder) forces after the printed bitmap, in mm. Distinct from `printableArea`: - `printableArea` describes where the head can't reach during the print; - `forcedTrailingFeedMm` describes tape eaten *after* the print so content clears the cutter / tear bar. Populated where the suite has a known fixed post-print feed (cat-printer's `DEFAULT_FEED_LINES`, labelmanager's encoder-side trailing pad, LabelManager PnP's firmware-enforced advance). Absent / `0` when the trailing feed is variable (e.g. labelwriter `ESC E` advances to the next tear bar — distance depends on the label gap-sensor position) or when the suite has no measurement. Use `getForcedTrailingFeedMm(engine)` from `@thermal-label/contracts` to resolve with the zero default. | [`PrintEngine`](PrintEngine.md).[`forcedTrailingFeedMm`](PrintEngine.md#property-forcedtrailingfeedmm) |
| <a id="property-headdots"></a> `headDots` | `number` | Native dot count across the head. | [`PrintEngine`](PrintEngine.md).[`headDots`](PrintEngine.md#property-headdots) |
| <a id="property-mediacompatibility"></a> `mediaCompatibility?` | readonly `string`[] | Filter for which entries from the driver's media registry this engine accepts. Resolved against `MediaDescriptor.targetModels`. Driver-defined string set; `undefined` = engine accepts every media in the driver's registry. | [`PrintEngine`](PrintEngine.md).[`mediaCompatibility`](PrintEngine.md#property-mediacompatibility) |
| <a id="property-printablearea"></a> `printableArea?` | [`PrintableArea`](PrintableArea.md) | Chassis-physical dead zones around the printable rectangle (mm). Insets the head physically cannot reach — head-to-cutter offsets, head-vs-tape-width geometry, sensor-window keep-outs. Encoders use this to crop / shift the bitmap so authored content lands where the user expects. Distinct from `MediaDescriptor.printMargins` (per-media design-tool inset), from `forcedTrailingFeedMm` (post-print tape advance), and from any wire-protocol "feed margin" command the firmware enacts on its own (e.g. Brother QL/PT `ESC i d`). Absent means "not measured" rather than "measured to zero". Use `getPrintableArea(engine, media?)` from `@thermal-label/contracts` to resolve a fully-populated value with the standard zero defaults and per-roll media-tag override applied. | [`PrintEngine`](PrintEngine.md).[`printableArea`](PrintEngine.md#property-printablearea) |
| <a id="property-protocol"></a> `protocol` | `string` | Driver-family-specific wire-protocol tag. | [`PrintEngine`](PrintEngine.md).[`protocol`](PrintEngine.md#property-protocol) |
| <a id="property-role"></a> `role` | `string` | Semantic role identifier — used as the lookup key on the runtime adapter (`printer.engines[role]`). For single-engine devices: `'primary'`. For composite devices: descriptive (`'label'`, `'tape'`, `'left'`, `'right'`). | [`PrintEngine`](PrintEngine.md).[`role`](PrintEngine.md#property-role) |
