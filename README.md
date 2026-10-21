# trinity-stack-polkadot

The [Trinity stack descriptor](https://github.com/paritytech/trinity-user-agents/blob/main/docs/rfcs/trinity-stack-descriptor.md)
for Polkadot as the Polkadot Community Foundation's apps use it: the relay chain with Asset Hub (1000), People (1004) and
Bulletin (1010), public RPC endpoints, and the services PCF runs for its apps.

```
https://stack.api.pcf.network/.well-known/trinity-stack.json
```

The pointer, as a link or QR code:

```
polkadotapp://stack?key=0xdcddb708759dade2e3850368ce0add2072f424ba53f1a2128f3339d646cffe28&url=https%3A%2F%2Fstack.api.pcf.network%2F.well-known%2Ftrinity-stack.json
```

The descriptor is signed with the stack's key `0xdcddb708759dade2e3850368ce0add2072f424ba53f1a2128f3339d646cffe28`, which readers holding the pointer check.

The RPC lists hold every public endpoint that reports the chain's genesis hash, has a finalized head within 50 blocks
of the best one seen, and serves both the `chainHead_v1` and the legacy `state_*`/`author_*` methods. People endpoints
also serve the statement store, because the descriptor marks that chain `statementStore`.

## Files

| File                             | What it is                                                           |
| -------------------------------- | -------------------------------------------------------------------- |
| `model.json`                     | The source: the descriptor without `$v`, `sequence` and `generation` |
| `.well-known/trinity-stack.json` | The rendered descriptor this site serves                             |
| `publish-state.json`             | The last `sequence` and content hash, so `sequence` only rises       |

## Publishing a change

Edit `model.json`, sign it with the stack's key and commit all three files together. The generation is the relay chain's genesis hash.

```bash
truapi-host stack publish model.json \
  --generation 0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3 \
  --out . --state publish-state.json --signing-key-file <key file>
```

Check what is served:

```bash
truapi-host stack verify https://stack.api.pcf.network/.well-known/trinity-stack.json --key 0xdcddb708759dade2e3850368ce0add2072f424ba53f1a2128f3339d646cffe28
```
