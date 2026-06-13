<div align="center">
  <img src="assets/extension-icon.png" width="128" height="128" />

  <br/>

# RPass Vault

Manage your pass-compatible password store directly from Raycast

🔎 &nbsp; Search your vault &nbsp; 📋 &nbsp; Copy and paste fields &nbsp; 🔐 &nbsp; Generate passwords and passphrases &nbsp; ⏱️ &nbsp; Use TOTP codes &nbsp; 🔄 &nbsp; Sync with Git

</div>

<br/>

## Requirements

- [Raycast](https://www.raycast.com/)
- [`rpass` CLI](https://github.com/rxtsel/rpass-cli), installed and available on `PATH` or configured in the extension preferences
- [GnuPG](https://gnupg.org/) / Gpg4win for decrypting and encrypting entries
- A [password-store](https://www.passwordstore.org/)-compatible vault, usually `~/.password-store`
- Git is optional, only needed if you want to sync your password store with `rpass git ...`

`rpass` uses the standard password-store format: entries are encrypted files such as `example/login.gpg`, recipients are stored in `.gpg-id`, and decrypted entries keep the password on the first line.

## Setup

### Install `rpass`

Install the CLI from crates.io:

```bash
cargo install rpass-cli
```

Or download a binary from the [`rpass-cli` releases](https://github.com/rxtsel/rpass-cli/releases).

If `rpass` is not on your `PATH`, set its absolute path in the extension preference **rpass Executable Path**.

### Select your password store

By default, the extension uses:

```text
~/.password-store
```

You can choose a different folder in the extension preference **Password Store Directory**.

If the selected store does not exist or has no `.gpg-id`, the extension will show a setup form. Enter one or more GPG recipients, such as an email, key ID, or fingerprint. The extension initializes the store with:

```bash
rpass init <recipient...>
```

### Optional Git sync

If your password store is a Git repository, write commands are committed automatically by `rpass`.

To initialize Git history for a new store, run:

```bash
rpass git init
```

Then configure your remote as usual:

```bash
rpass git remote add origin <repo-url>
rpass git push -u origin main
```

## Usage

The extension provides commands for common password-store workflows:

- **Vault**: browse, search, decrypt, copy, paste, edit, move, or delete entries.
- **New Entry**: generate a password or passphrase and save it to the store.
- **Sync Vault**: inspect Git status/history and run pull or push.

When opening an encrypted entry, the extension may ask for your GPG passphrase. It uses `rpass --passphrase-stdin` so the passphrase is passed through stdin, not through command-line arguments.

## Avoiding GPG Timeouts

If decrypting entries times out, GPG may be waiting for pinentry. For non-interactive unlocks, enable loopback pinentry.

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

## Security

The extension relies on the [`rpass` CLI](https://github.com/rxtsel/rpass-cli) and GnuPG, so the same security model applies:

- passwords remain in your local password-store-compatible repository;
- entries are decrypted only when you explicitly open or use them;
- vault listing uses `rpass list --json` and does not decrypt entries in bulk;
- GPG passphrases are never passed as command-line arguments;
- generated or decrypted secrets are not stored by the extension;
- the extension only stores a short-lived non-secret marker that GPG was recently unlocked, so it can try the already-unlocked `gpg-agent` before prompting again.

## Local Development

Install dependencies:

```bash
npm install
```

Run the extension in Raycast development mode:

```bash
npm run dev
```

Run checks before declaring work done:

```bash
npx tsc --noEmit
npm test
npm run lint -- --exit-on-error --non-interactive
```

Optional build check:

```bash
npm run build
```

## Test Data Safety

Use dummy examples only in tests, docs, issues, and screenshots:

- entries: `example/login`, `demo/account`, `team/example/login`
- domains: `example.invalid`
- passwords: `dummy-password`, `new-dummy-password`

Do not put real credentials, real service domains, or personal data in this repository.
