export interface ProductionCheckout {
  branch: string;
  dirty: boolean;
  revision: string;
  remoteMain: string;
  ci?: { ref: string; revision: string };
}

/** Catch wrong-branch, uncommitted, and superseded releases before uploading. */
export function assertProductionCheckout(checkout: ProductionCheckout): string {
  const { branch, dirty, revision, remoteMain, ci } = checkout;
  if (!/^[a-f\d]{40}$/i.test(revision) || revision !== remoteMain) {
    throw new Error("Production must match the current main commit on origin.");
  }
  if (dirty) {
    throw new Error(
      "Production requires a clean working tree, including untracked files.",
    );
  }
  if (ci) {
    if (ci.ref !== "refs/heads/main" || ci.revision !== revision) {
      throw new Error(
        "Production CI must deploy the exact main commit that was checked.",
      );
    }
  } else if (branch !== "main") {
    throw new Error(
      "Production requires the main branch; feature branches can deploy previews.",
    );
  }
  return revision;
}
