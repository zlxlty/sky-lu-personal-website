## Summary

<!-- Explain the user-visible outcome and the reason for the change. -->

## Architecture

<!-- Explain the Astro/React-island boundary, data flow, and any new dependency. -->

- [ ] Static content remains in Astro unless a client runtime is required.
- [ ] Client code is hydrated as narrowly and lazily as practical.
- [ ] No unplanned SSR, storage binding, analytics, or backend service was added.

## Verification

<!-- List the exact commands and manual checks that ran. Explain any omission. -->

- [ ] `pnpm verify` passes.
- [ ] `pnpm verify:full` passes for browser-facing changes, or is not applicable.
- [ ] Relevant light, dark, responsive, keyboard, and reduced-motion states were checked.
- [ ] The browser console has no unexpected errors or hydration warnings.

## Privacy and security

- [ ] The diff contains no raw email address, secret, token, private résumé data, or sensitive test artifact.
- [ ] Logs, fixtures, snapshots, metadata, and generated output contain no sensitive values.
- [ ] New environment variables are documented by name without committing real values.

## Visual evidence

<!-- Add before/after screenshots for visual changes. Remove this section if none. -->

## Documentation and delivery

- [ ] The closest developer, content, or deployment guide was updated when behavior or commands changed.
- [ ] The branch is ready to rebase onto `main` and contains no merge commit.
- [ ] Commits remain individually reviewable and were approved before creation.
