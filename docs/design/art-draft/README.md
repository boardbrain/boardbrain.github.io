# Entwurf neuer Grafiken (noch nicht eingebaut)

Stand 17.11.2026. Ergebnis der Grafik-Runde aus der erweiterten Codeanalyse durch Fable (Claude Fable 5.2); Bericht, Entscheidungen und offene Fragen in `docs/test-reports/analyse/2026-11-16-grafiken.md`.

Die App verwendet weiter die bisherigen Bilder aus `scripts/art` und `public/art` (ADR-030). Dieser Ordner bewahrt den Entwurf auf, bis der Product Owner den Einbau freigibt (Umsetzungsplan, kleine Aufgabe K-17).

## Inhalt

| Pfad | Inhalt |
|---|---|
| `images/card-wood.webp`, `card-brick.webp`, `card-wool.webp`, `card-grain.webp`, `card-ore.webp` | die fünf Rohstoffkarten in der gewählten Richtung „V3 gemalt mit dünner Kontur, Rand R2 weicher Lichthof“, zweite Fassung nach der Rückmeldung des Product Owners, 1200 × 1800 px |
| `images/landscape.webp` | neues Catan-Vorschaubild der Spielauswahl (bisher `landscape.svg`), Abnahme offen |
| `src/` | der Generator, aus dem die Bilder entstehen |

## Bilder neu erzeugen

Der Generator ist reines JavaScript ohne eigene Pakete. Er nutzt Playwright aus den vorhandenen Entwicklungsabhängigkeiten, liest die Farben aus `src/ui/styles/tokens.css` und schreibt nach `previews/art/` (nicht im Repository).

```text
node docs/design/art-draft/src/build.mjs -                     alle Bilder
node docs/design/art-draft/src/build.mjs - wood brick           nur einzelne (wood, wood-all, brick, wool, grain, ore, cover)
node docs/design/art-draft/src/build.mjs previews/check wool     zusätzlich PNG und SVG zum Prüfen nach previews/check
node docs/design/art-draft/src/sheet.mjs                        Vergleichsbild alt und neu der Rohstoffkarten
node docs/design/art-draft/src/cover-sheet.mjs                  Vergleichsbild alt und neu des Vorschaubilds
```

Alle Formen entstehen aus einem Zufallsgenerator mit festem Startwert (`makeRng` in `lib.mjs`); dieselbe Quelle ergibt immer dasselbe Bild. Die großen Vergleichsbilder und die verworfenen Varianten liegen deshalb nicht im Repository.

**Hinweis:** `lib.mjs` setzt den Projektordner fest auf `C:/dev/boardbrain` (`ROOT`). Auf einem anderen Rechner diesen Wert anpassen.

## Beim Einbau (K-17)

- Generator nach `scripts/art` übernehmen, `npm run art` ruft ihn auf; ADR-030 ergänzen (Bericht, Frage F-7).
- `ROOT` aus dem Speicherort der Datei ableiten statt fest setzen; Code-Regeln aus `CLAUDE.md` anwenden (ESLint, Prettier).
- Farben als benannte Tokens je Rohstoff statt der durchnummerierten `--color-art-*` (Bericht, W-1).
- WebP-Qualität so wählen, dass die fünf Karten zusammen unter 1 MB bleiben (Bericht, Frage F-6).
- Vorher die Abnahme der Karten und des Vorschaubilds durch den Product Owner (Bericht, Fragen F-6 bis F-8) und die übrigen Grafiken der Partie (Bericht, Kapitel 5.4).
