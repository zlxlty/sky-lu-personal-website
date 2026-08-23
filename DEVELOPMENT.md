# Development

This guide currently covers browser-test diagnostics. The remaining local setup,
workflow, and troubleshooting sections are added in Foundation Commit 01.7.

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
