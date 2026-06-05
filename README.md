# Astro mit Bun

Astro-Anwendung mit **HTML** (`.astro`), **CSS** und **TypeScript** — Paketmanager und Runtime: [Bun](https://bun.sh).

## Voraussetzungen

- [Bun](https://bun.sh) ≥ 1.0

## Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `bun install` | Abhängigkeiten installieren |
| `bun run dev` | Dev-Server (Standard: http://localhost:4321) |
| `bun run build` | Statischen Build nach `dist/` |
| `bun run preview` | Build lokal ansehen |

## Struktur

```
src/
├── components/   # Header, Footer, …
├── layouts/      # Layout.astro (HTML-Gerüst)
├── pages/        # Routen
├── scripts/      # TypeScript (Browser)
└── styles/       # global.css
```

## Stack

- [Astro](https://astro.build) 6
- TypeScript (strict)
- Bun für Install & Scripts
