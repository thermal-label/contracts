# Class: TransportError

Base class for transport-layer errors.

Wraps a transport-specific failure with the `TransportType` it came
from, so callers can branch on transport (USB vs TCP vs BLE) without
string-matching error messages.

## Extends

- `Error`

## Extended by

- [`TransportClosedError`](TransportClosedError.md)
- [`TransportTimeoutError`](TransportTimeoutError.md)

## Constructors

### Constructor

```ts
new TransportError(message: string, transport: TransportType): TransportError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `transport` | [`TransportType`](../type-aliases/TransportType.md) |

#### Returns

`TransportError`

#### Overrides

```ts
Error.constructor
```

## Properties

### cause?

```ts
optional cause?: unknown;
```

#### Inherited from

```ts
Error.cause
```

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

***

### transport

```ts
readonly transport: TransportType;
```
