# Project Structure

This repository contains a dependency-free static prototype for **NoLimit Coder AI**.

```text
.
├── README.md              # Setup, local model notes, and product explanation
├── index.html             # Main app markup and UI sections
├── package.json           # Local scripts for serving and checking the app
├── src/
│   ├── app.js             # Browser chat logic and Ollama API integration
│   └── styles.css         # Responsive visual design
└── docs/
    └── PROJECT_STRUCTURE.md
```

## How the app works

1. The user runs Ollama locally.
2. The user opens this static web app.
3. The app sends chat messages to the configured Ollama endpoint.
4. Ollama runs the selected coding model on the user's own machine.

This keeps the application free of hosted API keys, token credits, and subscription limits. Actual speed and capacity depend on the user's hardware and local model.

## Suggested next files

If you want to turn the prototype into a full Cursor-like coding product, add these next:

- `src/fileTree.js` for opening local project files through a backend or desktop shell.
- `src/editor.js` for Monaco/CodeMirror editor integration.
- `server/` for safe filesystem access, terminal execution, and project indexing.
- `docs/ROADMAP.md` for planned features such as multi-file edits, diff previews, and test execution.
