import { formatContentDate } from "@/lib/content";

// Read once per build/dev module instance so pages share the same build date.
// GitHub supplies a public revision in CI; local/archive builds may omit it.
const builtAt = new Date();
const revision = process.env.GITHUB_SHA;

export const buildInfo = {
  dateTime: builtAt.toISOString().slice(0, 10),
  dateLabel: formatContentDate(builtAt),
  revision:
    revision && /^[a-f\d]{40}$/i.test(revision)
      ? revision.slice(0, 7)
      : undefined,
} as const;
