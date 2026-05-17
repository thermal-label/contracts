# Interface: StatusDetail

A driver-formatted diagnostic row.

Drivers decode protocol-specific status fields (print density, head
voltage, labels remaining, ...) into pre-formatted `{label, value}`
pairs that a consumer renders verbatim — no consumer needs to know
any vendor field names. The driver owns formatting; the harness (or
any other consumer) renders any device blindly, with zero change
when a new model lands.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-label"></a> `label` | `string` | Short label, e.g. `'Print density'`, `'Labels remaining'`. |
| <a id="property-severity"></a> `severity?` | `"info"` \| `"warn"` \| `"error"` | Severity hint — drives row colour where the consumer renders it. Defaults to `'info'` when omitted. |
| <a id="property-value"></a> `value` | `string` | Pre-formatted value, e.g. `'100%'`, `'47'`, `'0x1A1A'`. |
