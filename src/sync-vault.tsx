import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Detail,
  Icon,
  showToast,
  Toast,
} from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { configureRpassClientFromPreferences } from "./rpass/application/configure-rpass-client";
import {
  gitCommand,
  RpassError,
  type GitResult,
} from "./rpass/application/rpass-client";
import { resolveStorePath } from "./vault/application/store-path";
import checkInstall from "./vault/presentation/check-install";

function formatError(error: unknown): string {
  if (error instanceof RpassError) {
    return [error.message, error.details].filter(Boolean).join("\n\n");
  }
  return error instanceof Error ? error.message : String(error);
}

function formatCommandOutput(result: GitResult): string {
  return [
    result.stdout.trim()
      ? `### stdout\n\n\`\`\`text\n${result.stdout.trimEnd()}\n\`\`\``
      : undefined,
    result.stderr.trim()
      ? `### stderr\n\n\`\`\`text\n${result.stderr.trimEnd()}\n\`\`\``
      : undefined,
    `Exit code: ${result.exit_code}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function statusMarkdown({
  storepath,
  status,
  lastOutput,
  lastError,
  isRepository,
}: {
  storepath: string;
  status?: string;
  lastOutput?: string;
  lastError?: string;
  isRepository?: boolean;
}): string {
  const sections = [`# Sync Vault`, `Store: \`${storepath}\``];

  if (isRepository === false) {
    sections.push(
      "## Status",
      "Password store is not a Git repository.",
      "Run **Initialize Git** to start tracking it.",
    );
  } else {
    sections.push(
      "## Status",
      status?.trim()
        ? `\`\`\`text\n${status.trimEnd()}\n\`\`\``
        : "No Git status loaded yet.",
    );
  }

  if (lastOutput) {
    sections.push("## Last Output", lastOutput);
  }

  if (lastError) {
    sections.push("## Last Error", `\`\`\`text\n${lastError}\n\`\`\``);
  }

  return sections.join("\n\n");
}

export default function Command() {
  configureRpassClientFromPreferences();
  const storepath = resolveStorePath();
  const [isLoading, setIsLoading] = useState(false);
  const [isRepository, setIsRepository] = useState<boolean | undefined>();
  const [status, setStatus] = useState<string>();
  const [lastOutput, setLastOutput] = useState<string>();
  const [lastError, setLastError] = useState<string>();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLastError(undefined);
    try {
      const result = await gitCommand(["status", "-sb"], storepath);
      setStatus(result.stdout || result.stderr);
      setIsRepository(true);
    } catch (error) {
      if (
        error instanceof RpassError &&
        error.code === "git_repository_not_found"
      ) {
        setStatus(undefined);
        setIsRepository(false);
      } else {
        const message = formatError(error);
        setLastError(message);
        await showToast(
          Toast.Style.Failure,
          "Failed to Load Git Status",
          message,
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [storepath]);

  useEffect(() => {
    checkInstall();
    refresh();
  }, [refresh]);

  async function runGitAction({
    title,
    successTitle,
    args,
    confirm,
  }: {
    title: string;
    successTitle: string;
    args: string[];
    confirm?: { title: string; message: string; actionTitle: string };
  }) {
    if (confirm) {
      const confirmed = await confirmAlert({
        title: confirm.title,
        message: confirm.message,
        primaryAction: {
          title: confirm.actionTitle,
          style: Alert.ActionStyle.Destructive,
        },
        dismissAction: { title: "Cancel" },
      });
      if (!confirmed) return;
    }

    setIsLoading(true);
    setLastError(undefined);
    try {
      const result = await gitCommand(args, storepath);
      setLastOutput(formatCommandOutput(result));
      setIsRepository(true);
      await showToast(Toast.Style.Success, successTitle);
      await refresh();
    } catch (error) {
      const message = formatError(error);
      setLastError(message);
      await showToast(Toast.Style.Failure, title, message);
    } finally {
      setIsLoading(false);
    }
  }

  const markdown = statusMarkdown({
    storepath,
    status,
    lastOutput,
    lastError,
    isRepository,
  });

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            icon={Icon.ArrowClockwise}
            title="Refresh"
            onAction={refresh}
          />
          {isRepository === false ? (
            <Action
              icon={Icon.Hammer}
              title="Initialize Git"
              onAction={() =>
                runGitAction({
                  title: "Failed to Initialize Git",
                  successTitle: "Git Initialized",
                  args: ["init"],
                })
              }
            />
          ) : null}
          {isRepository !== false ? (
            <>
              <Action
                icon={Icon.Download}
                title="Pull Vault"
                onAction={() =>
                  runGitAction({
                    title: "Failed to Pull Vault",
                    successTitle: "Vault Pulled",
                    args: ["pull"],
                    confirm: {
                      title: "Pull Vault?",
                      message: "Run git pull in the password store?",
                      actionTitle: "Pull Vault",
                    },
                  })
                }
              />
              <Action
                icon={Icon.Upload}
                title="Push Vault"
                onAction={() =>
                  runGitAction({
                    title: "Failed to Push Vault",
                    successTitle: "Vault Pushed",
                    args: ["push"],
                    confirm: {
                      title: "Push Vault?",
                      message: "Run git push in the password store?",
                      actionTitle: "Push Vault",
                    },
                  })
                }
              />
              <Action
                icon={Icon.Clock}
                title="Show Recent Log"
                onAction={() =>
                  runGitAction({
                    title: "Failed to Load Git Log",
                    successTitle: "Git Log Loaded",
                    args: ["log", "--oneline", "-20"],
                  })
                }
              />
            </>
          ) : null}
          <Action.CopyToClipboard title="Copy Status" content={status ?? ""} />
          {lastOutput ? (
            <Action.CopyToClipboard
              title="Copy Last Output"
              content={lastOutput}
            />
          ) : null}
          {lastError ? (
            <Action.CopyToClipboard
              title="Copy Last Error"
              content={lastError}
            />
          ) : null}
        </ActionPanel>
      }
    />
  );
}
