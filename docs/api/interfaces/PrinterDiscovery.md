# Interface: PrinterDiscovery

Interface for discovering available printers.

Each driver implements this for its supported transports. A unified
CLI can aggregate implementations across all installed driver
packages to auto-detect printers regardless of family.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-family"></a> `family` | `readonly` | `string` | Driver family identifier — matches `DeviceEntry.family`. |

## Methods

### listPrinters()

```ts
listPrinters(): Promise<DiscoveredPrinter[]>;
```

List connected printers on this driver's supported transports.

#### Returns

`Promise`\<[`DiscoveredPrinter`](DiscoveredPrinter.md)[]\>

***

### openPrinter()

```ts
openPrinter(options?: OpenOptions): Promise<PrinterAdapter>;
```

Open a printer matching the given options.

If no options are provided, opens the first available printer.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`OpenOptions`](OpenOptions.md) |

#### Returns

`Promise`\<[`PrinterAdapter`](PrinterAdapter.md)\>
