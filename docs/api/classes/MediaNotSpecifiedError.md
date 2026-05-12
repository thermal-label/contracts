# Class: MediaNotSpecifiedError

`PrinterAdapter.print()` or `createPreview()` was called without a
media argument and no detected media was available.

The caller must either pass `media` explicitly or call `getStatus()`
first so the adapter can cache a detected media descriptor.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new MediaNotSpecifiedError(): MediaNotSpecifiedError;
```

#### Returns

`MediaNotSpecifiedError`

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
