import {
  getPreferenceValues,
  ActionPanel,
  Action,
  List,
  Icon,
} from "@raycast/api";
import { useEffect, useState, useMemo } from "react";
import { show } from "./rpass";
import { copyPassword, pastePassword } from "./clipboard";
import OtpRow from "./otp-row";

interface Preferences {
  defaultAction: string;
}

interface Row {
  idx: number;
  name: string;
  value: string;
}

const TOTP_PATTERN = /^otpauth:\/\/(totp|hotp)\/([^?]+)\?(.+)$/;

function parseRows(content: string): Row[] {
  return content
    .split("\n")
    .filter(Boolean)
    .map((line, idx) => {
      if (TOTP_PATTERN.test(line)) return { idx, name: "otpauth", value: line };
      if (idx === 0) return { idx, name: "pass", value: line };
      const [name, value] = line.split(/:\s?(.*)/, 2);
      return { idx, name, value };
    });
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function EntryRow({ row, defaultAction }: { row: Row; defaultAction: string }) {
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
      icon={Icon.Key}
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
            shortcut={{ modifiers: ["cmd", "shift"], key: "h" }}
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

export default function Content({ storepath, entry }: Props) {
  const { defaultAction } = getPreferenceValues<Preferences>();
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    show(entry, storepath)
      .then((content) => setRows(parseRows(content)))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [entry]);

  return (
    <List isLoading={isLoading}>
      {rows.map((row) =>
        row.name === "otpauth" ? (
          <OtpRow key={row.idx} entry={entry} storepath={storepath} />
        ) : (
          <EntryRow key={row.idx} row={row} defaultAction={defaultAction} />
        ),
      )}
    </List>
  );
}
