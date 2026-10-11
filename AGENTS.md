## Efficient Codebase Inspection

When working in this repository, prioritize native Codex workspace tools for reading and searching source code.

1. Read files directly using available workspace/file-reading tools instead of launching PowerShell commands solely to inspect source files.
2. Use workspace search to locate files, symbols, and references before opening relevant files.
3. Read relevant files once and reuse the retrieved context instead of repeatedly requesting the same line ranges.
4. When investigating a component, inspect the relevant component and its dependencies in a small number of operations.
5. Avoid repeated shell invocations for individual files or small line ranges.
6. Use the terminal for tasks that genuinely require command execution, such as running tests, building the project, installing dependencies, or inspecting Git state.
7. If native file-reading tools are unavailable, batch necessary shell operations into as few commands as practical.
8. Never skip necessary code inspection or verification merely to reduce tool calls.

Optimize for fast context gathering, minimal redundant operations, and accurate code changes.