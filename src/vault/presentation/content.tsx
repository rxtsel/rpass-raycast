import {
	Action,
	ActionPanel,
	getPreferenceValues,
	Icon,
	List,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { showEntry } from "../../rpass/application/rpass-client";
import {
	parseVaultEntryRows,
	type VaultEntryRow,
} from "../domain/vault-entry-content";
import { copyPassword, pastePassword } from "./clipboard";
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
	const [rows, setRows] = useState<VaultEntryRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		showEntry(entry, storepath)
			.then((content) => setRows(parseVaultEntryRows(content)))
			.catch(console.error)
			.finally(() => setIsLoading(false));
	}, [entry, storepath]);

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
