import {
  Action,
  ActionPanel,
  Form,
  Icon,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useState } from "react";
import { initStore, RpassError } from "../../rpass/application/rpass-client";

interface Props {
  storepath: string;
  onDone?(): void | Promise<void>;
}

interface Values {
  recipients: string;
}

function formatError(error: unknown): string {
  if (error instanceof RpassError) {
    return `${error.code}: ${error.message}${error.details ? `\n\n${error.details}` : ""}`;
  }

  if (error instanceof Error) return error.message;
  return String(error);
}

function parseRecipients(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

export default function SetupPasswordStore({ storepath, onDone }: Props) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [recipientInput, setRecipientInput] = useState("");
  const [recipientError, setRecipientError] = useState<string>();
  const [lastError, setLastError] = useState<string>();

  function validate(value: string): boolean {
    const recipients = parseRecipients(value);
    if (recipients.length === 0) {
      setRecipientError("Enter at least one GPG recipient");
      return false;
    }

    setRecipientError(undefined);
    return true;
  }

  async function submit(values: Values) {
    if (!validate(values.recipients)) return;

    const recipients = parseRecipients(values.recipients);
    setIsLoading(true);
    setLastError(undefined);
    try {
      const result = await initStore(recipients, storepath);
      await showToast(
        Toast.Style.Success,
        "Password Store Initialized",
        result.path,
      );
      await onDone?.();
      pop();
    } catch (error) {
      const message = formatError(error);
      setLastError(message);
      await showToast(
        Toast.Style.Failure,
        "Failed to Initialize Password Store",
        message,
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            icon={Icon.Hammer}
            title="Initialize Password Store"
            onSubmit={submit}
          />
          {lastError ? (
            <Action.CopyToClipboard
              title="Copy Last Error"
              content={lastError}
            />
          ) : null}
        </ActionPanel>
      }
    >
      <Form.Description text={`Store: ${storepath}`} />
      <Form.Description text="This password store has no .gpg-id yet. Initialize it with one or more GPG recipients before saving passwords." />
      <Form.TextArea
        id="recipients"
        title="GPG Recipients"
        placeholder="alice@example.com"
        info="Enter an email, key ID, or fingerprint. Use one recipient per line, or separate recipients with commas."
        value={recipientInput}
        error={recipientError}
        onChange={(value) => {
          setRecipientInput(value);
          if (recipientError) setRecipientError(undefined);
        }}
        onBlur={(event) => validate(event.target.value ?? "")}
      />
    </Form>
  );
}
