# lander

A 2D simulation game where you program rocket boosters to land.

[Play Now](https://lander.kurpuis.com)

![Mar-10-2023 07-06-40](https://raw.githubusercontent.com/imaustink/lander/refs/heads/main/gameplay.png)

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
npm start
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
