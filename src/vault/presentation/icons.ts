import { Icon } from "@raycast/api";

const ENTRY_ICON_MAP: Record<string, Icon> = {
  "cards/": Icon.CreditCard,
  "dev/": Icon.Terminal,
  "finance/": Icon.Coins,
  "games/": Icon.GameController,
  "mails/": Icon.Envelope,
  "personal/": Icon.Person,
  "security/": Icon.Fingerprint,
  "shops/": Icon.Gift,
  "social/": Icon.TwoPeople,
  "ssh/": Icon.Terminal,
  "vpn/": Icon.Network,
};

const OPTION_ICON_MAP: Record<string, Icon> = {
  pass: Icon.Key,
  password: Icon.Key,
  otp: Icon.Hourglass,
  otpauth: Icon.Hourglass,
  email: Icon.Envelope,
  username: Icon.Person,
  user: Icon.Person,
  login: Icon.Person,
  url: Icon.Link,
  number: Icon.CreditCard,
  brand: Icon.CreditCard,
  "cardholder name": Icon.Person,
  expiration: Icon.Calendar,
  "security code": Icon.Code,
};

export function getEntryIcon(text: string): Icon {
  const normalized = text.toLowerCase();
  const prefix = Object.keys(ENTRY_ICON_MAP).find((key) =>
    normalized.startsWith(key),
  );
  return prefix ? ENTRY_ICON_MAP[prefix] : Icon.Lock;
}

export function getOptionIcon(text: string): Icon {
  return OPTION_ICON_MAP[text.toLowerCase()] || Icon.Minus;
}
