# Function: mapLegacyStatus()

```ts
function mapLegacyStatus(legacy: "verified" | "partial" | "broken" | "untested" | undefined): SupportStatus | undefined;
```

Map a legacy `DeviceSupport.status` value to a stored
`SupportStatus`. Returns `undefined` for `'untested'` (= absent in
the new shape).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `legacy` | `"verified"` \| `"partial"` \| `"broken"` \| `"untested"` \| `undefined` |

## Returns

[`SupportStatus`](../type-aliases/SupportStatus.md) \| `undefined`
