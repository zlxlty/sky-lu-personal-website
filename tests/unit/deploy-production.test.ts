// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { exec, state } = vi.hoisted(() => ({
  exec: vi.fn<
    (file: string, args: readonly string[], options: unknown) => string
  >(),
  state: { remoteReads: 0, advanceMain: false, dirty: false },
}));
vi.mock("node:child_process", () => ({
  execFileSync: exec,
  default: { execFileSync: exec },
}));
const revision = "a".repeat(40);
const pnpmCalls = () =>
  exec.mock.calls.filter(([file]) => file === "pnpm").map(([, args]) => args);

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("GITHUB_ACTIONS", "false");
  vi.stubEnv("GITHUB_SHA", "");
  vi.stubEnv("GITHUB_REF", "");
  state.remoteReads = 0;
  state.advanceMain = false;
  state.dirty = false;
  exec.mockReset();
  exec.mockImplementation((file, args) => {
    if (file === "pnpm") return "";
    if (file !== "git") throw new Error("Unexpected process in release test");
    switch (args[0]) {
      case "branch":
        return process.env.GITHUB_ACTIONS === "true" ? "" : "main";
      case "status":
        return state.dirty ? "?? unreviewed.txt" : "";
      case "rev-parse":
        return revision;
      case "ls-remote": {
        state.remoteReads++;
        const sha =
          state.advanceMain && state.remoteReads > 1
            ? "b".repeat(40)
            : revision;
        return `${sha}\trefs/heads/main`;
      }
      default:
        throw new Error("Unexpected git operation in release test");
    }
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("production release orchestration without remote side effects", () => {
  it("verifies locally, builds the identified revision, then deploys and checks", async () => {
    await import("../../scripts/deploy-production");
    expect(state.remoteReads).toBe(2);
    expect(pnpmCalls()).toEqual([
      ["verify:full"],
      ["build"],
      [
        "exec",
        "wrangler",
        "deploy",
        "--config",
        "wrangler.jsonc",
        "--env",
        "production",
      ],
      ["cf:check", "https://skylu.me"],
    ]);
    expect(
      exec.mock.calls.find(([, args]) => args[0] === "build")?.[2],
    ).toMatchObject({
      env: { GITHUB_SHA: revision },
    });
  });

  it("uses the verified CI commit without repeating its required jobs", async () => {
    vi.stubEnv("GITHUB_ACTIONS", "true");
    vi.stubEnv("GITHUB_REF", "refs/heads/main");
    vi.stubEnv("GITHUB_SHA", revision);
    await import("../../scripts/deploy-production");
    expect(pnpmCalls()[0]).toEqual(["build"]);
    expect(pnpmCalls()).toHaveLength(3);
  });

  it("does not upload when main advances during the build", async () => {
    state.advanceMain = true;
    await expect(import("../../scripts/deploy-production")).rejects.toThrow(
      "current main",
    );
    expect(pnpmCalls()).toEqual([["verify:full"], ["build"]]);
  });

  it("does not even build when the working tree has unreviewed files", async () => {
    state.dirty = true;
    await expect(import("../../scripts/deploy-production")).rejects.toThrow(
      "clean working tree",
    );
    expect(pnpmCalls()).toEqual([]);
  });
});
