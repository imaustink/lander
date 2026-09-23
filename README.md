# lander

A 2D simulation game where you program rocket boosters to land.

[Play Now](https://lander.kurpuis.com)

![Mar-10-2023 07-06-40](https://raw.githubusercontent.com/imaustink/lander/refs/heads/main/img/gameplay.png)

## Levels

The game currently ships with **11 levels** (0–10), each introducing a new mechanic:

| # | Name | Focus |
|---|------|-------|
| 0 | Tutorial | Fly with your keyboard |
| 1 | Hello, Moon | Basic descent control |
| 2 | Tilted | Correcting starting angle |
| 3 | Steady the Ship | PD control for angle + descent |
| 4 | Lateral Drift | Cancelling horizontal velocity |
| 5 | Bullseye | Landing on a target pad |
| 6 | On a Budget | Limited fuel |
| 7 | Minimum Power | Bang-bang thrust (no throttle) |
| 8 | Precision Burn | Single, non-reignitable engine burn |
| 9 | The Long Fall | Precision burn from higher altitude |
| 10 | Hoverslam | Single-burn landing with upright touchdown constraint |

See [`app/src/levels.ts`](app/src/levels.ts) for the full level configs, starter code, and reference solutions.

## Getting Started

### Play Online

No install required — play instantly at **[lander.kurpuis.com](https://lander.kurpuis.com)**.

### Install via npm

Install globally and run:

```bash
npm install -g @k5s/lander
lander
```

This starts a local server on [http://localhost:3000](http://localhost:3000) and opens your browser automatically. Set a custom port with `PORT=8080 lander`.

### Run via npx (no install)

```bash
npx @k5s/lander
```

### Clone & Develop

```bash
git clone https://github.com/imaustink/lander.git
cd lander
npm install
npm run dev
```

Then navigate to [http://localhost:3000](http://localhost:3000).

### Docker

```bash
docker build -t lander .
docker run -p 3000:3000 lander
```

### Docker Compose

```bash
docker compose up
```

The app will be available at [http://localhost:3000](http://localhost:3000).
