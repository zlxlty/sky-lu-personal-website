# Development

This guide currently covers local editor and commit checks plus browser-test
diagnostics. The remaining setup, workflow, and troubleshooting sections are added
in Foundation Commit 01.7.

## Editor setup

The repository includes optional VS Code recommendations for Astro, ESLint,
Prettier, Tailwind CSS, MDX, and Playwright. Install them from the workspace's
**Recommended Extensions** view. The settings use the repository's TypeScript and
formatter versions, but leave format-on-save disabled so opening the project cannot
rewrite a file unexpectedly.

Editor feedback is advisory. The `pnpm` commands remain authoritative and work in
any editor.

## Pre-commit checks

`pnpm install` runs the root `prepare` script, which installs a local Git pre-commit
hook through `simple-git-hooks`. The hook runs `lint-staged` against files already
staged for the proposed commit:

- Prettier checks supported source, content, configuration, and documentation.
- ESLint checks staged Astro, JavaScript, and TypeScript source.

Both tasks are check-only: they do not format, fix, or intentionally stage files.
If either task fails, the commit stops. Fix the reported file, run the relevant
repository command, review the new diff, and ask for commit approval again before
staging it.

Useful commands are:

```bash
pnpm format
pnpm lint:fix
pnpm format:check
pnpm lint
```

The first two commands write changes, so always inspect their diff. The latter two
only check. The hook is fast feedback, not a replacement for `pnpm verify`, CI, or
the repository's approval gate. Do not bypass it with `--no-verify` unless a
documented emergency has been explicitly approved.

If a fresh install did not activate the hook, run:

```bash
pnpm run prepare
```

Then confirm that `.git/hooks/pre-commit` exists. A GUI Git client launched outside
your shell may also need the pinned Node and pnpm binaries on its `PATH`.

## Diagnose a Playwright failure from CI

Playwright records a trace for each failed browser-test attempt. A trace includes
the action timeline, DOM snapshots, screenshots, network activity, browser console
messages, timing, and the element resolved by each locator. Treat it as a debugging
artifact rather than a test report: the failed assertion and its surrounding state
remain the source of truth.

The repository configures this behavior in `playwright.config.ts`:

- `trace: "retain-on-failure"` records each attempt but retains only failed traces.
- `screenshot: "only-on-failure"` retains a screenshot for each failed attempt.
- `preserveOutput: "failures-only"` removes output for passing tests.
- CI retries a failing test twice. If all attempts fail, each failed attempt can
  have its own result directory and `trace.zip`.

The `Browser` GitHub Actions job uploads `test-results/` only when that job ends in
failure. A test that fails once and then passes on retry is reported as flaky, but
the job succeeds and does not upload an artifact under this failure-only policy.

### Download a trace from GitHub Actions

In the GitHub web interface:

1. Open **Actions**, select the failed **CI** workflow run, and open the **Browser**
   job.
2. Read **Run browser verification** first. It identifies the failing test and
   assertion.
3. Return to the workflow-run summary and find **Artifacts**.
4. Download `playwright-failure-N`, where `N` is the workflow run-attempt number.
5. Extract the archive. Find the `trace.zip` inside the directory for the failed
   test attempt.

The same artifact can be downloaded with the authenticated GitHub CLI. Replace the
example run ID with the numeric ID shown in the workflow-run URL:

```bash
run_id=1234567890
mkdir -p "test-results/ci-$run_id"
gh run download "$run_id" --dir "test-results/ci-$run_id"
find "test-results/ci-$run_id" -name trace.zip -print
```

`test-results/` is ignored by Git, so downloaded traces cannot be committed
accidentally through the normal `git add .` workflow.

### Open the trace

Use the repository-pinned Playwright version to open a downloaded trace:

```bash
pnpm exec playwright show-trace path/to/trace.zip
```

The viewer runs locally and provides these useful panels:

- **Actions**: inspect the locator, parameters, wait time, and error for each step.
- **Snapshots**: inspect the DOM before and after an action and use the snapshot
  developer tools to examine the resolved element.
- **Network**: look for failed, blocked, slow, or unexpected requests.
- **Console**: look for hydration errors, uncaught exceptions, and browser warnings.
- **Source**: correlate the selected action with the exact test line.

A practical diagnosis order is:

1. Select the failed assertion or the action immediately before it.
2. Compare its before/after DOM snapshots.
3. Confirm that the locator resolved to the intended element.
4. Inspect the action log for auto-waiting or actionability failures.
5. Check console and network panels for an earlier application failure.
6. Reproduce locally with the same browser project:

   ```bash
   pnpm exec playwright test --project=chromium --debug
   ```

7. After making a fix, run `pnpm test:e2e`, then `pnpm verify:full` before proposing
   the commit.

As an alternative, open [trace.playwright.dev](https://trace.playwright.dev/) and
drag `trace.zip` into the page. The official viewer processes the trace locally in
the browser. Prefer the pinned CLI command when investigating version-specific
behavior.

### GitLab CI equivalent

This repository currently uses GitHub Actions. If it is mirrored or migrated to
GitLab CI, preserve the same failure-only behavior with a job artifact:

```yaml
browser:
  stage: test
  image: mcr.microsoft.com/playwright:v1.62.1-noble
  script:
    - corepack enable
    - pnpm install --frozen-lockfile
    - pnpm test:e2e
  artifacts:
    when: on_failure
    expire_in: 7 days
    paths:
      - test-results/
```

Keep the Docker image version synchronized with `@playwright/test` in
`pnpm-lock.yaml`. After a failure, download the artifact from the GitLab job's
**Job artifacts** section, extract it, and use the same `show-trace` command above.

Use `artifacts: when: always` instead if passing and flaky jobs must also publish
their retained outputs. That increases storage use and is not this repository's
default policy.

### Trace privacy

Traces can contain rendered page text, requested URLs, network metadata, request or
response content, and console messages. Never print secrets, contact-form values,
email addresses, or authorization tokens from application code or tests. Keep CI
artifacts access-controlled, retain them only as long as needed, and do not attach a
trace to a public issue without inspecting it first.

Further reading:

- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Playwright continuous integration](https://playwright.dev/docs/ci)
- [GitHub workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data)
- [GitLab job artifacts](https://docs.gitlab.com/ci/jobs/job_artifacts/)
