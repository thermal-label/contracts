# Class: DeviceIdentificationRequiredError

A driver-web `requestPrinters(opts)` factory opened the browser
picker and got a port/device back, but couldn't decide which
registry entry it corresponds to. The picker may have offered an
unidentifiable serial port (Web Serial doesn't expose BT device
names) or the picked USB device's VID/PID didn't match anything in
the driver's registry.

The error carries the candidate registry entries (filtered to ones
declaring the connecting transport) and a `continueWith(deviceKey)`
closure that resumes the connect flow with the operator's choice —
no second picker open required, the original port/device is held
inside the closure.

Harness-shell shape:
```ts
try {
  return await adapter.requestPrinters({ transport });
} catch (err) {
  if (err instanceof DeviceIdentificationRequiredError) {
    const choice = await showDropdown(err.candidates);
    return await err.continueWith(choice);
  }
  throw err;
}
```

## Extends

- `Error`

## Constructors

### Constructor

```ts
new DeviceIdentificationRequiredError(candidates: readonly DeviceEntry[], continueWith: (deviceKey: string) => Promise<Readonly<Record<string, PrinterAdapter>>>): DeviceIdentificationRequiredError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `candidates` | readonly [`DeviceEntry`](../interfaces/DeviceEntry.md)[] |
| `continueWith` | (`deviceKey`: `string`) => `Promise`\<`Readonly`\<`Record`\<`string`, [`PrinterAdapter`](../interfaces/PrinterAdapter.md)\>\>\> |

#### Returns

`DeviceIdentificationRequiredError`

#### Overrides

```ts
Error.constructor
```

## Properties

### candidates

```ts
readonly candidates: readonly DeviceEntry[];
```

***

### cause?

```ts
optional cause?: unknown;
```

#### Inherited from

```ts
Error.cause
```

***

### continueWith

```ts
readonly continueWith: (deviceKey: string) => Promise<Readonly<Record<string, PrinterAdapter>>>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deviceKey` | `string` |

#### Returns

`Promise`\<`Readonly`\<`Record`\<`string`, [`PrinterAdapter`](../interfaces/PrinterAdapter.md)\>\>\>

***

### message

```ts
message: string;
```

#### Inherited from

```ts
Error.message
```

***

### name

```ts
name: string;
```

#### Inherited from

```ts
Error.name
```

***

### stack?

```ts
optional stack?: string;
```

#### Inherited from

```ts
Error.stack
```
