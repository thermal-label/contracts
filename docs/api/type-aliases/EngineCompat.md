# Type Alias: EngineCompat

```ts
type EngineCompat = Pick<PrintEngine, "mediaCompatibility">;
```

Engine acceptance is described by `PrintEngine.mediaCompatibility`
(which media classes the head accepts) and media advertise which
device classes they fit via `MediaDescriptor.targetModels`. Both
are driver-defined string sets, matched as set intersection.

Either side omitting its set means *unrestricted* on that side —
an engine without `mediaCompatibility` accepts every media in the
driver's registry, and media without `targetModels` fits every
device in the family.
