import {
  Action,
  ActionPanel,
  Form,
  getPreferenceValues,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { RpassError, showEntry } from "../../rpass/application/rpass-client";
import {
  parseVaultEntryRows,
  type VaultEntryRow,
} from "../domain/vault-entry-content";
import { copyPassword, pastePassword } from "./clipboard";
import { getOptionIcon } from "./icons";
import OtpRow from "./otp-row";

interface Preferences {
  defaultAction: string;
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function EntryRow({
  row,
  defaultAction,
}: {
  row: VaultEntryRow;
  defaultAction: string;
}) {
  const [visible, setVisible] = useState(false);

  const { toggleTitle, toggleIcon, itemTitle } = useMemo(
    () =>
      visible
        ? {
            toggleTitle: "Hide Value",
            toggleIcon: Icon.EyeDisabled,
            itemTitle: `${row.name}: ${row.value}`,
          }
        : {
            toggleTitle: "Show Value",
            toggleIcon: Icon.Eye,
            itemTitle: row.name,
          },
    [visible, row],
  );

  return (
    <List.Item
      icon={getOptionIcon(row.name)}
      title={capitalizeFirstLetter(itemTitle)}
      actions={
        <ActionPanel>
          {defaultAction === "copy" ? (
            <>
              <Action
                title="Copy to Clipboard"
                onAction={() => copyPassword(row.value)}
              />
              <Action
                title="Paste in Active App"
                onAction={() => pastePassword(row.value)}
              />
            </>
          ) : (
            <>
              <Action
                title="Paste in Active App"
                onAction={() => pastePassword(row.value)}
              />
              <Action
                title="Copy to Clipboard"
                onAction={() => copyPassword(row.value)}
              />
            </>
          )}
          <Action
            icon={toggleIcon}
            title={toggleTitle}
            onAction={() => setVisible((v) => !v)}
            shortcut={{ modifiers: ["opt"], key: "e" }}
          />
        </ActionPanel>
      }
    />
  );
}

interface Props {
  storepath: string;
  entry: string;
}

interface PassphraseValues {
  passphrase: string;
}

export default function Content({ storepath, entry }: Props) {
  const { defaultAction } = getPreferenceValues<Preferences>();
  const [rows, setRows] = useState<VaultEntryRow[]>([]);
  const [passphrase, setPassphrase] = useState<string>();
  const [needsPassphrase, setNeedsPassphrase] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState("");
  const [passphraseError, setPassphraseError] = useState<string>();
  const [passphraseVisible, setPassphraseVisible] = useState(false);
  const [lastError, setLastError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  async function load(passphrase?: string) {
    setIsLoading(true);
    try {
      const content = await showEntry(entry, storepath, passphrase);
      setRows(parseVaultEntryRows(content));
      setPassphrase(passphrase);
      setNeedsPassphrase(false);
      setLastError(undefined);
    } catch (error) {
      if (
        error instanceof RpassError &&
        error.code === "gpg_passphrase_required"
      ) {
        setNeedsPassphrase(true);
      } else {
        const message =
          error instanceof RpassError
            ? `${error.code}: ${error.message}${error.details ? `\n\n${error.details}` : ""}`
            : error instanceof Error
              ? error.message
              : String(error);
        setLastError(message);
        showToast(Toast.Style.Failure, "Failed to decrypt entry", message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function updatePassphraseInput(value: string) {
    setPassphraseInput(value);
    if (passphraseError) setPassphraseError(undefined);
  }

  function validatePassphrase(value: string) {
    if (!value) {
      setPassphraseError("Passphrase is required");
      return false;
    }

    setPassphraseError(undefined);
    return true;
  }

  function unlock(values: PassphraseValues) {
    if (!validatePassphrase(values.passphrase)) return;
    load(values.passphrase);
  }

  useEffect(() => {
    load();
  }, [entry, storepath]);

  if (needsPassphrase) {
    return (
      <Form
        isLoading={isLoading}
        actions={
          <ActionPanel>
            <Action.SubmitForm title="Unlock Entry" onSubmit={unlock} />
            <Action
              icon={passphraseVisible ? Icon.EyeDisabled : Icon.Eye}
              title={passphraseVisible ? "Hide Passphrase" : "Show Passphrase"}
              shortcut={{ modifiers: ["opt"], key: "e" }}
              onAction={() => setPassphraseVisible((visible) => !visible)}
            />
          </ActionPanel>
        }
      >
        {passphraseVisible ? (
          <Form.TextField
            id="passphrase"
            title="GPG Passphrase"
            placeholder="Enter GPG passphrase"
            value={passphraseInput}
            error={passphraseError}
            onChange={updatePassphraseInput}
            onBlur={(event) => validatePassphrase(event.target.value ?? "")}
          />
        ) : (
          <Form.PasswordField
            id="passphrase"
            title="GPG Passphrase"
            placeholder="Enter GPG passphrase"
            value={passphraseInput}
            error={passphraseError}
            onChange={updatePassphraseInput}
            onBlur={(event) => validatePassphrase(event.target.value ?? "")}
          />
        )}
      </Form>
    );
  }

  if (lastError) {
    return (
      <List isLoading={isLoading}>
        <List.Item
          icon={Icon.ExclamationMark}
          title="Failed to Decrypt Entry"
          subtitle={lastError}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy Error" content={lastError} />
              <Action
                title="Retry"
                icon={Icon.ArrowClockwise}
                onAction={() => load(passphrase)}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading}>
      {rows.map((row) =>
        row.name === "otpauth" ? (
          <OtpRow
            key={row.idx}
            entry={entry}
            storepath={storepath}
            passphrase={passphrase}
          />
        ) : (
          <EntryRow key={row.idx} row={row} defaultAction={defaultAction} />
        ),
      )}
    </List>
  );
}
