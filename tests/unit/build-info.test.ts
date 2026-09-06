import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("keeps one UTC build date throughout the module's lifetime", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-06T23:59:59Z"));
  vi.stubEnv("GITHUB_SHA", undefined);
  const { buildInfo } = await import("@/lib/build-info.server");
  expect(buildInfo).toEqual({
    dateTime: "2026-09-06",
    dateLabel: "Sep 6, 2026",
    revision: undefined,
  });

  vi.setSystemTime(new Date("2026-09-07T00:00:01Z"));
  expect((await import("@/lib/build-info.server")).buildInfo).toBe(buildInfo);
});

it.each([undefined, "", "not-a-commit", "1234567", "<script>invalid</script>"])(
  "omits absent or malformed build revisions (%j)",
  async (revision) => {
    vi.stubEnv("GITHUB_SHA", revision);
    const { buildInfo } = await import("@/lib/build-info.server");
    expect(buildInfo.revision).toBeUndefined();
  },
);

it("displays only the short public commit identifier supplied by CI", async () => {
  vi.stubEnv("GITHUB_SHA", "0123456789abcdef0123456789abcdef01234567");
  const { buildInfo } = await import("@/lib/build-info.server");
  expect(buildInfo.revision).toBe("0123456");
});
