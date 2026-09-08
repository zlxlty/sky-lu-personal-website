import { describe, expect, it } from "vitest";
import {
  assertProductionCheckout,
  type ProductionCheckout,
} from "../../scripts/production-release";

const revision = "a".repeat(40);
const cleanMain: ProductionCheckout = {
  branch: "main",
  dirty: false,
  revision,
  remoteMain: revision,
};

describe("production release eligibility", () => {
  it("allows only a clean local main matching the published main revision", () => {
    expect(assertProductionCheckout(cleanMain)).toBe(revision);
    expect(() =>
      assertProductionCheckout({ ...cleanMain, branch: "codex/feat/homepage" }),
    ).toThrow("main branch");
    expect(() =>
      assertProductionCheckout({ ...cleanMain, branch: "" }),
    ).toThrow("main branch");
    expect(() =>
      assertProductionCheckout({ ...cleanMain, dirty: true }),
    ).toThrow("clean working tree");
    expect(() =>
      assertProductionCheckout({ ...cleanMain, remoteMain: "b".repeat(40) }),
    ).toThrow("current main");
    expect(() =>
      assertProductionCheckout({ ...cleanMain, revision: "", remoteMain: "" }),
    ).toThrow("current main");
  });

  it("allows detached CI only for the exact verified main commit", () => {
    const detached = {
      ...cleanMain,
      branch: "",
      ci: { ref: "refs/heads/main", revision },
    };
    expect(assertProductionCheckout(detached)).toBe(revision);
    expect(() =>
      assertProductionCheckout({
        ...detached,
        ci: { ref: "refs/pull/1/merge", revision },
      }),
    ).toThrow("exact main commit");
    expect(() =>
      assertProductionCheckout({
        ...detached,
        ci: { ref: "refs/heads/main", revision: "b".repeat(40) },
      }),
    ).toThrow("exact main commit");
    expect(() =>
      assertProductionCheckout({ ...detached, dirty: true }),
    ).toThrow("clean working tree");
    expect(() =>
      assertProductionCheckout({ ...detached, remoteMain: "b".repeat(40) }),
    ).toThrow("current main");
  });
});
