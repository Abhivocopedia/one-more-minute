# ONE MORE MINUTE

> Every second you take leaves something behind.

A browser-first, first-person psychological thriller set in Greyhaven — a coastal city caught at 11:59 PM.

## Current playable foundation

- Cinematic title screen and in-game HUD
- Real-time 3D rainy street environment
- First-person WASD movement, mouse look and sprint
- Interactable payphone and the first Mira transmission
- Chrono-60 transform-history prototype with interpolation and timeline branching
- GitHub Pages deployment workflow

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run typecheck
npm run build
npm run preview
```

## GitHub Pages

1. Pushes to `main` trigger the deployment workflow.
2. In **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**.
3. After a successful workflow, the game will be available at:

   https://abhivocopedia.github.io/one-more-minute/

Vite uses the repository base path for production builds.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Mouse | Look |
| Shift | Sprint |
| E | Answer the payphone (when nearby) |
| Q (hold) | Rewind the recorded bottle movement |
| Esc | Pause |

## Development note

The current temporal recorder tracks transforms for a single demonstration object. The next step is a central temporal manager that records complete object and puzzle state for multiple registered entities.
