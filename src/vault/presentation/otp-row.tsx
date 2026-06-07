import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import {
  generateOtp,
  type OtpResult,
} from "../../rpass/application/rpass-client";
import { copyPassword, pastePassword } from "./clipboard";

interface Props {
  entry: string;
  storepath: string;
}

function urgencyColor(remaining: number, period: number): Color {
  const ratio = remaining / period;
  if (ratio > 0.5) return Color.Green;
  if (ratio > 0.25) return Color.Orange;
  return Color.Red;
}

function formatCountdown(seconds: number): string {
  return `${seconds}s`;
}

export default function OtpRow({ entry, storepath }: Props) {
  const [result, setResult] = useState<OtpResult | null>(null);
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchOtp() {
    try {
      const data = await generateOtp(entry, storepath);
      setResult(data);
      setRemaining(data.remaining_seconds);
    } catch {
      showToast(Toast.Style.Failure, "Failed to generate TOTP");
    }
  }

  useEffect(() => {
    fetchOtp();
  }, [entry]);

  useEffect(() => {
    if (!result) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          fetchOtp();
          return result.period;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [result]);

  const code = result?.code ?? "------";
  const period = result?.period ?? 30;
  const color = urgencyColor(remaining, period);

  return (
    <List.Item
      icon={{ source: Icon.Clock }}
      title="TOTP"
      accessories={[
        {
          text: { value: code, color: Color.PrimaryText },
        },
        {
          tag: { value: formatCountdown(remaining), color },
          tooltip: `Refreshes in ${remaining}s`,
        },
      ]}
      actions={
        <ActionPanel>
          <Action
            title="Copy TOTP to Clipboard"
            onAction={() => copyPassword(code)}
          />
          <Action
            title="Paste TOTP in Active App"
            onAction={() => pastePassword(code)}
          />
          <Action
            title="Refresh TOTP"
            icon={Icon.RotateClockwise}
            onAction={fetchOtp}
          />
        </ActionPanel>
      }
    />
  );
}
