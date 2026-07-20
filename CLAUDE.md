# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Full project reference — commands, architecture, API layer, stores, conventions, env vars:

@AGENTS.md

## Claude-specific notes

- Use **Bun** for everything (`bun install`, `bun run <script>`) — never npm or yarn.
- "Done" means `bun run typecheck` and `bun run lint` both pass. Don't run the full test suite unless asked.
- `tsc --noEmit` reports one pre-existing error inside `node_modules/react-native-screen-transitions` — ignore it; only errors in project files count.
- PRs target `develop`, not `main`. Commits follow conventional commits (`feat:`, `fix:`, optional scope like `feat(miriam):`).
- Before any UI or design work, read `DESIGN.md` — the design system is strict (e.g. error states use coral red `#ff2b3a`, never orange; SF Mono + `tabular-nums` for money; no cartoon/mascot styling).
- Reanimated shared values are intentionally omitted from hook dependency arrays throughout the codebase — don't "fix" those `react-hooks/exhaustive-deps` warnings.
