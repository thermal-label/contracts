# Interface: PrintableArea

Chassis-physical dead-zone insets around the printable rectangle.

Insets the printhead physically cannot reach — head-to-cutter
offsets, head-vs-tape-width geometry, sensor-window keep-outs.
Encoders consume this to crop / shift the bitmap so authored content
lands where the user expects.

Distinct from `MediaDescriptor.printMargins` (per-media design-tool
inset, conservative of the chassis floor), from
`PrintEngine.forcedTrailingFeedMm` (post-print tape advance), and
from any wire-protocol "feed margin" command the firmware enacts on
its own (Brother QL/PT `ESC i d`).

Field naming is print-direction-relative, not bitmap-coordinate-
relative — `leading` / `trailing` survive 90° rotations the driver
applies before encoding, where `top` / `bottom` would invert.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-leading"></a> `leading` | `readonly` | `number` | Unprintable strip at the leading edge of the print, in mm. |
| <a id="property-left"></a> `left` | `readonly` | `number` | Unprintable strip at the left side of the head, in mm. |
| <a id="property-right"></a> `right` | `readonly` | `number` | Unprintable strip at the right side of the head, in mm. |
| <a id="property-trailing"></a> `trailing` | `readonly` | `number` | Unprintable strip at the trailing edge of the print, in mm. |
