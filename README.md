# RPass Raycast Extension

Browse a pass-compatible password store from Raycast using the `rpass` CLI. The extension can list vault entries, decrypt an entry, copy or paste passwords and metadata, show TOTP codes when an entry contains an OTP URI, and generate new password or passphrase entries.

## Requirements

- Raycast
- Node.js and npm for development
- The `rpass` CLI installed and available on `PATH`, or configured in the extension preferences
- A GPG-backed password-store-compatible repository, such as `~/.password-store`

`rpass` keeps the password-store shape: entries are stored as `<entry-name>.gpg`, the password is the first decrypted line, and extra metadata remains plain text lines.

## Setup

Install dependencies:

```bash
npm install
```

Run the extension in Raycast development mode:

```bash
npm run dev
```

Configure the extension preferences in Raycast:

- **rpass Executable Path**: optional path to the `rpass` binary. Leave empty when `rpass` is on `PATH`.
- **Password Store Directory**: optional path to your password store. Defaults to `~/.password-store`.
- **Default Action**: choose whether entry rows copy or paste by default.
- **Clear Clipboard After**: automatically clear copied passwords after the selected timeout.

When the selected password store has no `.gpg-id`, the extension shows an initialization form inside Vault or New Entry. Enter one or more GPG recipients, such as an email, key ID, or fingerprint; the extension runs `rpass init --json <recipient...>` for you.

## Avoiding GPG Timeouts

If decrypting entries times out, GPG may be waiting for pinentry.

For non-interactive unlocks, enable loopback pinentry.

### macOS / Linux

Edit `~/.gnupg/gpg-agent.conf` and add:

```text
allow-loopback-pinentry
```

Restart gpg-agent:

```bash
gpgconf --kill gpg-agent
```

### Windows

Edit `%APPDATA%\gnupg\gpg-agent.conf` and add:

```text
allow-loopback-pinentry
```

Restart gpg-agent:

```bash
gpgconf --kill gpg-agent
```

This does not change GPG cache durations. It only allows `rpass --passphrase-stdin` to pass the passphrase directly to GPG instead of opening a pinentry UI.

## CLI integration contract

The extension calls `rpass` with JSON output where available:

```bash
rpass list --json
rpass show example/login --json
rpass otp example/login --json
rpass generate example/login --json
rpass generate example/passphrase --phrase --json
```

Entries are addressed without the `.gpg` suffix. Use `example/login`, not `example/login.gpg`.

For non-interactive passphrase flows, integrations must use:

```bash
rpass show example/login --json --passphrase-stdin
rpass otp example/login --json --passphrase-stdin
```

Do **not** use or add `--passphrase <value>`. Command-line arguments can leak through shell history, process listings, logs, crash reports, or telemetry.

JSON behavior expected by the extension:

- success: stdout contains one complete JSON value and stderr is empty;
- failure: stderr contains one JSON error object and stdout is empty.

Error shape:

```json
{
  "error": {
    "code": "example_code",
    "message": "human-readable message"
  }
}
```

## Development

Run these checks before declaring work done:

```bash
npx tsc --noEmit
npm test
npm run lint -- --exit-on-error --non-interactive
```

Optional build check:

```bash
npm run build
```

## Test data safety

Use dummy examples only in tests, docs, issues, and screenshots:

- entries: `example/login`, `demo/account`, `team/example/login`
- domains: `example.invalid`
- passwords: `dummy-password`, `new-dummy-password`

Do not put real credentials, real service domains, or personal data in this repository.
