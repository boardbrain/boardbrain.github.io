# Finale Referenzen (docs/design)

Je Bildschirm gilt nur die **jüngste** Referenz. Ältere Dateien zeigen den Stand ihres Bündels und bleiben als Verlauf erhalten; sie werden nicht nachgezogen (K-18, Richtlinien 2.5). Weicht die App nach der Abnahme bewusst ab, wird die gültige Referenz im selben PR angepasst.

## Gültige Referenz je Bildschirm

| Bildschirm / Thema | Gültige Referenz |
|---|---|
| Start (Was willst du ansehen?), Navigation | `i3c-result-list-final-preview.html` (Start); Kartenhand: `k3-card-hand-final-preview.html`; Aufbau Navigation: `d3-start-navigation-final-preview.html` |
| Spielliste, Spielwahl, Tisch, Optionen, Farben | `i3c-result-list-final-preview.html` |
| Losschritte, Reihenfolge, Platzierung, Startrohstoffe | `i3c-result-list-final-preview.html` |
| Laufende Partie (Übersicht, Brett, Steine antippen, Uhr in der Zeile) | `i3c-result-list-final-preview.html` |
| Uhr-Blatt (Verlauf der Uhr) | `i3b-clock-final-preview.html` |
| Ergebnis eintragen, Ergebnisliste, Detail, Korrektur, Tischseite | `i3c-result-list-final-preview.html` |
| Verwaltung: Spiele, Personen, Tische (Übersicht) | `i3c-result-list-final-preview.html` |
| Personen- und Tischdetail | `i1e-persons-tables-final-preview.html` |
| Personenkarten | `i1e-person-cards-final-preview.html` |
| Personenfarben (Palette, Namen) | `e50-person-colors-final-preview.html` |
| Bearbeiten (Umbenennen, Spielseite) | `i1f-edit-final-preview.html` |
| Brett, App-Symbol | `i1d-board-final-preview.html` |
| Aufblinken und Spannung | `d2-staging-final-preview.html` |
| Bewegungen der Karten | `i2e-card-moves-final-preview.html` |
| Druckzustand | `k4-touch-final-preview.html` |
| Fehlerbildschirm | `k5-error-screen-final-preview.html` |

## Ersetzt (nur Verlauf, nicht mehr gültig)

| Datei | Ersetzt durch |
|---|---|
| `i2-match-final-preview.html` (Neue Partie) | `i3c-result-list-final-preview.html` |
| `i2d-running-match-final-preview.html` (Laufende Partie) | `i3c-result-list-final-preview.html` |
| `i2g-more-room-final-preview.html` (Mehr Platz) | `i3c-result-list-final-preview.html` |
| `i2h-tap-pieces-final-preview.html` (Steine antippen) | `i3c-result-list-final-preview.html` |
| `i3b-result-entry-final-preview.html` (Spielliste, Ergebnis eintragen; Uhr oben rechts, Spieldauer in Minuten) | `i3c-result-list-final-preview.html`, Uhr-Blatt: `i3b-clock-final-preview.html` |

## Stand der Prüfung (K-18, 23.11.2026)

- Die gültigen Referenzen zeigen die Personenfarben nach E-50 (Lila `#9873e8`, Pink `#f77de2`, Rosa `#fbb1c6`) und die Farbnamen der App (Grün, Türkis, Braun, Grau, Lila, Pink, Rosa). Vorher hatten `i3c`, `i1e-persons-tables`, `i1f-edit`, `d3-start-navigation` und `i3b-clock` noch die alten Werte.
- `i3c-result-list-final-preview.html` zeigt die Uhr der laufenden Partie wie die App: in einer Zeile mit „Partie beenden ohne Ergebnis“, Zeit mit kleinen Sekunden.
