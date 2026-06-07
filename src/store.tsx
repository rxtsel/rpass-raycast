import { Icon, List, ActionPanel, Action } from "@raycast/api";
import { useEffect, useState } from "react";
import { list } from "./rpass";
import Content from "./content";

interface Props {
  storepath: string;
}

export default function Store({ storepath }: Props) {
  const [entries, setEntries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    list(storepath)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [storepath]);

  return (
    <List isLoading={isLoading}>
      {entries.map((entry) => (
        <List.Item
          key={entry}
          icon={Icon.Lock}
          title={entry}
          actions={
            <ActionPanel>
              <Action.Push
                title="Show Entry"
                target={<Content storepath={storepath} entry={entry} />}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
