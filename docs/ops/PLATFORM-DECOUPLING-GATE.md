# Platform Decoupling Gate

Tillerstead originated inside `evident-technologies/platform`, but this repo is the standalone public-web destination.

The platform decoupling PR must remain gated until:

1. Cloudflare Pages preview from this repository is verified.
2. `tillerstead.com` cutover is explicitly approved and completed.
3. Live smoke checks pass.
4. Evident ICU is confirmed unaffected.
5. Rollback path is documented.

Do not merge the platform decoupling PR before live cutover verification.
