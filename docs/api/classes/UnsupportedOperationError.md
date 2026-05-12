# Class: UnsupportedOperationError

The requested operation is not supported by this driver, printer, or
media.

Used by drivers to reject e.g. an unknown `PrintOptions.density` value,
a cut command on a printer without a cutter, or a two-colour image on
single-colour media.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new UnsupportedOperationError(operation: string, reason: string): UnsupportedOperationError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `operation` | `string` |
| `reason` | `string` |

#### Returns

`UnsupportedOperationError`

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
