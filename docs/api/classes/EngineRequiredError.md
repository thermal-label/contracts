# Class: EngineRequiredError

`PrinterAdapter.print()` was called on a multi-engine device whose
protocol does not support firmware-side auto-routing, without an
explicit `engine` in `PrintOptions`.

Thrown by drivers when `options.engine` is omitted on devices like
the LabelWriter Duo where the host has to pick a target engine
up-front. The list of valid roles is included so the caller can
surface a useful UX message.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new EngineRequiredError(availableEngines: readonly string[]): EngineRequiredError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `availableEngines` | readonly `string`[] |

#### Returns

`EngineRequiredError`

#### Overrides

```ts
Error.constructor
```

## Properties

### availableEngines

```ts
readonly availableEngines: readonly string[];
```

Available engine roles on the connected device.

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
