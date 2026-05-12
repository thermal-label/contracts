# Class: DeviceNotFoundError

No device matching the requested filter was found on the host.

When both `vid` and `pid` are provided, the message includes them in
hex for easier cross-referencing with the device registry.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new DeviceNotFoundError(vid?: number, pid?: number): DeviceNotFoundError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `vid?` | `number` |
| `pid?` | `number` |

#### Returns

`DeviceNotFoundError`

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
