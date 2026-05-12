# Function: resolveSupportedDevices()

```ts
function resolveSupportedDevices(
   registry: DeviceRegistry, 
   protocols: ReadonlySet<string>, 
   transports: ReadonlySet<TransportType>): SupportedDevice[];
```

Filter a registry down to the devices a host runtime can actually
drive, given the set of registered protocols and transport
implementations.

Two dimensions, deliberately kept separate:

- **Engine coverage** is a property of `(device, PROTOCOLS)` —
  stable per package version. Drives the "is this device supported
  by this driver" verdict (`allEnginesDrivable`).
- **Transport coverage** is a property of
  `(device, TRANSPORT_IMPLS)` — varies by host runtime. Surfaced
  as `drivableTransports` / `undrivableTransports`; consumers
  compose their own UI from the arrays.

A device with usb + tcp + bluetooth-spp on a Node host without SPP
is *fully supported* in every sense the user cares about — the
missing SPP is a per-transport hint, not a device-level demotion.

The resolver also filters out devices with zero drivable transports
or zero drivable engines — they cannot be opened or printed to from
this runtime, so there is nothing useful to surface.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `registry` | [`DeviceRegistry`](../interfaces/DeviceRegistry.md) |
| `protocols` | `ReadonlySet`\<`string`\> |
| `transports` | `ReadonlySet`\<[`TransportType`](../type-aliases/TransportType.md)\> |

## Returns

[`SupportedDevice`](../interfaces/SupportedDevice.md)[]
