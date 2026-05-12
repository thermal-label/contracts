# Class: TransportTimeoutError

A read timed out waiting for bytes from the printer.

## Extends

- [`TransportError`](TransportError.md)

## Constructors

### Constructor

```ts
new TransportTimeoutError(transport: TransportType, timeoutMs: number): TransportTimeoutError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `transport` | [`TransportType`](../type-aliases/TransportType.md) |
| `timeoutMs` | `number` |

#### Returns

`TransportTimeoutError`

#### Overrides

[`TransportError`](TransportError.md).[`constructor`](TransportError.md#constructor)

## Properties

### cause?

```ts
optional cause?: unknown;
```

#### Inherited from

[`TransportError`](TransportError.md).[`cause`](TransportError.md#cause)

***

### message

```ts
message: string;
```

#### Inherited from

[`TransportError`](TransportError.md).[`message`](TransportError.md#message)

***

### name

```ts
name: string;
```

#### Inherited from

[`TransportError`](TransportError.md).[`name`](TransportError.md#name)

***

### stack?

```ts
optional stack?: string;
```

#### Inherited from

[`TransportError`](TransportError.md).[`stack`](TransportError.md#stack)

***

### transport

```ts
readonly transport: TransportType;
```

#### Inherited from

[`TransportError`](TransportError.md).[`transport`](TransportError.md#transport)
