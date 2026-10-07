# BoardBrain – Umsetzungsplan

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Reihenfolge, Zuschnitt der Story-Bündel, Modellwahl und Ablauf der Sitzungen mit Claude Code |
| Version | 0.2 |
| Stand | 07.10.2026 |
| Grundlage | BoardBrain_Spezifikation.md v0.5 (2.3), Entwicklungsrichtlinien.md v0.3 (2, 14), BoardBrain_Anforderungsdokumentation.md v0.11 (9.3, 13), BoardBrain_Architektur.md v0.6 (19) |
| Sprache | Deutsch |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 07.10.2026 | Erstfassung nach Abschluss des Setups: Reihenfolge, Zuschnitt von Inkrement I1, Modelle, Ablauf |
| 0.2 | 07.10.2026 | K-1 erledigt: Empfehlung, Dependabot-PR #3 (`@babel/core` 8) zu mergen |

## 1. Zweck

Dieses Dokument legt fest, **was als Nächstes kommt und wie**. Jede neue Sitzung mit Claude Code beginnt mit einem Auftrag, der auf diesen Plan verweist. Claude Code pflegt den Status im selben Pull Request, mit dem ein Bündel oder eine Aufgabe umgesetzt wird. Den Zuschnitt eines neuen Inkrements legt Claude Code dem Product Owner zu Beginn des Inkrements zur Freigabe vor (Spezifikation 2.3) und trägt ihn hier nach.

Rangfolge bei Widerspruch bleibt: Anforderungen > Spezifikation > Architektur > Richtlinien > dieser Plan.

## 2. Reihenfolge

| # | Schritt | Wann | Status |
|---|---|---|---|
| 0 | Kleine Aufgabe K-1: Dependabot-PR #3 (`@babel/core` 8) prüfen | als Erstes | erledigt: Empfehlung „mergen“ |
| 1 | Inkrement I1 Fundament: Bündel I1-A bis I1-D (Kapitel 5) | danach, in dieser Reihenfolge | offen |
| 2 | Design D-1: Farbwerte (OP-11) | parallel zu I1, spätestens vor der Abnahme von I1-C | offen |
| 3 | Inkrement I2 Generierung | nach I1 | offen |
| 4 | Entscheidung über Vorabversionen (OP-13) | nach I2 | offen |
| 5 | Inkrement I3 Ergebnisse und Statistik | nach I2 | offen |
| 6 | Inkrement I4 Daten und Updates | nach I3 | offen |
| 7 | Design D-2: Glücksrad, Aufblinken, Klänge (OP-06) | vor I5 | offen |
| 8 | Inkrement I5 Erlebnis und Ausbau (alle Should-Stories) | nach I4 | offen |
| 9 | Inkrement I6 Feinschliff (alle Could-Stories) | nach I5 | offen |
| 10 | Release 1.0 nach Richtlinien 3.8 mit manueller Abnahme (`docs/Abnahme-Checkliste.md`) | nach I6 | offen |

**Warum das Design nicht ganz vorn steht:** Der Code arbeitet mit Farbkennungen (etwa „rot“), die Farbwerte stehen nur in `src/ui/styles/tokens.css` und lassen sich jederzeit austauschen. OP-11 blockiert daher nichts. Die Inszenierung (OP-06) wird erst in I5 gebraucht.

Bis Release 1.0 bleibt `main` auf dem Platzhalter 0.1.0 (Spezifikation 2.3, EP-02); es gibt keine weiteren Releases, sofern OP-13 nichts anderes ergibt.

## 3. Modelle und Aufwand

Grundlage ist Anforderungsdokumentation 9.3. Modell und Aufwand stellt der Product Owner **zu Beginn der Sitzung** ein: das Modell mit `/model`, den Aufwand mit `/effort` (bzw. im Modellmenü, falls die Oberfläche ihn dort anbietet).

| Arbeit | Modell | Aufwand |
|---|---|---|
| Bündel mit kritischen Teilen: Zufall, Platzierung und Sackgassen, Service Worker und Updates, Importkonflikte, Datenbank und Migrationen | Opus 5.5 | high |
| Übrige Bündel (Oberflächen, Verwaltung, Statistik) | Sonnet 5.5 | medium |
| Kleine Aufgaben: Abhängigkeits-Updates, Fehlerbehebungen ohne kritischen Teil | Sonnet 5.5 | medium |
| Reine Dokumentationspflege | Sonnet 5.5 | low |
| Design (D-1, D-2), Zuschnitt eines neuen Inkrements | Opus 5.5 | medium |
| Code-Review, schwierige Fehler | Opus 5.5 | high |

**Wechselregel:** Liegt Sonnet zweimal hintereinander daneben (Tests scheitern wiederholt, Anforderung falsch verstanden), wechselt der Product Owner mit `/model` auf Opus und schreibt „mach weiter“. Der Arbeitsbranch bleibt erhalten.

## 4. Ablauf einer Sitzung

### 4.1 Bündel

1. **Product Owner:** neue Sitzung in VS Code beginnen (bzw. `/clear`), Modell und Aufwand nach Kapitel 5 (Bündel) bzw. 6 (kleine Aufgaben) einstellen, Auftrag senden:
   > Setze Bündel ‹ID› aus docs/Umsetzungsplan.md um.
2. **Claude Code:** liest diesen Plan, die genannten Stories und Kapitel. Antwortet mit einem **kurzen Umsetzungsplan**: Schritte, Tests je Abnahmekriterium, neue Pakete mit Version, Fragen zu Haltepunkten. Beginnt erst nach „los“.
3. **Claude Code:** Branch von aktuellem `develop` mit dem Namen aus Kapitel 5; umsetzen, testen, in Schritten committen; `npm run check`, `npm run test:e2e`, bei Zufall zusätzlich `npm run test:stat`; Status in Kapitel 2 und 5 auf „umgesetzt (#PR)“ setzen; Pull Request nach `develop` nach Vorlage.
4. **Claude Code:** startet den Entwicklungsserver frisch und nennt die Adressen (PC `https://localhost:5173/`, Mobilgeräte `https://192.168.178.20:5173/`) und die Testschritte je Gerät.
5. **Product Owner:** testet, meldet Fehler im Chat. Claude Code behebt sie im selben Branch.
6. **Product Owner:** Prüfungen grün → **Squash and merge** → schreibt „weiter“.
7. **Claude Code:** `git switch develop && git pull`, beendet den Entwicklungsserver, nennt das nächste Bündel mit Modell und Aufwand.
8. **Product Owner:** Sitzung beenden.

### 4.2 Kleine Aufgabe

Wie 4.1 mit dem Auftrag:

> Erledige Aufgabe ‹ID› aus docs/Umsetzungsplan.md.

Die Abnahme richtet sich nach Richtlinien 2.4.

### 4.3 Ende eines Inkrements

Nach dem Merge des letzten Bündels legt Claude Code in einer eigenen Sitzung (Opus, medium) den Zuschnitt des nächsten Inkrements vor: Bündel, Stories, Pakete, Modell, Branch-Namen. Nach Freigabe durch den Product Owner trägt es ihn per Pull Request `docs: Zuschnitt Inkrement ‹n›` hier ein. Auftrag:

> Schneide das nächste Inkrement aus docs/Umsetzungsplan.md zu.

## 5. Inkrement I1 Fundament

Ergebnis: Stammdaten anlegbar, Brett sichtbar (Spezifikation 2.3). Neue Pakete sind nur die hier genannten aus Architektur 3.1; ihre genaue Version prüft Claude Code zu Beginn des Bündels und nennt sie im Umsetzungsplan. Jedes andere Paket ist ein Haltepunkt.

| Bündel | Stories | Modell, Aufwand | Branch | Status |
|---|---|---|---|---|
| I1-A Zufall und Losbaustein | US-LS-01 | Opus, high | `feat/us-ls-01-random-draw` | offen |
| I1-B Personen, Spiele, Datenbank | US-PG-01, US-SP-02 | Opus, high | `feat/us-pg-01-persons-and-games` | offen |
| I1-C Gruppen und Farben | US-PG-02, US-PG-03 | Sonnet, medium | `feat/us-pg-02-groups-and-colors` | offen |
| I1-D Brett und Installation | US-PL-01 | Opus, high | `feat/us-pl-01-board-and-install` | offen |

### I1-A Zufall und Losbaustein

- **Inhalt:** Schnittstelle `RandomSource` und verzerrungsfreie Umrechnung (Architektur 6.1, 6.2) in `core/random`; echte Quelle über `crypto.getRandomValues` in `infra/random`; `SeededRandomSource` und `ScriptedRandomSource` nur für Tests; Losbaustein „Person losen“ in `core/draws`, unabhängig von Catan.
- **Nachweis:** Durchzählen aller Eingabewerte und Chi-Quadrat über mindestens 100.000 Ziehungen bei α = 0,001 (NFA-ZF-01 bis -03, Spezifikation 5); Eigenschaftstests mit festem Startwert.
- **Nicht enthalten:** Oberfläche. Der Baustein wird erst in I2 im Ablauf angezeigt.
- **Pakete:** keine.
- **Abnahme durch den Product Owner:** Pull Request lesen (Tabelle Abnahmekriterium → Test), Prüfung `stat` bzw. lokale Ausgabe von `npm run test:stat` ansehen.

### I1-B Personen, Spiele, Datenbank

- **Inhalt:** Datenbank mit Dexie in `infra/db` (Schema Version 1, Migrationsgerüst, Architektur 7), Repositories, Anwendungsdienste, Lesehooks; Kennungen über `crypto.randomUUID()` (NFA-DH-05); App-Grundgerüst mit Navigation (Diagnoseansicht bleibt erreichbar); Personenverwaltung (US-PG-01); Spieleverwaltung mit fest eingebautem Catan und eigenen Spielen (US-SP-02).
- **Hinweis:** US-SP-02 AK-3 (keine Catan-Felder bei der Ergebniserfassung) wird mit US-ER-01 in I3 nachgewiesen.
- **Pakete:** `dexie`, `dexie-react-hooks`, `valibot`, `fake-indexeddb` (nur Entwicklung).
- **Abnahme durch den Product Owner:** am PC und auf Galaxy S26 Personen und Spiele anlegen, Duplikat-Hinweise prüfen, Seite neu laden (Daten bleiben).

### I1-C Gruppen und Farben

- **Inhalt:** Gruppen mit 2 bis 12 Mitgliedern und Bindung (global oder ein Spiel), Namensvorschlag, Prüfung gleichnamiger Personen (US-PG-02, Spezifikation 3.4); Farbmodell mit Gruppen- und Catan-Farbe, automatische Vergabe und Farbtausch (US-PG-03, Spezifikation 3.3). Farbwerte bis D-1 als Platzhalter in `tokens.css`.
- **Pakete:** `zustand` nur, falls für Zustand der Oberfläche nötig (Architektur 3.1); sonst keine.
- **Abnahme durch den Product Owner:** Gruppen mit 2, 4 und 5 Mitgliedern anlegen, Catan-Bindung bei 5 Mitgliedern gesperrt, Farbtausch prüfen; Hoch- und Querformat auf S26 und iPad.

### I1-D Brett und Installation

- **Inhalt:** Brettmodell in `core/board` mit 19 Feldern, Kreuzungen, Kanten und Nachbarschaften (Architektur 5.2) als Grundlage für die Platzierung in I2; Darstellung des Bretts (US-PL-01); Manifest und minimaler Service Worker mit `vite-plugin-pwa` (`injectManifest`), damit die Installation unter Brave für Android früh geprüft wird (Architektur 11, 12.1, 18.1, 19); `docs/Abnahme-Checkliste.md` anlegen (Architektur 14.6).
- **Pakete:** `vite-plugin-pwa`.
- **Abnahme durch den Product Owner:** Brett in Hoch- und Querformat auf allen Geräten; App unter Brave (S26) und Safari (iPad) zum Startbildschirm hinzufügen und starten; Start im Flugmodus.

### D-1 Farbwerte (OP-11)

- **Auftrag:** „Erledige Design D-1 aus docs/Umsetzungsplan.md.“ (Opus, medium)
- **Inhalt:** Claude Code schlägt Catan-Farben, Gruppenfarben-Palette und Akzentfarben mit Kontrastwerten für den Dunkelmodus vor und zeigt sie als Vorschau; der Product Owner wählt. Ergebnis in `tokens.css`; OP-11 wird in Anforderungsdokumentation und Architektur als geklärt vermerkt (Haltepunkt: Änderung der Anforderungsdokumentation, durch den Auftrag freigegeben).
- **Branch:** `chore/op-11-color-values`.

## 6. Kleine Aufgaben

| ID | Aufgabe | Modell, Aufwand | Status |
|---|---|---|---|
| K-1 | Dependabot-PR #3 (`@babel/core` 7 → 8): prüfen, ob `babel-plugin-react-compiler` mit Babel 8 arbeitet (Bündel enthält `memo_cache_sentinel`, alle Prüfungen grün); dann Empfehlung „mergen“ oder „schließen und `@babel/core` in `dependabot.yml` auf Hauptversion 7 halten“ | Sonnet, medium | erledigt: Empfehlung „mergen“. Mit Babel 8.0.6 erzeugt der Build 8 Treffer für `memo_cache_sentinel`, genau wie mit Babel 7; `check` und `e2e` bestehen. Hinweis: `babel-plugin-react-compiler` 1.0.0 deklariert `@babel/types` ^7 als Abhängigkeit, arbeitet aber nachweislich mit Babel 8 |
| K-2 | Hohe `npm audit`-Meldungen in Entwicklungswerkzeugen (über `braces`, siehe PR #2) prüfen, sobald Dependabot oder neue Versionen eine Korrektur bieten | Sonnet, medium | offen |

Dependabot öffnet monatlich weitere Pull Requests nach `develop`. Für jeden gilt der Auftrag „Prüfe Dependabot-PR #‹Nummer›“ (Sonnet, medium); Hauptversionssprünge prüft Claude Code wie K-1.

## 7. Weitere Inkremente

Die Stories je Inkrement stehen in Spezifikation 2.5. Der Zuschnitt in Bündel folgt zu Beginn des jeweiligen Inkrements (4.3). Vorgaben schon jetzt:

| Inkrement | Kritische Teile (Opus, high) |
|---|---|
| I2 Generierung | Platzierung und Sackgassen (Architektur 5.3, 5.4), Ablauf und Wiederaufnahme der laufenden Partie |
| I3 Ergebnisse und Statistik | keine; Kennzahlen mit Eigenschaftstests |
| I4 Daten und Updates | Import mit Konflikten, Sicherungspunkte, Service Worker und Updates, Speicherschutz |
| I5 Erlebnis und Ausbau | Glücksrad mit Motion (nach D-2), Startrohstoffe (Zufall) |
| I6 Feinschliff | keine |
