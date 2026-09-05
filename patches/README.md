# Dependency patches

pnpm applies the patches registered in `pnpm-workspace.yaml` and records their
hashes in `pnpm-lock.yaml`. They are reviewed source changes, not edits to the
shared package store. Keep dependency versions, patch files, and the lockfile in
agreement when updating them.

## simple-git-hooks 2.13.1

The upstream installer assumes `<project>/.git/hooks` when there is no repository
hook-path override. That fails in linked worktrees because `.git` is a file. It
also reads only local configuration, so global and worktree-scoped hook paths
are missed. The CLI logs installation errors but exits successfully.

The patch makes two changes:

- Resolve the effective directory with Git's `rev-parse --git-path hooks`, using
  absolute-path output. Git owns worktree layout and hook-path precedence.
- Report an installation failure on stderr and exit with status 1.

The project's `preserveUnused: true` setting separately prevents installation
from removing hooks it does not manage. The package version and generated
pre-commit command are unchanged. Installation still skips source archives without
Git metadata and honors the package's existing install opt-out.

`tests/unit/git-hooks.test.ts` runs the installed CLI in disposable local clones
and linked worktrees, then invokes the generated hook through Git. Fixtures
isolate Git configuration, need no remote access, and never create commits.

Before replacing or removing the patch, run:

```bash
pnpm test tests/unit/git-hooks.test.ts
pnpm install --frozen-lockfile
pnpm verify
```

Use pnpm's [patch workflow](https://pnpm.io/cli/patch) for any adjustment. Remove
the patch only when the installed upstream release passes these regressions
without it. Upstream tracks the path problems in
[PR 149](https://github.com/toplenboren/simple-git-hooks/pull/149) and
[issue 150](https://github.com/toplenboren/simple-git-hooks/issues/150).
