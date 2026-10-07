# BoardBrain – Architektur

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Architektur und Technologieentscheidungen |
| Version | 0.4 |
| Status | Final – freigegeben für die Durchführung des Setups und die Umsetzung |
| Stand | 06.10.2026 |
| Grundlage | BoardBrain_Anforderungsdokumentation.md v0.8, BoardBrain_Spezifikation.md v0.5 |
| Sprache | Deutsch |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 06.10.2026 | Erstfassung nach Klärung von OP-01, OP-02, OP-09 und der Übergabepunkte aus Kapitel 8 der Spezifikation v0.3 |
| 0.2 | 06.10.2026 | Ergebnisse der Setup-Planung: ADR-022 angenommen (`https://boardbrain.github.io/`); neue ADR-023 (Branch- und Release-Modell), ADR-024 (Prettier), ADR-025 (Fehlerbehandlung); Stack um Formatierer, Prüfwerkzeuge und Node.js-Version ergänzt (3.1); Modul `core/shared` (4.3); Fehlerbehandlung (neu 4.6); Content-Security-Policy als Meta-Tag (12.4); Diagnoseansicht (13.1); CSS-Animationen verboten (13.6); Teststrategie präzisiert (14.1, 14.5, 14.6); Ordnerstruktur vervollständigt (15); Kapitel 16 neu gefasst (Werkzeuge, Befehle, Branches und Auslieferung, `CLAUDE.md`, Claude Code, lokales HTTPS); Risiken und offene Punkte aktualisiert (18); nächste Schritte (19) |
| 0.3 | 06.10.2026 | Lizenz in der Ordnerstruktur auf PolyForm Strict License 1.0.0 geändert (15; Anforderungsdokumentation E-23) (PR #1) |
| 0.4 | 07.10.2026 | Ergebnisse des Setups: Node.js 26 statt 24 (3.1, 16.1); TypeScript 6, React Compiler über `@rolldown/plugin-babel` (3.1); ESLint 10 ohne `eslint-plugin-react`, Ersatzregeln über `no-restricted-syntax` (neu ADR-026; 3.1, 13.3, 14.7, ADR-018); Markdown von Prettier ausgenommen (3.1); Ende-zu-Ende-Tests lokal über HTTPS mit ignorierten Zertifikatsfehlern (14.5); `tsconfig.node.json` (15); Berechtigungen für PowerShell und keine Hinweise auf Claude in Commits und Pull Requests (16.5); Zertifizierungsstelle nicht auf dem iPhone (16.6); Code durchgehend englisch, auch Kommentare und Testnamen (neu ADR-027; 4.5, 16.4, ADR-008) (PR #2) |

## Inhaltsverzeichnis

1. Einleitung
2. Systemkontext und Rahmen
3. Technologie-Stack
4. Gesamtarchitektur und Modulschnitt
5. Spielmodule, Regeln und Generierung
6. Zufall
7. Datenmodell und Speicher
8. Exportformat, Vollsicherung und Import
9. Sicherungspunkte
10. Persistenz der laufenden Partie
11. Update-Mechanismus
12. Plattformdienste
13. Oberfläche
14. Teststrategie
15. Projekt- und Ordnerstruktur
16. Entwicklung, Build und Auslieferung
17. Architekturentscheidungen (ADR)
18. Risiken und offene Punkte
19. Nächste Schritte

---

## 1. Einleitung

### 1.1 Zweck

Dieses Dokument beschreibt, *wie* BoardBrain technisch umgesetzt wird. Die Anforderungsdokumentation legt fest, *was* die App leisten muss, die Spezifikation, *woran* die Erfüllung erkannt wird. Bei Widersprüchen gehen Anforderungen und Spezifikation vor; Widersprüche werden in allen betroffenen Dokumenten bereinigt.

Codebeispiele sind Skizzen zur Veranschaulichung, kein Produktivcode.

### 1.2 Architekturtreiber

Die folgenden Anforderungen prägen die Architektur am stärksten:

| Treiber | Herkunft | Architekturfolge |
|---|---|---|
| Fairness des Zufalls | NFA-ZF-01 bis -03, Z-02 | Eine einzige, austauschbare Zufallsquelle; verzerrungsfreie Umrechnung mit exaktem Nachweis (Kapitel 6) |
| Keine Kosten, kein Server, offline | RB-01, RB-02, NFA-PL-03 | PWA mit statischen Dateien; alle Daten lokal (Kapitel 3, 7) |
| Datensicherheit ohne Server | FA-DS-*, FA-EI-*, NFA-DH-04 | Versioniertes Exportformat, Sicherungspunkte im selben Format, Transaktionen (Kapitel 8, 9) |
| Laufende Partie übersteht alles | FA-AB-07, US-AB-05 | Schrittergebnis wird vor der Animation gespeichert (Kapitel 10) |
| Update nur auf Wunsch | FA-UP-02, FA-UP-03 | Eigene, kontrollierte Umschaltung im Service Worker (Kapitel 11) |
| Erweiterbarkeit | NFA-EW-01 bis -08 | Spiele als Module, Regeln als Bausteine, framework-freie Fachlogik (Kapitel 4, 5) |
| Wartbarkeit durch den Product Owner | RB-04 | Klare Schichten, strenge Typen, Lint-Regeln für Projektregeln, wenige Abhängigkeiten |
| Inszenierung | Z-03, FA-IN-* | Animationen getrennt von der Ergebnisermittlung (Kapitel 13) |

### 1.3 Begriffe

Fachbegriffe folgen dem Glossar der Anforderungsdokumentation. Bezeichner im Code sind englisch (ADR-008); die Zuordnung steht in Kapitel 4.5.

---

## 2. Systemkontext und Rahmen

### 2.1 Systemkontext

```
                 ┌───────────────────────────── Gerät der Nutzer ─────────────────────────────┐
                 │                                                                            │
 Bedienende  ───►│  BoardBrain (installierte PWA im Browser)                                   │
 Person          │   ├─ App-Code aus dem Cache des Service Workers                             │
                 │   ├─ IndexedDB: Nutzerdaten, Sicherungspunkte, laufende Partie              │
                 │   └─ Zufallsgenerator des Browsers (crypto.getRandomValues)                │
                 │                                                                            │
                 └──────▲───────────────────────────────────────────────┬─────────────────────┘
                        │ nur App-Dateien (Installation, Updates)        │ Exportdatei (JSON)
                        │                                                ▼
              ┌─────────┴──────────┐                          Teilen-Menü / Download
              │ GitHub Pages       │                          (Messenger, Mail, AirDrop, Dateien)
              │ statische Dateien  │                                   │
              └────────────────────┘                                   ▼
                                                              anderes Gerät: Import
```

Es gibt genau zwei Wege, auf denen Daten das Gerät berühren: App-Dateien kommen von GitHub Pages herein, Nutzerdaten gehen nur als vom Nutzer ausgelöste Exportdatei hinaus (NFA-DH-01, NFA-DH-02).

### 2.2 Rahmenbedingungen mit Architekturfolgen

| Rahmen | Folge |
|---|---|
| RB-01, RB-02: keine Kosten, kein Server | Auslieferung als statische Dateien über GitHub Pages; keine Laufzeitdienste Dritter |
| RB-03: Entwicklung unter Windows | Werkzeuge laufen unter Windows (Node.js, npm, Vite, Playwright, mkcert) |
| RB-04: Code überwiegend von Claude, Pflege durch den Product Owner | Strenge Typisierung, kleine Module, Lint-Regeln statt Konventionen, `CLAUDE.md` mit Projektregeln |
| E-06: öffentlicher Quellcode | Keine Geheimnisse im Repository; es gibt auch keine |
| NFA-PL-01: Android, iOS, iPadOS, Windows | Abnahme mit Brave (Android, Windows) und Safari (iOS, iPadOS) |

### 2.3 Plattformbesonderheiten

| Plattform | Besonderheit | Umgang |
|---|---|---|
| iOS, iPadOS | Installierte Web-App und Safari-Tab haben getrennte Speicher; Entfernen des Symbols löscht die Daten | Nutzung nur installiert (ADR-016) |
| iOS, iPadOS | Installation nur über Safari („Teilen“ → „Zum Home-Bildschirm“); Brave für iOS kann keine Web-Apps installieren | Installationsanleitung in der App |
| iOS, iPadOS | Ton erfordert eine Nutzeraktion; Stummschalter wirkt je nach Audio-Session | Audio-Session „ambient“, Freischaltung beim Start der Generierung (ADR-017) |
| Android (Brave) | Installation als Verknüpfung statt als vollwertige Web-App | In der Abnahme prüfen: Vollbild, persistenter Speicher |
| Brave allgemein | Option „Websitedaten beim Schließen löschen“ würde alle Daten löschen | Prüfung des persistenten Speichers, Warnung mit Abhilfe (US-IS-03) |
| Alle | Service Worker, `crypto.randomUUID()` und persistenter Speicher erfordern einen sicheren Kontext (HTTPS) | Lokale Entwicklung über HTTPS mit mkcert (EP-06) |

---

## 3. Technologie-Stack

### 3.1 Übersicht

| Bereich | Wahl | Zweck | ADR |
|---|---|---|---|
| Auslieferungsform | Progressive Web App ohne nativen Wrapper | Eine Codebasis, installierbar, offline, kostenlos | ADR-001 |
| Sprache | TypeScript im strikten Modus, Version 6 (Version 7 erst, wenn typescript-eslint sie unterstützt) | Typen machen Code überprüfbar und lesbar | ADR-002 |
| UI-Framework | React 19 mit React Compiler | Darstellung und Interaktion | ADR-003 |
| Animationen | Motion (`motion/react`) | Glücksrad, Aufblinken, Übergänge, Mikroanimationen | ADR-004 |
| Build-Werkzeug | Vite mit `@vitejs/plugin-react`; React Compiler über `@rolldown/plugin-babel` mit `babel-plugin-react-compiler` | Entwicklungsserver, Bündeln, Plugins | ADR-005 |
| PWA | `vite-plugin-pwa` mit eigenem Service Worker (`injectManifest`) | Manifest, Precache-Liste, kontrollierte Updates | ADR-015 |
| Speicher | IndexedDB mit Dexie, `dexie-react-hooks` | Lokale Datenbank mit Transaktionen und Migrationen | ADR-007 |
| Schemaprüfung | Valibot | Prüfung importierter Dateien und Sicherungspunkte | ADR-012 |
| Navigation | React Router mit Hash-Routing | Ansichten, Zurück-Taste unter Android | ADR-019 |
| Sitzungszustand | Zustand | Laufende Partie und Vorbereitung in der Oberfläche | ADR-019 |
| Texte | Eigene typisierte Lösung, `Intl` für Datum und Zahlen | Ausgelagerte Texte (NFA-I18N) | ADR-018 |
| Gestaltung | CSS Modules, Design-Tokens als CSS-Variablen | Gekapseltes CSS, zentrale Farben (NFA-GB-05) | ADR-018 |
| Diagramme | Eigene SVG-Komponenten | Verlauf und Verteilung (US-ST-04) | ADR-021 |
| Ton | Web Audio API | Soundeffekte | ADR-017 |
| Kennungen | `crypto.randomUUID()` (UUID v4) | Weltweit eindeutige Kennungen | ADR-011 |
| Unit- und Komponententests | Vitest mit Abdeckungsmessung (`@vitest/coverage-v8`), React Testing Library, fast-check, `fake-indexeddb` | Fachlogik, Komponenten, Invarianten, Datenbank | ADR-020 |
| Ende-zu-Ende-Tests | Playwright (Chromium, WebKit) | Abläufe im Browser, offline, Neustart, Update | ADR-020 |
| Statische Prüfungen | ESLint (typescript-eslint mit Typinformationen, react-hooks einschließlich der Regeln des React Compilers, jsdoc, check-file, testing-library, vitest; Projektregeln über `no-restricted-syntax`, ADR-026), Stylelint, dependency-cruiser | Projektregeln automatisch durchsetzen (Entwicklungsrichtlinien, Kapitel 13) | – |
| Formatierung | Prettier mit `eslint-config-prettier` | Einheitliche Form von Code, CSS, JSON und YAML; Markdown (`docs/` und Dateien im Wurzelordner) ausgenommen | ADR-024 |
| Commit-Konvention | commitlint (Conventional Commits) | Prüfung des Titels jedes Pull Requests | ADR-023 |
| Laufzeit der Werkzeuge | Node.js 26, npm; Version in `.nvmrc`. Entscheidung des Product Owners im Setup, obwohl Node.js 26 erst Ende Oktober 2026 als LTS eingestuft wird | Nur Entwicklung, nicht Teil der App | – |
| Lokales HTTPS | mkcert | Test auf Mobilgeräten im WLAN | – |
| Hosting | GitHub Pages unter `https://boardbrain.github.io/`, Deployment per GitHub Actions bei Release-Tags | Statische Auslieferung | ADR-022, ADR-023 |

Konkrete Versionen werden in der Setup-Phase auf den dann aktuellen stabilen Stand festgelegt und in `package.json` exakt fixiert (`save-exact` in `.npmrc`); `package-lock.json` liegt im Repository, und auf GitHub wird mit `npm ci` genau dieser Stand installiert. Aktualisierungen von Abhängigkeiten erfolgen über Dependabot oder bewusst in eigenen `deps/`-Branches (Entwicklungsrichtlinien, Kapitel 10). Abweichend von der Planung (Node.js 24) läuft das Projekt seit dem Setup auf Node.js 26; ein späterer Wechsel der Hauptversion erfolgt als eigener `deps/`-Branch.

### 3.2 Begründung in Kürze

- **PWA:** einzige kostenlose Möglichkeit, iOS, Android und Windows mit einer Codebasis zu erreichen. Native Hüllen würden für iOS ein kostenpflichtiges Entwicklerkonto erfordern.
- **TypeScript und React:** größte Verbreitung und höchste Routine bei der Codeerzeugung; React-Kenntnisse sind über das Projekt hinaus wertvoll. Der React Compiler übernimmt Optimierungen automatisch; die Hooks-Lint-Regeln fangen typische Fehler ab.
- **Motion:** liefert Animationen auf dem Niveau eingebauter Lösungen anderer Frameworks und animiert am React-Rendering vorbei, sodass auch ältere Geräte flüssig bleiben.
- **Dexie:** macht IndexedDB lesbar, bringt Schema-Migrationen mit und aktualisiert Ansichten automatisch (`useLiveQuery`).
- **Wenige Abhängigkeiten:** Jede Bibliothek muss einen klaren, nicht trivial selbst lösbaren Zweck erfüllen. Diagramme, Texte und Zufall sind bewusst eigene Lösungen.

---

## 4. Gesamtarchitektur und Modulschnitt

### 4.1 Schichten

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ui        React-Komponenten, Ansichten, Animationen, Texte, Design-Tokens     │
├──────────────────────────────────────────────────────────────────────────────┤
│ app       Anwendungsdienste: Abläufe wie „Ergebnis speichern“, „Import         │
│           übernehmen“, „Schritt wiederholen“; Transaktionsgrenzen; Sperren     │
├──────────────────────────────────────────────────────────────────────────────┤
│ games     Spielmodule (Catan, eigene Spiele) auf Basis der Fachlogik           │
├──────────────────────────────────────────────────────────────────────────────┤
│ core      Fachlogik in reinem TypeScript: Modell, Brett, Regeln, Zufall,       │
│           Generierung, Statistik, Exportformat, Importanalyse, Sicherung       │
└──────────────────────────────────────────────────────────────────────────────┘
          ▲ implementiert Schnittstellen aus core und app
┌──────────────────────────────────────────────────────────────────────────────┐
│ infra     Dexie-Datenbank, Plattformdienste (Installation, Speicher, Teilen), │
│           Audio, Brücke zum Service Worker, Zufallsquelle des Browsers         │
└──────────────────────────────────────────────────────────────────────────────┘
          sw   Service Worker: eigenständig, ohne App-Logik (Kapitel 11)
```

### 4.2 Abhängigkeitsregeln

| Schicht | Darf verwenden | Darf nicht verwenden |
|---|---|---|
| `core` | nur `core` | React, Dexie, Browser-APIs (`window`, `document`, `indexedDB`, `crypto`), alle anderen Schichten |
| `games` | `core` | `app`, `infra`, `ui` |
| `app` | `core`, `games`, Schnittstellen (`app/ports`) | `ui`; `infra` nur über Schnittstellen |
| `infra` | `core`, `app/ports`, Browser-APIs, Dexie | `ui` |
| `ui` | alle Schichten außer `sw`; Zugriff auf Daten nur über `app` bzw. Lesehooks aus `infra/db` | – |
| `sw` | nichts aus der App | alles andere |

Die Regeln prüft `dependency-cruiser` bei jedem `npm run check`. Die Zusammensetzung (welche Implementierung hinter welcher Schnittstelle steckt) erfolgt an einer einzigen Stelle, `src/main.tsx`.

**Folge:** Die gesamte Fachlogik ist ohne Browser in Vitest testbar. Ein späterer Wechsel des UI-Frameworks oder der Datenbank berührt `core` und `games` nicht.

### 4.3 Module der Fachlogik (`core`)

| Modul | Aufgabe | Anforderungen |
|---|---|---|
| `core/random` | Schnittstelle `RandomSource`, verzerrungsfreie Ganzzahl, Auswahl aus Listen | NFA-ZF-01 bis -03 |
| `core/model` | Entitäten, Kennungstypen, Invarianten (Gruppengröße, eindeutige Namen, Verträglichkeit) | FA-PG-*, FA-VW-*, 3.4 |
| `core/board` | Brettgeometrie: Felder, Kreuzungen, Kanten, Nachbarschaften, Inlandkreuzungen; optionaler Feldinhalt | FA-PL-07, NFA-EW-03 bis -05 |
| `core/placement` | Platzierungsregeln als Bausteine; Strategie für Sackgassen | FA-PL-01 bis -04, NFA-EW-02, NFA-EW-08 |
| `core/draws` | Person losen, Reihenfolge losen, Startrohstoffe ziehen | FA-LS-*, FA-SR-* |
| `core/generation` | Schritte, Ablaufsteuerung, Wiederholung mit Abhängigkeiten, Sitzungsmodell | FA-AB-*, 3.1, 3.5 |
| `core/results` | Ergebnisregeln, Plausibilitätswarnungen, Sortierung von Partien | FA-ER-*, 3.6, 3.7 |
| `core/stats` | Kennzahlen, Siegesserien, Rangliste, Diagrammdaten, Filter | FA-ST-*, 3.8 |
| `core/exchange` | Exportformat, Schema, Migrationskette, Teilumfang, Importanalyse (K1 bis K4), Prüfung von Optionen | FA-EI-*, 3.9 |
| `core/backup` | Aufbewahrung (15, geschützte Importpunkte), Auslöser „Täglich“, Erinnerungslogik | FA-DS-*, FA-EI-05, 3.10, 3.11 |
| `core/shared` | Gemeinsame Bausteine ohne Fachbezug: Ergebnistyp `Result`, `assert` für Invarianten, Hilfstypen (Kapitel 4.6) | – |

### 4.4 Anwendungsdienste (`app`)

Anwendungsdienste setzen Fachlogik und Speicher zu vollständigen Abläufen zusammen. Jeder Dienst definiert die Transaktionsgrenze eines Ablaufs und prüft Sperren (FA-AB-09).

| Dienst | Abläufe |
|---|---|
| `MasterDataService` | Personen, Gruppen, eigene Spiele anlegen, bearbeiten, archivieren, löschen (mit Sicherungspunkt „Vor Löschen“) |
| `ResultService` | Ergebnis erfassen, bearbeiten, löschen; Ergebnis aus laufender Partie speichern und Sitzung beenden |
| `SessionService` | Partie vorbereiten, Generierung starten, Schritt ausführen, bestätigen, wiederholen, Partie beenden |
| `ExportService` | Vollsicherung und Teilexporte erzeugen, weitergeben, Zeitpunkt der Vollsicherung festhalten |
| `ImportService` | Datei lesen, analysieren, Entscheidungen sammeln, übernehmen |
| `BackupService` | Sicherungspunkte anlegen, aufbewahren, wiederherstellen; tägliche Prüfung |
| `UpdateService` | Update-Status abfragen, Sicherungsdialog, Umschaltung auslösen |
| `PlatformService` | Installationsstatus, persistenter Speicher, Plattformerkennung |
| `SettingsService` | Ton, Akzentfarbe, Hinweisstand |

### 4.5 Bezeichner im Code

Code ist durchgehend englisch, auch Kommentare und Testnamen; Texte der Oberfläche und Dokumentation sind deutsch (ADR-008, ADR-027). Verbindliche Zuordnung:

| Fachbegriff | Bezeichner |
|---|---|
| Person, Gruppe, Mitglied | `Person`, `Group`, `GroupMember` |
| Globale / spielgebundene Gruppe | `binding: { kind: 'global' }` / `{ kind: 'game', gameId }` |
| Spiel, eigenes Spiel, unterstütztes Spiel | `Game`, `CustomGame`, `GameModule` |
| Spielversion (Basisspiel, Städte & Ritter) | `edition` (`'base'`, `'cities-and-knights'`) |
| Modus | `mode` (`'standard'`) |
| Partie (mit Ergebnis) | `Match` |
| Sieger, Siegpunkte, Notizen | `winnerIds`, `victoryPoints`, `notes` |
| Gruppenfarbe, Catan-Farbe | `groupColor`, `catanColor` |
| Archiviert | `archived` |
| Laufende Partie, Vorbereitung | `Session`, `Preparation` |
| Generierung, Schritt, Phase | `generation`, `Step`, `Phase` |
| Losschritt (LS-01, LS-03, LS-04), Platzierungsreihenfolge (LS-02) | `PersonDraw`, `PlacementOrder` |
| Feld, Kreuzung, Kante, Inlandkreuzung | `Hex`, `Vertex`, `Edge`, `inlandVertices` |
| Siedlung, Stadt, Straße | `Settlement`, `City`, `Road` |
| Sackgasse | `DeadEnd` |
| Startrohstoffe | `startingResources` |
| Glücksrad, Aufblinken | `Wheel`, `Flash` |
| Kennung | `id` |
| Sicherungspunkt, Vollsicherung | `Snapshot`, `FullBackup` |
| Zuordnung (beim Import) | `Mapping` |
| Zufallsquelle | `RandomSource` |

### 4.6 Fehlerbehandlung (ADR-025)

| Art | Beispiele | Behandlung |
|---|---|---|
| Erwartbare Fehler | Ungültige Eingabe, volle Gruppe, doppelter Name, kaputte Importdatei, gesperrte Aktion während einer Partie | Rückgabe als `Result<T, E>` mit typisiertem Fehlercode; die Oberfläche übersetzt den Code über die Sprachdatei in eine Meldung |
| Unerwartete Fehler | Programmierfehler, verletzte Invariante, Datenbank antwortet nicht | Werfen (`Error`); Auffangen in den Anwendungsdiensten (Transaktion wird vollständig zurückgerollt), in einer Error Boundary je Ansicht und global (`error`, `unhandledrejection`) |

```ts
// core/shared/result.ts (Skizze)
export type Result<T, E extends string> = { ok: true; value: T } | { ok: false; error: E };
export const ok = <T>(value: T) => ({ ok: true, value }) as const;
export const err = <E extends string>(error: E) => ({ ok: false, error }) as const;
```

Fehlerdetails werden nicht übertragen (NFA-DH-01); der Fehlerbildschirm bietet sie zum Kopieren an, damit sie in ein Issue übernommen werden können. Daten von außen (Importdateien, gelesene Sicherungspunkte) werden mit Valibot geprüft, bevor sie verwendet werden.

---

## 5. Spielmodule, Regeln und Generierung

### 5.1 Spielmodule

Jedes unterstützte Spiel ist ein Modul, das eine gemeinsame Schnittstelle erfüllt (NFA-EW-01). Neue Spiele kommen als neues Modul hinzu und werden in `games/registry.ts` eingetragen, ohne bestehende Module zu ändern.

```ts
// games/types.ts (Skizze)
export interface GameModule {
  id: GameId;                       // feste Kennung, z. B. CATAN_GAME_ID
  nameKey: MessageKey;              // Text aus der Sprachdatei
  playerCount: { min: number; max: number };
  editions: EditionDef[];           // leer, wenn das Spiel keine Versionen kennt
  modes: ModeDef[];
  playerColors: PlayerColorPalette | null;   // Catan: Rot, Blau, Weiß, Orange (FA-SP-05)
  supportsVictoryPoints: boolean;
  generation: GenerationDefinition | null;   // null: nur Ergebniserfassung
}
```

Eigene Spiele sind keine Module, sondern Datensätze (`CustomGame`). Sie haben keine Versionen, Modi, Spielfarben, Siegpunkte oder Generierung. Die Oberfläche fragt Fähigkeiten immer über eine gemeinsame Funktion ab (`gameCapabilities(gameId)`), damit sie nicht zwischen „Modul“ und „eigenem Spiel“ unterscheiden muss.

Catan hat die fest eingebaute Kennung

```ts
export const CATAN_GAME_ID = 'c47a0000-0000-4000-8000-000000000001' as GameId;
```

Sie ist auf allen Geräten gleich und wird beim Import immer automatisch erkannt (US-EI-05 AK-5).

### 5.2 Brettmodell

Das Brett wird aus einer Liste von Feldkoordinaten berechnet, nicht fest einprogrammiert. Dadurch sind andere Brettformen später möglich (NFA-EW-05).

- **Felder:** axiale Koordinaten `(q, r)` mit nach oben zeigender Spitze; das Standardbrett sind alle Felder mit Abstand höchstens 2 vom Mittelfeld. Das ergibt die Reihen 3, 4, 5, 4, 3 und einen oben und unten geraden, links und rechts spitzen Umriss (FA-PL-07).
- **Kreuzungen:** Jede Kreuzung wird durch die drei Felder identifiziert, die an ihr zusammentreffen, wobei Felder außerhalb des Bretts als Wasser mitgezählt werden. Eine Kreuzung ist eine **Inlandkreuzung**, wenn alle drei Felder auf dem Brett liegen.
- **Kanten:** Paare benachbarter Kreuzungen.
- **Feldinhalt:** Jedes Feld hat ein optionales Feld `content` (Landschaft, Zahl), das in Version 1 leer bleibt (NFA-EW-03, FA-PL-08).

Ein Test sichert die Eckdaten aus Anforderung 6.1 ab: 19 Felder, 54 Kreuzungen, 72 Kanten, 24 Inlandkreuzungen, und jede Inlandkreuzung hat genau 3 angrenzende Kanten. Die Darstellung (Kapitel 13.5) berechnet ihre Koordinaten aus demselben Modell.

### 5.3 Platzierungsregeln als Bausteine

Eine Regel entscheidet für eine Kreuzung, ob dort im aktuellen Zustand gebaut werden darf. Ein Modus ist eine Liste von Regeln (NFA-EW-02).

```ts
// core/placement/rules.ts (Skizze)
export interface VertexRule {
  allows(vertex: VertexId, state: PlacementState): boolean;
}

export const inlandOnly: VertexRule = {
  allows: (v, s) => s.board.isInland(v),                       // Regel 6.2.1
};

export const distanceRule: VertexRule = {
  allows: (v, s) =>
    !s.occupied.has(v) &&
    s.board.neighbors(v).every((n) => !s.occupied.has(n)),      // Regel 6.2.2
};

export const catanStandardRules: VertexRule[] = [inlandOnly, distanceRule];
```

Spätere Modi wie Küstenkreuzungen (PP-01) oder inhaltsabhängige Regeln (PP-04) ergänzen oder ersetzen Bausteine, ohne die bestehenden zu ändern.

### 5.4 Sackgassen: verdeckte Vorausberechnung

Die Behandlung von Sackgassen ist eine austauschbare Strategie (NFA-EW-08). Version 1 nutzt Variante B (E-09): Zu Beginn der Platzierung bzw. ab einem wiederholten Gebäude werden alle verbleibenden Gebäude verdeckt gelost. Endet ein Durchlauf in einer Sackgasse, wird er verworfen und neu gelost. Angezeigt wird erst danach, Schritt für Schritt.

```ts
// core/placement/strategy.ts (Skizze)
export interface BuildingPlanner {
  /** Lost die Positionen der Gebäude fixed.length + 1 … total. */
  plan(input: PlanInput, rng: RandomSource): PlanResult;
}

export class RetryOnDeadEnd implements BuildingPlanner {
  plan({ board, rules, fixed, total }: PlanInput, rng: RandomSource): PlanResult {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const occupied = [...fixed];
      let deadEnd = false;
      while (occupied.length < total) {
        const valid = board.vertices.filter((v) =>
          rules.every((r) => r.allows(v, { board, occupied: new Set(occupied) })));
        if (valid.length === 0) { deadEnd = true; break; }
        occupied.push(pick(valid, rng));                  // jede Ziehung gleichverteilt
      }
      if (!deadEnd) return { buildings: occupied.slice(fixed.length), attempts: attempt };
    }
    throw new PlacementError('no-plan-found');            // praktisch unerreichbar, siehe unten
  }
}
```

Eigenschaften:

- **Fairness je Ziehung:** Jede einzelne Ziehung ist gleichverteilt über die zu diesem Zeitpunkt gültigen Kreuzungen (AK-3 von US-PL-02).
- **Unsichtbarkeit:** Weil erst nach einem vollständigen, gültigen Durchlauf angezeigt wird, sieht niemand eine Sackgasse, und kein bestätigtes Gebäude wird zurückgenommen (AK-4).
- **Terminierung:** Zu Beginn der Platzierung existiert immer eine vollständige Lösung. Bei der Wiederholung von Gebäude k ist die bisherige Fortsetzung ab k eine gültige Lösung; ein Durchlauf gelingt also stets mit positiver Wahrscheinlichkeit. `MAX_ATTEMPTS` (z. B. 10.000) dient nur als Schutz vor Programmierfehlern.
- **Messung:** Die Anzahl der Versuche wird in der statistischen Testsuite für 4 Personen gemessen und dokumentiert (NFA-EW-08).
- **Persistenz:** Der verdeckte Plan ist Teil der gespeicherten Sitzung (Kapitel 10).
- **Erweiterung:** Variante A (PP-14) wird als zweite Implementierung von `BuildingPlanner` ergänzt.

Straßen hängen nicht von anderen Straßen oder fremden Gebäuden ab (Regel 6.3). Sie werden deshalb nicht vorausberechnet, sondern im jeweiligen Straßenschritt gleichverteilt aus den angrenzenden Kanten gelost.

### 5.5 Generierung als Folge von Schritten

Die Generierung ist eine Liste von Schritten im Sinne von Spezifikation 3.1. Jeder Schritt hat eine Art, ein Ergebnis und einen Bestätigungsstatus.

```ts
// core/generation/types.ts (Skizze)
export type Step =
  | { kind: 'person-draw'; draw: 'landscapes' | 'harbors' | 'numbers'; result: PersonId }
  | { kind: 'order-spin'; position: number; candidates: PersonId[]; result: PersonId }
  | { kind: 'building'; index: number; personId: PersonId; type: 'settlement' | 'city'; result: VertexId }
  | { kind: 'road'; index: number; personId: PersonId; result: EdgeId }
  | { kind: 'starting-resources'; personId: PersonId; result: Resource[] };

export interface StepRecord { step: Step; status: 'revealed' | 'confirmed'; }
```

Das Catan-Modul liefert eine `GenerationDefinition` mit drei Funktionen:

| Funktion | Aufgabe |
|---|---|
| `nextStep(session, rng)` | Ermittelt anhand der bisherigen Ergebnisse den nächsten Schritt und lost sein Ergebnis, z. B. die nächste Straße an das zuletzt gesetzte Gebäude |
| `invalidatedBy(session, index)` | Liefert die Schritte, die bei Wiederholung von Schritt `index` verworfen werden (Tabelle in Spezifikation 3.1) |
| `summary(session)` | Erzeugt die Übersicht der laufenden Partie (US-AB-04) |

Die Ablaufsteuerung in `core/generation` ist spielunabhängig: Sie ruft `nextStep` auf, verwaltet Bestätigung und Wiederholung und kennt kein Catan-Detail. Der Baustein „Person losen“ (`core/draws/drawPerson`) ist unabhängig von Catan nutzbar (FA-LS-05).

### 5.6 Losschritte und Startrohstoffe

| Ziehung | Verfahren | Anforderung |
|---|---|---|
| Person losen (LS-01, LS-03, LS-04) | `pick(participants)`; drei unabhängige Ziehungen | FA-LS-05, FA-LS-06 |
| Platzierungsreihenfolge (LS-02) | n−1 Ziehungen `pick(verbleibende)`; der letzte Platz ergibt sich; alle n! Reihenfolgen gleich wahrscheinlich | FA-LS-02, US-LS-03 |
| Startrohstoffe mit Zurücklegen | k Ziehungen `pick(alleFünf)` | FA-SR-03 |
| Startrohstoffe ohne Zurücklegen | k Ziehungen `pick(nochNichtGezogene)` | FA-SR-03 |

---

## 6. Zufall

### 6.1 Zufallsquelle

Alle Zufallswerte stammen aus einer einzigen Schnittstelle (NFA-ZF-03). Im Produktivcode gibt es genau eine Implementierung, die den kryptografisch sicheren Generator des Browsers nutzt (NFA-ZF-01).

```ts
// core/random/source.ts
export interface RandomSource {
  /** Gleichverteilte Ganzzahl 0 … 2^32 − 1 */
  nextUint32(): number;
}

// infra/random/crypto-source.ts
export class CryptoRandomSource implements RandomSource {
  private buffer = new Uint32Array(256);
  private index = this.buffer.length;
  nextUint32(): number {
    if (this.index >= this.buffer.length) {
      crypto.getRandomValues(this.buffer);   // CSPRNG des Betriebssystems
      this.index = 0;
    }
    return this.buffer[this.index++];
  }
}
```

Regeln:

- `Math.random` ist im gesamten Produktivcode per ESLint verboten, auch für dekorative Zwecke wie das Aufblinken.
- Deterministische Quellen (mit Startwert) liegen ausschließlich unter `tests/support`.
- Die Oberfläche bestimmt kein Ergebnis. Animationen erhalten das bereits feststehende Ergebnis und stellen es dar (US-IN-01 AK-2).

### 6.2 Verzerrungsfreie Umrechnung

Aus einer 32-Bit-Zufallszahl eine Zahl von 0 bis n−1 zu machen, ist mit `x % n` verzerrt, sobald 2³² kein Vielfaches von n ist. BoardBrain nutzt deshalb das Verwerfungsverfahren: Werte oberhalb des größten Vielfachen von n werden verworfen und neu gezogen (NFA-ZF-02).

```ts
// core/random/uniform.ts
/** Interne, wortbreitenunabhängige Fassung; erlaubt den exakten Nachweis im Test. */
export function uniformIntFromWords(n: number, nextWord: () => number, bits: number): number {
  const range = 2 ** bits;
  if (!Number.isInteger(n) || n < 1 || n > range) throw new RangeError(`n = ${n}`);
  const limit = range - (range % n);           // größtes Vielfaches von n, das ≤ range ist
  let x: number;
  do { x = nextWord(); } while (x >= limit);   // Verwerfen statt Modulo-Verzerrung
  return x % n;
}

export const uniformInt = (n: number, rng: RandomSource) =>
  uniformIntFromWords(n, () => rng.nextUint32(), 32);

export const pick = <T>(items: readonly T[], rng: RandomSource): T =>
  items[uniformInt(items.length, rng)]!;          // leere Liste: uniformInt wirft RangeError
```

Weil die Produktivfunktion nur eine Einstellung der allgemeinen Fassung ist, lässt sich deren Korrektheit exakt nachweisen (Kapitel 14.3).

---

## 7. Datenmodell und Speicher

### 7.1 Entitäten

```ts
// core/model/entities.ts (Skizze; Kennungstypen sind „gebrandete“ Strings)
export interface Person {
  id: PersonId; name: string; archived: boolean;
  createdAt: IsoTimestamp; updatedAt: IsoTimestamp;
}

export interface Group {
  id: GroupId; name: string; archived: boolean;
  binding: { kind: 'global' } | { kind: 'game'; gameId: GameId };
  members: GroupMember[];                    // 2 bis 12, nach Anlage unveränderlich
  createdAt: IsoTimestamp; updatedAt: IsoTimestamp;
}

export interface GroupMember {
  personId: PersonId;
  groupColor: GroupColorKey;                 // z. B. 'petrol'; Schlüssel in die Palette, kein Farbwert
  catanColor?: CatanColorKey;                // 'red' | 'blue' | 'white' | 'orange'; nur wo Catan möglich (3.3)
}

export interface CustomGame {
  id: GameId; name: string; archived: boolean;
  createdAt: IsoTimestamp; updatedAt: IsoTimestamp;
}

export interface Match {
  id: MatchId; groupId: GroupId; gameId: GameId;
  date: LocalDate;                           // 'YYYY-MM-DD', Kalendertag am Ort der Erfassung
  time?: LocalTime;                          // 'HH:mm'
  recordedAt: IsoTimestamp;                  // Erfassungszeitpunkt, für Sortierung (3.7) und Erinnerung
  edition?: Edition; mode?: Mode;            // nur Catan
  winnerIds: PersonId[];                     // ≥ 1; mehrere = Unentschieden
  victoryPoints?: Record<PersonId, number>;  // für alle Beteiligten oder fehlt
  catanColors?: Record<PersonId, CatanColorKey>;
  notes?: string;
  updatedAt: IsoTimestamp;
}
```

Grundsätze:

- **Farben als Schlüssel:** Gespeichert werden Palettenschlüssel, nie Farbwerte. Die Werte stehen ausschließlich in den Design-Tokens (NFA-GB-05, OP-11).
- **Datum und Uhrzeit:** Datum und Uhrzeit werden als lokale Werte ohne Zeitzone gespeichert, wie sie am Tisch gemeint sind. Zeitstempel für Erfassung und Änderung sind UTC.
- **Archivstatus und Änderungszeit** gehören nicht zum Inhalt im Sinne der Konfliktprüfung (3.9, Regel 7).
- **Invarianten** prüft `core/model` zentral: 2 bis 12 Mitglieder, eindeutige Namen innerhalb einer Gruppe, Verträglichkeit von Gruppe und Spiel (3.4), eindeutige Farben je Farbart. Dieselben Prüfungen nutzen Formulare, Import und Wiederherstellung.

### 7.2 Kennungen

Jeder Datensatz erhält bei der Anlage eine UUID Version 4 aus `crypto.randomUUID()` (NFA-DH-05). Die Funktion nutzt denselben kryptografischen Generator wie das Losen; 122 Zufallsbits machen Kollisionen praktisch ausgeschlossen. Es gibt keine fortlaufenden Nummern, damit Datensätze von verschiedenen Geräten nie kollidieren und eine spätere Synchronisation nicht verbaut ist (NFA-EW-06).

### 7.3 Datenbank

Eine IndexedDB-Datenbank `boardbrain` mit folgenden Stores (ADR-007):

| Store | Schlüssel | Indizes | Inhalt |
|---|---|---|---|
| `persons` | `id` | `name` | Personen |
| `groups` | `id` | – | Gruppen mit Mitgliedern und Farben |
| `games` | `id` | – | Eigene Spiele (Catan ist im Code) |
| `matches` | `id` | `groupId`, `gameId`, `[groupId+date]` | Partien mit Ergebnis |
| `snapshots` | `id` | `createdAt`, `reason` | Sicherungspunkte (Kapitel 9) |
| `session` | `id` | – | Genau ein Eintrag `current` oder leer (Kapitel 10) |
| `meta` | `key` | – | `settings` (Ton, Akzentfarbe) und `state` (Zeitstempel, Hinweise, Erinnerung) |

```ts
// infra/db/database.ts (Skizze)
export class BoardBrainDb extends Dexie {
  persons!: Table<Person, PersonId>;
  groups!: Table<Group, GroupId>;
  games!: Table<CustomGame, GameId>;
  matches!: Table<Match, MatchId>;
  snapshots!: Table<Snapshot, string>;
  session!: Table<StoredSession, 'current'>;
  meta!: Table<MetaEntry, MetaKey>;

  constructor() {
    super('boardbrain', { chromeTransactionDurability: 'strict' });
    this.version(1).stores({
      persons: 'id, name',
      groups: 'id',
      games: 'id',
      matches: 'id, groupId, gameId, [groupId+date]',
      snapshots: 'id, createdAt, reason',
      session: 'id',
      meta: 'key',
    });
  }
}
```

`chromeTransactionDurability: 'strict'` sorgt dafür, dass Chromium-Browser wie Brave eine Transaktion erst als abgeschlossen melden, wenn sie dauerhaft geschrieben ist. Das ist für die laufende Partie wichtig.

Wahrheitswerte wie `archived` sind in IndexedDB nicht indizierbar. Gefiltert wird im Speicher; bei der erwarteten Datenmenge ist das unkritisch.

### 7.4 Zustandsdaten (`meta.state`)

| Feld | Zweck |
|---|---|
| `lastUserDataChangeAt` | Letzte Änderung an Personen, Gruppen, Spielen oder Partien (Sicherungspunkt „Täglich“) |
| `lastSettingsChangeAt` | Letzte Änderung der Einstellungen |
| `lastFullBackupAt` | Zeitpunkt der letzten Vollsicherung (Erinnerung, Sicherungsdialog) |
| `firstDataAt` | Erste Datenanlage (Erinnerung ohne bisherige Vollsicherung) |
| `lastSnapshotAt`, `lastDailyCheckDate` | Steuerung des Sicherungspunkts „Täglich“ |
| `reminderSnoozedUntil` | „Später“ bei der Export-Erinnerung |
| `hints` | Einmalige Hinweise: Datenschutzhinweis gesehen, Installationshinweis weggeklickt |

Alle schreibenden Zugriffe auf Nutzerdaten laufen über Repository-Funktionen in `infra/db`, die `lastUserDataChangeAt` in derselben Transaktion setzen. So kann keine Änderung „vergessen“ werden. „Änderungen seit der letzten Vollsicherung“ bedeutet: `max(lastUserDataChangeAt, lastSettingsChangeAt) > lastFullBackupAt`.

### 7.5 Drei Versionsnummern

| Nummer | Bedeutung | Wo |
|---|---|---|
| App-Version | Semantic Versioning, z. B. 1.0.0 (EP-05) | `package.json`, Einstellungen, Exportdatei |
| Datenbankschema | Dexie-Version; bei Änderung mit Migrationsfunktion | `infra/db/database.ts` |
| Formatversion | Ganzzahl des Exportformats; ältere werden migriert | `core/exchange/format.ts` |

Die Nummern sind unabhängig: Nicht jedes App-Update ändert Schema oder Format.

### 7.6 Speicherbedarf

Eine Partie belegt als JSON etwa 0,3 bis 0,5 KB. Selbst 2.000 Partien ergeben unter 1 MB, 15 Sicherungspunkte damit höchstens etwa 15 MB. Die Browser gewähren einem Ursprung ein Vielfaches davon. `navigator.storage.estimate()` wird im Bereich „Sicherung“ angezeigt.

---

## 8. Exportformat, Vollsicherung und Import

### 8.1 Dateiformat

JSON in UTF-8, eingerückt und damit lesbar. Dateiname: `boardbrain_‹Datum›_‹Umfang›.json`, z. B. `boardbrain_2026-10-06_vollsicherung.json` oder `boardbrain_2026-10-06_gruppe-anna-ben-clara.json`.

```json
{
  "format": "boardbrain-export",
  "formatVersion": 1,
  "appVersion": "1.0.0",
  "exportedAt": "2026-10-06T20:15:00Z",
  "scope": { "type": "full" },
  "data": {
    "persons": [ { "id": "7c1e…", "name": "Anna", "archived": false, "createdAt": "…", "updatedAt": "…" } ],
    "groups":  [ { "id": "a93f…", "name": "Anna, Ben & Clara", "binding": { "kind": "global" }, "members": [ … ] } ],
    "games":   [],
    "matches": [ { "id": "f01b…", "groupId": "a93f…", "gameId": "c47a0000-0000-4000-8000-000000000001", "date": "2026-10-03", … } ]
  },
  "settings": { "soundEnabled": true, "accentColor": "violet" },
  "appState": { "lastFullBackupAt": "…", "hints": { … }, "reminderSnoozedUntil": null }
}
```

| `scope.type` | Inhalt von `data` | `settings`, `appState` |
|---|---|---|
| `full` (Vollsicherung) | alle Nutzerdaten | ja |
| `groups` (`ids`) | Gruppen mit allen ihren Partien, benötigte Personen und eigene Spiele | nein |
| `games` (`ids`) | alle Partien dieser Spiele über alle Gruppen, benötigte Gruppen und Personen | nein |
| `matches` (`groupId`, `ids`) | ausgewählte Partien einer Gruppe, die Gruppe, ihre Personen, benötigte Spiele | nein |
| `snapshot` | alle Nutzerdaten (nur intern für Sicherungspunkte) | nein |

Die Vollsicherung enthält weder Sicherungspunkte noch eine laufende Partie (FA-EI-09). Catan wird nie exportiert, weil es im Code steht; Partien verweisen über die feste Kennung darauf.

### 8.2 Versionierung und Migration

```ts
// core/exchange/format.ts (Skizze)
export const CURRENT_FORMAT_VERSION = 1;

const migrations: Record<number, (file: unknown) => unknown> = {
  // 1: migrateV1toV2,   ← wird bei der ersten Formatänderung ergänzt
};

export function readExportFile(raw: unknown): ExportFile {
  const version = readFormatVersion(raw);               // prüft "format" und "formatVersion"
  if (version > CURRENT_FORMAT_VERSION) throw new NewerFormatError(version);
  let file = raw;
  for (let ver = version; ver < CURRENT_FORMAT_VERSION; ver++) file = migrations[ver](file);
  return v.parse(ExportFileSchema, file);               // Valibot (import * as v): vollständige Prüfung
}
```

- Ältere Formate laufen schrittweise durch die Migrationskette (NFA-DH-04).
- Neuere Formate werden mit dem Hinweis abgelehnt, die App zu aktualisieren.
- Eine Datei, die die Schemaprüfung nicht besteht, wird vollständig abgelehnt (3.9, Regel 6).
- Für jede Formatversion bleibt eine Beispieldatei dauerhaft unter `tests/fixtures/exports/`; ein Test importiert alle (NFA-DH-04).
- Sicherungspunkte nutzen dasselbe Format und dieselbe Kette (Kapitel 9). Ein vor einem Update angelegter Sicherungspunkt bleibt damit auch nach Formatänderungen wiederherstellbar.

### 8.3 Weitergabe

```ts
// infra/platform/share.ts (Skizze)
export async function deliverFile(file: File): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared'; }
    catch (e) { if (isAbort(e)) return 'cancelled'; }
  }
  downloadViaLink(file);                     // Blob-URL und <a download>
  return 'downloaded';
}
```

Importiert wird über `<input type="file" accept="application/json,.json">`. Einen QR-Code gibt es nicht (FA-EI-12).

Eine Vollsicherung gilt als erstellt, sobald die Datei weitergegeben oder heruntergeladen wurde; bricht der Nutzer das Teilen-Menü ab, ändert sich `lastFullBackupAt` nicht.

### 8.4 Ablauf des Imports

Der Import läuft in vier Phasen. Erst die letzte schreibt etwas.

| Phase | Was passiert | Schreibt? |
|---|---|---|
| 1. Lesen und prüfen | Datei lesen, Formatversion prüfen, migrieren, Schema prüfen; Sperre bei laufender Partie prüfen | nein |
| 2. Analysieren | Jeden Datensatz einordnen: neu, K1, K2, K3, K4; benötigte Entscheidungen ermitteln | nein |
| 3. Entscheiden | Nutzer entscheidet jeden Fall einzeln; Zuordnungen nur im Arbeitsspeicher; unzulässige Optionen deaktiviert | nein |
| 4. Übernehmen | Eine Transaktion: Sicherungspunkt „Vor Import“ anlegen, alle Entscheidungen anwenden, Aufbewahrung anwenden, Zeitstempel setzen | ja |

Bricht der Nutzer in Phase 1 bis 3 ab, ist nichts geändert, und es entsteht kein Sicherungspunkt (3.9, Regeln 5 und 11).

**Reihenfolge der Entscheidungen in Phase 3:** eigene Spiele, dann Gruppen (mit Zuordnung der Personen), dann Personen außerhalb von Gruppenzuordnungen, zuletzt Partien. Jede Entscheidung kann die folgenden beeinflussen; die Analyse der Partien läuft deshalb erst, wenn alle Zuordnungen feststehen.

**Erkennung der Konfliktfälle:**

| Fall | Erkennung |
|---|---|
| K1 | Kennung vorhanden und Inhalt nach Anwendung der Zuordnungen gleich (ohne `archived`, `createdAt`, `updatedAt`) |
| K2 | Kennung vorhanden, Inhalt verschieden; Unterschiede werden feldweise angezeigt |
| K3 | Kennung unbekannt bei Gruppe, Person oder eigenem Spiel |
| K4 | Kennung der Partie unbekannt, aber zugeordnete Gruppe, Spiel, Datum und Menge der Sieger stimmen mit einer vorhandenen Partie überein |

Der Inhaltsvergleich nutzt eine kanonische Darstellung (sortierte Schlüssel und Listen), damit die Reihenfolge von Feldern keine Rolle spielt.

**Zulässigkeit von Optionen (3.9, Regel 9):** Für jede Option berechnet `core/exchange` den Zustand, der nach ihrer Wahl entstünde, und prüft ihn mit den Invarianten aus `core/model`. Verletzt er eine Invariante, wird die Option mit dem Grund deaktiviert. „Meine behalten“ bzw. „Neu anlegen“ sind stets zulässig, weil sie den lokalen Bestand nicht verändern bzw. eine in sich gültige importierte Struktur übernehmen.

**Einstellungen:** Enthält die Datei Einstellungen, fragt die App am Ende von Phase 3 einmal, ob sie übernommen werden sollen (FA-EI-10). Ist der Datenbestand leer, entfallen alle Konfliktfragen.

**Zusammenfassung:** Nach Phase 4 zeigt die App die Anzahl neuer, aktualisierter und übersprungener Datensätze (US-EI-03 AK-6).

---

## 9. Sicherungspunkte

### 9.1 Aufbau

```ts
export interface Snapshot {
  id: string;
  createdAt: IsoTimestamp;
  reason: 'before-import' | 'before-restore' | 'before-delete' | 'before-update' | 'daily' | 'manual';
  label?: string;              // z. B. Dateiname des Imports
  sizeBytes: number;
  payload: ExportFile;         // scope.type = 'snapshot', ohne settings und appState
}
```

Sicherungspunkte liegen in derselben Datenbank wie die Nutzerdaten (ADR-013). Dadurch kann eine einzige Transaktion einen Sicherungspunkt anlegen und zugleich Daten ändern oder ersetzen. Ein Absturz mittendrin hinterlässt nie einen halben Stand.

### 9.2 Auslöser

| Anlass | Ausgelöst durch | Zeitpunkt |
|---|---|---|
| Vor Import | `ImportService` | In der Übernahme-Transaktion, vor dem Schreiben |
| Vor Wiederherstellung | `BackupService` | In der Wiederherstellungs-Transaktion |
| Vor Löschen | `MasterDataService`, `ResultService` | In der Lösch-Transaktion |
| Vor Update | `UpdateService` | Vor der Umschaltung, noch in der alten Version (Kapitel 11) |
| Täglich | `BackupService.checkDaily()` | Beim Start und bei `visibilitychange` → sichtbar, wenn sich der Kalendertag seit `lastDailyCheckDate` geändert hat und `lastUserDataChangeAt > lastSnapshotAt` |
| Manuell | Nutzer | Sofort |

### 9.3 Aufbewahrung

Nach jedem neuen Sicherungspunkt gilt: Gibt es mehr als 15, werden die ältesten entfernt, wobei die drei jüngsten Sicherungspunkte „Vor Import“ geschützt sind. Die Liste „letzte 3 Importe“ (US-EI-06) sind genau diese drei. Die Regel liegt als reine Funktion in `core/backup` und ist vollständig durch Tests abgedeckt.

### 9.4 Wiederherstellung

1. Sperre prüfen: keine Partie in Generierung oder laufend (FA-AB-09).
2. Payload lesen und über die Migrationskette auf das aktuelle Format bringen.
3. In einer Transaktion: Sicherungspunkt „Vor Wiederherstellung“ aus dem aktuellen Stand anlegen, die Stores `persons`, `groups`, `games`, `matches` leeren und mit dem Payload füllen, `lastUserDataChangeAt` setzen, Aufbewahrung anwenden.
4. Einstellungen bleiben unverändert (FA-DS-07).

„Import rückgängig machen“ ist dieselbe Wiederherstellung mit dem Sicherungspunkt „Vor Import“ (US-EI-06).

---

## 10. Persistenz der laufenden Partie

### 10.1 Grundsatz: erst speichern, dann zeigen

Das Ergebnis eines Schritts wird gelost und dauerhaft gespeichert, bevor seine Animation beginnt. Ein Neustart kann deshalb nie ein anderes Ergebnis erzeugen (ADR-014).

```
SessionService                       IndexedDB (session)                 Oberfläche
     │  nextStep(): Ergebnis losen         │                                 │
     │────────────────────────────────────►│ Sitzung mit neuem Schritt       │
     │                                     │ (status 'revealed') speichern   │
     │◄──────── Transaktion abgeschlossen ─│                                 │
     │────────────────────────────────────────────────────────────────────►│ Animation zum
     │                                                                      │ feststehenden Ergebnis
     │◄──────────────────────────────────────────────── „Weiter“ getippt ──│
     │────────────────────────────────────►│ status 'confirmed' speichern    │
```

### 10.2 Gespeicherte Sitzung

```ts
export interface StoredSession {
  id: 'current';
  schemaVersion: number;
  state: 'generation' | 'running';            // Vorbereitung wird nicht gespeichert (3.5)
  gameId: GameId; groupId: GroupId;
  options: GenerationOptions;                 // Version, Modus, Losschritte, Startrohstoffe
  matchColors: Record<PersonId, CatanColorKey>; // Farben dieser Partie (US-PG-04)
  steps: StepRecord[];
  hiddenPlan?: { buildings: VertexId[]; fromIndex: number }; // verdeckte Vorausberechnung
  startedAt: IsoTimestamp;
}
```

### 10.3 Verhalten

| Situation | Verhalten |
|---|---|
| App wird während einer Animation beendet | Nach dem Neustart wird die Animation des letzten Schritts (status `revealed`) mit demselben Ergebnis erneut abgespielt; danach wartet die App auf „Weiter“ (US-AB-05 AK-3) |
| App wird nach einer Bestätigung beendet | Nach dem Neustart erscheint der Stand mit dem nächsten, noch nicht gelosten Schritt |
| Schritt wiederholen | `invalidatedBy` liefert die zu verwerfenden Schritte; neuer Stand wird gespeichert, dann wird neu gelost (wieder erst speichern, dann zeigen) |
| Ergebnis speichern | Eine Transaktion legt die Partie an und löscht die Sitzung (FA-AB-08) |
| Beenden ohne Ergebnis | Die Sitzung wird gelöscht |
| Vorbereitung | Liegt nur im Arbeitsspeicher (Zustand-Store); geht bei einem Neustart verloren |

Weil Updates während einer Partie gesperrt sind (FA-UP-02), wechselt eine Sitzung nie die App-Version. `schemaVersion` dient dennoch als Schutz: Eine unbekannte Version führt zu einer verständlichen Meldung statt zu einem Absturz.

### 10.4 Sperren

Der `SessionService` stellt `isSessionActive()` bereit. `ImportService`, `BackupService.restore`, `MasterDataService` (Archivieren, Löschen, Bindung der beteiligten Gruppe) und `UpdateService` prüfen diese Sperre selbst, nicht nur die Oberfläche (FA-AB-09, E-20).

---

## 11. Update-Mechanismus

### 11.1 Problem

Beim üblichen Verfahren für PWAs wartet eine neue Version zwar auf eine Bestätigung, wird aber vom Browser automatisch aktiv, sobald die App einmal vollständig geschlossen war. Das widerspricht FA-UP-02: Eine neue Version darf nur nach ausdrücklicher Bestätigung und nie während einer Partie aktiv werden.

### 11.2 Lösung: versionierte Caches mit Zeiger

Der Service Worker legt jede App-Version (jeden Build) in einem eigenen Cache ab und liefert immer die Version aus, auf die ein gespeicherter **Zeiger** verweist. Der Zeiger ändert sich nur auf Befehl der App (ADR-015).

```
Cache Storage
 ├─ boardbrain-build-3f9a2c   ← Zeiger („aktiv“): wird ausgeliefert
 ├─ boardbrain-build-81d07e   ← neu geladen, wartet auf Bestätigung
 └─ boardbrain-control        ← enthält den Zeiger
```

| Ereignis | Verhalten des Service Workers |
|---|---|
| Erste Installation | Build in eigenen Cache laden; Zeiger auf diesen Build setzen |
| Neuer Build wird gefunden (Browser lädt geänderte `sw.js`) | Neuen Build vollständig in eigenen Cache laden; sofort aktiv werden (`skipWaiting`), aber weiterhin den Build hinter dem Zeiger ausliefern; Caches entfernen, die weder Zeiger noch neuester Build sind; App benachrichtigen: „neue Version verfügbar“ |
| Anfrage der App | Aus dem Cache des Zeiger-Builds beantworten (offline-first); das Netz wird für App-Dateien nie benötigt |
| Befehl „aktivieren“ von der App | Zeiger umsetzen, alte Caches entfernen, Bestätigung senden |

Weil stets der neueste Service Worker auch ältere Builds ausliefert, gelten für den Service Worker strenge Regeln:

- Er enthält keine App-Logik, nur Laden, Ausliefern und Umschalten.
- Sein Nachrichtenprotokoll mit der App ist versioniert und bleibt abwärtskompatibel.
- Änderungen am Service Worker erfordern die Ende-zu-Ende-Tests zum Update-Ablauf (Kapitel 14.5).

### 11.3 Ablauf aus Sicht der App

1. Beim Start und bei Rückkehr in den Vordergrund fragt die App mit `registration.update()` nach einer neuen Version. Ohne Internet passiert nichts.
2. Meldet der Service Worker eine neue Version und läuft keine Partie (auch keine Vorbereitung), zeigt die App den Hinweis „Jetzt aktualisieren“ (US-UP-01).
3. „Jetzt aktualisieren“ öffnet immer den Sicherungsdialog (US-UP-02). Er nennt `lastFullBackupAt` und die Anzahl der Partien mit `recordedAt` danach bzw. „keine Änderungen“.
4. Bei „Sichern und aktualisieren“ erstellt die App zuerst die Vollsicherung und gibt sie weiter.
5. Die App legt den Sicherungspunkt „Vor Update“ an, noch in der alten Version und im alten Format.
6. Die App sendet „aktivieren“ und lädt sich nach der Bestätigung neu.
7. Die neue Version öffnet die Datenbank; Dexie führt nötige Schemamigrationen aus. Erst danach ist die App bedienbar.

Schlägt eine Datenmigration fehl, zeigt die App eine verständliche Meldung und verweist auf den Sicherungspunkt „Vor Update“ und die Vollsicherung.

### 11.4 Weitere Festlegungen

- **Versionsanzeige:** App-Version und Build-Kennung stehen in den Einstellungen (US-UP-01 AK-5).
- **Entwicklung:** Im Entwicklungsserver ist der Service Worker abgeschaltet. Update-Abläufe werden mit `npm run preview` (Produktions-Build über HTTPS) und in Playwright mit zwei aufeinanderfolgenden Builds getestet.
- **Umsetzung:** `vite-plugin-pwa` im Modus `injectManifest` erzeugt die Liste der Dateien mit Prüfsummen; der Service Worker selbst ist eigener Code in `src/sw/` (rund 150 Zeilen).

---

## 12. Plattformdienste

### 12.1 Installation (ADR-016)

```ts
// infra/platform/install.ts (Skizze)
export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as { standalone?: boolean }).standalone === true;      // iOS

export const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);  // iPadOS
```

| Plattform | Nicht installiert | Installiert |
|---|---|---|
| iOS, iPadOS | Nur Installationsanleitung (US-IS-01); in Nicht-Safari-Browsern der Hinweis auf Safari | Volle Nutzung |
| Android, Windows | Volle Nutzung, wegklickbarer Installationshinweis (US-IS-02) | Volle Nutzung |

Die Erkennung anderer Browser unter iOS ist nur näherungsweise möglich, weil manche die Kennung von Safari verwenden. Die Anleitung ist deshalb so formuliert, dass sie in jedem Fall zum Ziel führt („Öffne diese Seite in Safari und tippe auf ‚Teilen‘ …“).

### 12.2 Persistenter Speicher

Beim Start ruft die App `navigator.storage.persisted()` und, falls nötig, `navigator.storage.persist()` auf. Der Status und `navigator.storage.estimate()` erscheinen im Bereich „Sicherung“. Ist der Speicher nicht geschützt, erscheint eine Warnung mit Ursachen und Abhilfen (US-IS-03), etwa die Ausnahme für BoardBrain in Braves Einstellung „Websitedaten beim Schließen löschen“.

### 12.3 Ton (ADR-017)

- Web Audio API; Klänge als kurze MP3-Dateien im App-Paket, beim Start in `AudioBuffer` dekodiert.
- Der `AudioContext` wird mit dem Tipp auf „Generierung starten“ freigeschaltet (iOS verlangt eine Nutzeraktion).
- Wo verfügbar, wird `navigator.audioSession.type = 'ambient'` gesetzt: Der Stummschalter wird respektiert, und laufende Musik anderer Apps wird nicht unterbrochen (FA-IN-07).
- Der Tonschalter der App (US-IN-03) schaltet zusätzlich alles ab.
- Klänge stammen aus CC0-Quellen oder werden selbst erzeugt; die Herkunft steht in `public/sounds/LICENSES.md`.
- Vibration wird nirgends verwendet (FA-IN-04).

### 12.4 Netzwerk und Datenschutz

- Eine Content-Security-Policy im HTML erlaubt nur die eigene Herkunft, zum Beispiel: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'`. Weil GitHub Pages keine eigenen HTTP-Header erlaubt, wird die Richtlinie als `<meta http-equiv="Content-Security-Policy">` im Build ausgeliefert; Direktiven, die nur als Header wirken (z. B. `frame-ancestors`), entfallen. Die Fassung wird mit dem Platzhalter-Release 0.1.0 nachgewiesen, und ein Ende-zu-Ende-Test prüft das Tag. Der Entwicklungsserver läuft ohne Richtlinie, weil Vite dort Skripte und Stile einschleust.
- Schriften werden als WOFF2-Dateien mitgeliefert, nicht von Google Fonts geladen.
- Es gibt keine Analyse-, Fehler- oder Telemetriedienste (NFA-DH-03).
- Die einzigen Netzwerkzugriffe sind die des Service Workers auf GitHub Pages bei Installation und Update.

---

## 13. Oberfläche

### 13.1 Ansichten und Navigation

Navigation über React Router mit Hash-Routing (`#/gruppen/…`). Damit funktionieren direkte Aufrufe und die Zurück-Taste unter Android ohne Serverkonfiguration auf GitHub Pages (ADR-019).

| Bereich | Ansichten |
|---|---|
| Start | Startansicht, Banner (Erinnerung, Update, Speicherwarnung), Rückkehr zur laufenden Partie |
| Partie | Spielauswahl, Vorbereitung, Generierung, Übersicht der laufenden Partie |
| Ergebnisse | Ergebnisformular, Ergebnisliste einer Gruppe, Detailansicht |
| Statistik | Kennzahlen, Rangliste, Diagramme, Filter |
| Verwaltung | Personen, Gruppen, Spiele, Archiv |
| Daten | Export, Import mit Entscheidungsdialogen, Sicherung mit Sicherungspunkten und Importliste |
| Einstellungen | Ton, Akzentfarbe, Version |
| Installation | Anleitung (iOS ausschließlich diese Ansicht im Browser) |
| Diagnose | Technische Prüfwerte für die Abnahme auf Geräten: Version, sicherer Kontext, Verfügbarkeit von `crypto.randomUUID`, Service Worker und persistentem Speicher, Installationsstatus. Nur über die direkte Adresse `#/diagnose` erreichbar; entsteht im Setup und ist im Platzhalter-Release die Startansicht |

### 13.2 Zustand in der Oberfläche

| Art | Lösung |
|---|---|
| Gespeicherte Daten | `useLiveQuery` aus `dexie-react-hooks`; Ansichten aktualisieren sich bei jeder Änderung automatisch (US-ER-05 AK-3) |
| Laufende Partie | Zustand-Store mit Abbild der gespeicherten Sitzung; Änderungen nur über `SessionService` |
| Vorbereitung | Zustand-Store, nur im Arbeitsspeicher |
| Formulare | Lokaler Komponentenzustand |

### 13.3 Texte (ADR-018)

- Alle Texte stehen in `src/i18n/de.ts` als verschachteltes, typisiertes Objekt. `t('statistik.siege')` ist typgeprüft; ein fehlender Schlüssel ist ein Compilerfehler.
- Platzhalter (`{name}`) und Mehrzahl über `Intl.PluralRules`; Datum und Zahlen über `Intl.DateTimeFormat` und `Intl.NumberFormat` mit `de-DE`.
- ESLint (`no-restricted-syntax`, ADR-026) verbietet feste Texte in JSX, sowohl als Kinder (Text, Zeichenketten, Template-Literale) als auch in den Attributen `title`, `placeholder`, `alt`, `aria-label` und weiteren ARIA-Textattributen (NFA-I18N-02).
- Eine weitere Sprache (PP-10) ist eine zusätzliche Datei mit demselben Typ.

### 13.4 Design-Tokens (ADR-018)

- Alle Farben, Abstände, Radien, Schatten und Dauern stehen als CSS-Variablen in `src/ui/styles/tokens.css`.
- Paletten: Oberflächen im Dunkelmodus (NFA-GB-02), 6 bis 8 Akzentfarben über `data-accent` am Wurzelelement (US-GB-01), 4 Catan-Farben, 12 Gruppenfarben. Die Werte legt die Designphase fest (OP-11).
- Gespeicherte Farbschlüssel werden über eine Zuordnung in Variablen übersetzt, z. B. `catanColor: 'white'` → `var(--color-catan-white)`.
- Stylelint verbietet Farbwerte außerhalb von `tokens.css`; ESLint verbietet Farbwerte in TypeScript (NFA-GB-05).
- Ein späterer Hellmodus (PP-09) ist ein zweiter Satz von Werten für dieselben Variablen.
- Komponenten nutzen CSS Modules (`*.module.css`), sodass Stile nicht über Komponenten hinweg wirken.

### 13.5 Brett

- Das Brett ist ein SVG mit festem `viewBox`, berechnet aus dem Brettmodell (Kapitel 5.2), und skaliert mit `preserveAspectRatio="xMidYMid meet"` in jede Fläche, ohne seine Ausrichtung zu ändern (US-PL-01 AK-3).
- Felder ohne Inhalt, eigenständige Grafik ohne Originalgrafiken (NFA-GB-06).
- Siedlung und Stadt unterscheiden sich durch ihre Form (US-PL-04 AK-2); alle Gebäude und Straßen haben eine Kontur, damit Weiß auf dunklem Grund erkennbar bleibt (AK-3).

### 13.6 Animationen (ADR-004)

- Glücksrad, Aufblinken, Schrittübergänge und Mikroanimationen nutzen Motion.
- **Regel:** Animationen laufen über Motion-Werte, nie über React-Zustand, der pro Bild geändert wird. So bleibt die Darstellung auch auf älteren Geräten flüssig.
- Jede Animation erhält ihr Ergebnis fertig aus der Fachlogik. Der Zielwinkel des Glücksrads wird aus dem gelosten Segment berechnet; welche Kreuzungen vorher aufblinken, lost die Oberfläche über dieselbe `RandomSource` (dekorativ, NFA-ZF-01).
- „Animation überspringen“ springt zum Endzustand; andere Berührungen beeinflussen die Animation nicht (US-IN-04).
- Dauern und Kurven stehen als Tokens bereit; eine Einstellung für das Tempo gibt es nicht.
- CSS-Animationen (`animation`, `transition`, `@keyframes`) verbietet Stylelint, damit es genau einen Weg für Animationen gibt; Mikroanimationen bei Hover und Berührung (NFA-GB-04) nutzen `whileHover` und `whileTap` von Motion.

### 13.7 Diagramme (ADR-021)

Zwei eigene SVG-Komponenten: Liniendiagramm der kumulierten Siege und Verteilungsdiagramm der Siege mit Anteil der Unentschieden. Die Daten liefert `core/stats` bereits fertig aufbereitet; die Komponenten zeichnen nur. Farben kommen aus den Gruppenfarben-Tokens, Beschriftungen aus den Sprachdateien.

---

## 14. Teststrategie

### 14.1 Überblick

| Ebene | Werkzeug | Gegenstand | Wann |
|---|---|---|---|
| Unit-Tests | Vitest | `core`, `games`, `app` (mit Speicher-Attrappen); Mindestabdeckung 90 % für `core` und `games` | `npm test`, in `npm run check` mit Abdeckungsprüfung |
| Eigenschaftstests | Vitest mit fast-check | Invarianten über viele zufällige Fälle mit festem Startwert | `npm test` |
| Exakter Nachweis | Vitest | Verzerrungsfreiheit von `uniformIntFromWords` | `npm test` |
| Statistische Tests | Vitest, eigene Suite | Gleichverteilung mit dem echten Generator; Sackgassenquote | `npm run test:stat`, vor jedem Merge nach `main` |
| Datenbanktests | Vitest mit `fake-indexeddb` | Repositories, Transaktionen, Migrationen, Sicherungspunkte | `npm test` |
| Komponententests | Vitest mit React Testing Library | Formulare, Dialoge, Entscheidungsdialoge beim Import | `npm test` |
| Ende-zu-Ende-Tests | Playwright (Chromium, WebKit; Smartphone- und Tablet-Formate) | Vollständige Abläufe im Browser | `npm run test:e2e`, vor jedem Merge |
| Manuelle Abnahme | Checkliste | Echte Geräte: Android (Brave), iPhone und iPad (Safari), Windows (Brave) | Vor jedem Release |
| Statische Prüfung | TypeScript, ESLint, Stylelint, Prettier, dependency-cruiser | Typen, Projektregeln, Form, Schichten | `npm run check` |
| Konventionen auf GitHub | commitlint, Herkunftsprüfung | Titel des Pull Requests; Pull Requests nach `main` nur aus `develop` oder `hotfix/…` | bei jedem Pull Request (16.3) |

`npm run check` bündelt Typprüfung, Lint-Regeln, Formatprüfung, Schichtprüfung und Unit-Tests mit Abdeckungsprüfung. Vor jedem Pull Request führt Claude Code `npm run check` und `npm run test:e2e` aus, vor einem Pull Request nach `main` zusätzlich `npm run test:stat`; dieselben Prüfungen laufen auf GitHub und sperren den Merge, bis sie bestanden sind (EP-06, 16.3).

### 14.2 Deterministische Tests

Für reproduzierbare Tests gibt es unter `tests/support` zwei Testquellen:

- `SeededRandomSource`: ein einfacher Generator mit Startwert (z. B. xoshiro128\*\*), für Abläufe und Eigenschaftstests.
- `ScriptedRandomSource`: liefert eine vorgegebene Folge von Werten, um gezielt Fälle herzustellen, etwa eine bestimmte Sackgasse oder eine bestimmte Reihenfolge.

Mit ihnen werden unter anderem alle Abnahmekriterien zu LS, PL und SR automatisiert geprüft (NFA-EW-07), darunter die Schlangenreihenfolge, Siedlung und Stadt bei Städte & Ritter, die Abstandsregel, die angrenzende Straße und die Wiederholungsregeln aus Spezifikation 3.1.

**Eigenschaftstests** prüfen Aussagen, die für jeden Ablauf gelten müssen, über tausende Fälle: Jedes Gebäude steht auf einer Inlandkreuzung ohne belegten Nachbarn; jede Straße grenzt an ihr Gebäude; nach jeder Wiederholung sind genau die erwarteten Schritte verworfen; bei 2 und 3 Personen braucht die Platzierung nie mehr als einen Versuch.

### 14.3 Exakter Nachweis der Verzerrungsfreiheit

Ein statistischer Test kann eine Verzerrung nur mit einer gewissen Wahrscheinlichkeit erkennen. Für die Umrechnung von Zufallswerten in Auswahlentscheidungen gibt es deshalb einen exakten Nachweis:

```ts
// core/random/uniform.test.ts (Skizze)
it('bildet die angenommenen Eingabewerte auf jedes Ergebnis gleich oft ab', () => {
  const bits = 10;                                   // 1.024 mögliche Eingabewerte
  const range = 2 ** bits;
  for (let n = 1; n <= range; n++) {
    const counts = new Array(n).fill(0);
    for (let x = 0; x < range; x++) {               // jeden Eingabewert genau einmal anbieten
      let calls = 0;
      const result = uniformIntFromWords(n, () => (calls++ === 0 ? x : 0), bits);
      if (calls === 1) counts[result]++;             // x wurde angenommen, nicht verworfen
    }
    expect(new Set(counts).size).toBe(1);            // alle Ergebnisse exakt gleich häufig
  }
});
```

Wird ein Eingabewert verworfen, fragt die Funktion ein zweites Mal; dieser Fall wird nicht gezählt. Weil `uniformInt` dieselbe Funktion mit 32 Bit verwendet, belegt der Test die Verzerrungsfreiheit des Produktivcodes, nicht einer Nachbildung. Ein zweiter Test prüft, dass verworfene Werte genau die Werte ab `limit` sind.

### 14.4 Statistische Tests

Die statistische Suite prüft mit dem echten `CryptoRandomSource` und jeweils 100.000 Ziehungen (NFA-ZF-02):

| Prüfung | Kategorien |
|---|---|
| Person losen | n = 2 bis 12 Personen |
| Platzierungsreihenfolge | alle n! Reihenfolgen für n = 2, 3, 4 |
| Kreuzung | gültige Kreuzungen in mehreren festen Brettzuständen (leer, teilweise belegt) |
| Kante | die 3 angrenzenden Kanten eines Gebäudes |
| Startrohstoffe mit Zurücklegen | 5 Rohstoffe je Ziehung |
| Startrohstoffe ohne Zurücklegen | alle geordneten Paare bei k = 2; verbleibende Rohstoffe je Ziehung |

Verfahren: Chi-Quadrat-Anpassungstest gegen die Gleichverteilung mit α = 0,001 je Test. Die kritischen Werte stehen als Tabelle in `tests/support`. Weil auch korrekter Code bei vielen Tests gelegentlich zufällig auffällt, wird ein fehlgeschlagener Test einmal wiederholt; erst ein zweiter Fehlschlag gilt als Fehler.

Zusätzlich misst die Suite für 4 Personen in beiden Spielversionen über 100.000 vollständige Platzierungen, wie oft verdeckt neu gelost werden musste. Das Ergebnis wird in `docs/test-reports/sackgassen.md` festgehalten (NFA-EW-08).

### 14.5 Ende-zu-Ende-Tests

Playwright-Szenarien (Auswahl):

- Vollständige Generierung mit 2, 3 und 4 Personen in beiden Spielversionen, mit allen Optionen und Wiederholungen.
- Neustart während einer Animation und nach einer Bestätigung (US-AB-05).
- Offline: alle Funktionen bei abgeschaltetem Netz (NFA-PL-03).
- Export und Import mit allen Konfliktfällen; Rückgängig; Import aller Beispieldateien älterer Formatversionen.
- Sicherungspunkte: Auslöser, Aufbewahrung, Wiederherstellung, Sperren während einer Partie.
- Update: zwei aufeinanderfolgende Builds; neue Version bleibt nach Neustart inaktiv; Hinweis nicht während einer Partie; Sicherungsdialog; Sicherungspunkt „Vor Update“; Datenmigration.
- Netzwerkwächter: Jeder Test schlägt fehl, wenn eine Anfrage an eine fremde Adresse geht (NFA-DH-01).
- Darstellung: Smartphone und Tablet in Hoch- und Querformat ohne abgeschnittene Inhalte (NFA-PL-04).
- Content-Security-Policy: Der Produktions-Build enthält das Meta-Tag aus 12.4.

Die Ende-zu-Ende-Tests laufen gegen `npm run preview`; lokal baut `npm run test:e2e` vorher den aktuellen Stand. Lokal laufen sie mit dem mkcert-Zertifikat über HTTPS; weil Playwrights WebKit unter Windows dem Zertifikatsspeicher von Windows nicht vertraut, ignorieren die Tests Zertifikatsfehler (die Seite bleibt ein sicherer Kontext). Auf GitHub laufen sie über `http://localhost`, das Browser ebenfalls als sicheren Kontext behandeln. Eine Fixture lässt jeden Test zusätzlich bei Fehlern in der Browser-Konsole fehlschlagen, darunter Verstöße gegen die Content-Security-Policy.

WebKit unter Windows nähert Safari an, ersetzt aber nicht den Test auf echten Apple-Geräten.

### 14.6 Manuelle Abnahme vor jedem Release

Eine Checkliste in `docs/Abnahme-Checkliste.md` (angelegt in Inkrement I1) umfasst je Plattform: Installation, Start im Flugmodus, eine vollständige Generierung, Neustart mitten in der Generierung, Ton mit und ohne Stummschaltung bei laufender Musik, Vollsicherung über das Teilen-Menü, Import auf einem zweiten Gerät, Update mit Sicherungsdialog und persistenten Speicher. Unter iOS zusätzlich: Verhalten im Safari-Tab (nur Anleitung).

### 14.7 Nachweis der Prüfkriterien (Spezifikation, Kapitel 5)

| Prüfkriterium | Nachweis |
|---|---|
| NFA-ZF-01 | ESLint verbietet `Math.random`; einzige Implementierung von `RandomSource` im Produktivcode; Code-Review |
| NFA-ZF-02 | Exakter Nachweis (14.3) und statistische Suite (14.4) |
| NFA-ZF-03 | Schnittstelle `RandomSource`; Testquellen in `tests/support` |
| NFA-PL-01 | Manuelle Abnahme (14.6) |
| NFA-PL-02 | Eine Codebasis; Code-Review |
| NFA-PL-03 | Ende-zu-Ende-Test offline; manuelle Abnahme im Flugmodus |
| NFA-PL-04 | Ende-zu-Ende-Tests in vier Formaten; manuelle Abnahme |
| NFA-DH-01 bis -03 | Content-Security-Policy; Netzwerkwächter in Playwright; Code-Review |
| NFA-DH-04 | Beispieldateien je Formatversion; Importtests |
| NFA-DH-05 | `crypto.randomUUID()` als einzige Kennungsquelle; Code-Review |
| NFA-GB-01, -02, -06 | Abnahme durch den Product Owner |
| NFA-GB-04 | Manueller Test |
| NFA-GB-05 | Stylelint und ESLint gegen Farbwerte außerhalb der Tokens |
| NFA-I18N-01, -02 | ESLint gegen feste Texte (ADR-026) und typisierte Textschlüssel |
| NFA-EW-01 bis -06 | Architektur-Review anhand von Kapitel 4, 5 und 7; dependency-cruiser |
| NFA-EW-07 | Unit-, Eigenschafts- und statistische Tests (14.2 bis 14.4) |
| NFA-EW-08 | Austauschbarer `BuildingPlanner`; Bericht zur Sackgassenquote |

---

## 15. Projekt- und Ordnerstruktur

```
boardbrain.github.io/                 Repository; lokal z. B. C:\dev\boardbrain
├─ .github/
│  ├─ workflows/
│  │  ├─ ci.yml                       Prüfungen bei jedem Pull Request (16.3)
│  │  └─ deploy.yml                   Veröffentlichung bei Tags v* (16.3)
│  ├─ dependabot.yml                  Abhängigkeits-Updates, Ziel develop
│  └─ pull_request_template.md        PR-Vorlage mit Definition of Done
├─ .claude/
│  └─ settings.json                   Berechtigungen für Claude Code (16.5)
├─ .vscode/
│  ├─ extensions.json                 Empfohlene Erweiterungen
│  └─ settings.json                   Formatieren beim Speichern
├─ docs/                              Projektdokumentation, einzige Masterkopie (EP-08, EP-09)
│  ├─ BoardBrain_Anforderungsdokumentation.md
│  ├─ BoardBrain_Spezifikation.md
│  ├─ BoardBrain_Architektur.md
│  ├─ Entwicklungsrichtlinien.md      Verbindliche Arbeitsregeln (EP-12)
│  ├─ Setup-Anleitung.md              Einrichtung unter Windows
│  ├─ Setup-DoD.md                    Definition of Done der Setup-Phase
│  ├─ Abnahme-Checkliste.md           Manuelle Abnahme vor Releases (ab I1)
│  └─ test-reports/                   z. B. sackgassen.md
├─ public/
│  ├─ icons/                          App-Symbole für alle Plattformen
│  ├─ fonts/                          WOFF2-Schriften
│  └─ sounds/                         Klänge und LICENSES.md
├─ src/
│  ├─ core/                           Fachlogik, framework-frei
│  │  ├─ shared/                      Result, assert, Hilfstypen (4.6)
│  │  ├─ random/                      RandomSource, uniformInt, pick
│  │  ├─ model/                       Entitäten, Kennungen, Invarianten
│  │  ├─ board/                       Brettgeometrie
│  │  ├─ placement/                   Regeln (Bausteine), BuildingPlanner
│  │  ├─ draws/                       Person losen, Reihenfolge, Startrohstoffe
│  │  ├─ generation/                  Schritte, Ablauf, Wiederholung, Sitzungsmodell
│  │  ├─ results/                     Ergebnisregeln, Plausibilität, Sortierung
│  │  ├─ stats/                       Kennzahlen, Rangliste, Diagrammdaten
│  │  ├─ exchange/                    Exportformat, Schema, Migrationen, Importanalyse
│  │  └─ backup/                      Aufbewahrung, Auslöser, Erinnerung
│  ├─ games/
│  │  ├─ types.ts                     Schnittstelle GameModule
│  │  ├─ registry.ts                  Liste der unterstützten Spiele
│  │  └─ catan/                       Spielmodul Catan
│  ├─ app/
│  │  ├─ ports.ts                     Schnittstellen zu infra
│  │  └─ services/                    Anwendungsdienste (Kapitel 4.4)
│  ├─ infra/
│  │  ├─ db/                          Dexie-Datenbank, Repositories, Lesehooks
│  │  ├─ random/                      CryptoRandomSource
│  │  ├─ platform/                    Installation, Speicher, Teilen
│  │  ├─ audio/                       Klänge
│  │  └─ update/                      Brücke zum Service Worker
│  ├─ sw/                             Service Worker (ab I1, nicht im Setup)
│  ├─ ui/
│  │  ├─ views/                       Ansichten je Bereich, darunter diagnostics/
│  │  ├─ components/                  Wiederverwendbare Bausteine, ErrorBoundary
│  │  ├─ board/                       Brett-SVG
│  │  ├─ wheel/                       Glücksrad
│  │  ├─ charts/                      Diagramme
│  │  ├─ state/                       Zustand-Stores
│  │  └─ styles/                      tokens.css, globale Stile
│  ├─ i18n/                           de.ts, t()
│  └─ main.tsx                        Einstieg, Zusammensetzung der Abhängigkeiten
├─ tests/
│  ├─ support/                        Testquellen für Zufall, Chi-Quadrat-Tabelle, Hilfen
│  ├─ fixtures/exports/               Beispieldateien je Formatversion
│  ├─ statistical/                    *.stat.test.ts
│  └─ e2e/                            Playwright-Szenarien
├─ CLAUDE.md                          Kurzfassung der Entwicklungsrichtlinien für Claude Code
├─ README.md                          Kurzbeschreibung, Adresse, Verweis auf docs/
├─ LICENSE                            PolyForm Strict 1.0.0, Copyright (c) 2026 Jonasss29
├─ CHANGELOG.md                       Änderungen je Release (deutsch)
├─ .gitattributes                     LF für alle Textdateien
├─ .gitignore
├─ .nvmrc                             Node.js-Hauptversion für lokal und GitHub
├─ .npmrc                             save-exact=true, engine-strict=true
├─ .prettierrc.json, .prettierignore
├─ commitlint.config.js
├─ index.html                         mit Content-Security-Policy (12.4)
├─ package.json, package-lock.json
├─ tsconfig.json                      Typprüfung von src und tests/support, tests/statistical
├─ tsconfig.node.json                 Typprüfung der Konfigurationsdateien und tests/e2e
├─ vite.config.ts
├─ vitest.config.ts
├─ playwright.config.ts
├─ eslint.config.js
├─ stylelint.config.js
└─ .dependency-cruiser.cjs
```

Unit-Tests liegen neben dem getesteten Code (`placement.test.ts` neben `placement.ts`). Statistische und Ende-zu-Ende-Tests liegen in `tests/`, weil sie länger laufen und getrennt gestartet werden.

Nicht im Repository liegen die lokalen HTTPS-Zertifikate. Sie liegen im Benutzerordner unter `%USERPROFILE%\.boardbrain-certs\` (16.6); der Schlüssel der lokalen Zertifizierungsstelle bleibt im Ordner von mkcert.

---

## 16. Entwicklung, Build und Auslieferung

Die verbindlichen Arbeitsregeln stehen in `docs/Entwicklungsrichtlinien.md`, die Schritte der Einrichtung in `docs/Setup-Anleitung.md`. Dieses Kapitel beschreibt die technische Ausgestaltung.

### 16.1 Entwicklungsumgebung unter Windows

| Werkzeug | Installation | Zweck |
|---|---|---|
| Node.js 26 und npm | `winget install OpenJS.NodeJS` bis zur LTS-Einstufung von Node.js 26, danach `OpenJS.NodeJS.LTS` (direkt, ohne Versionsmanager) | Laufzeit und Paketverwaltung der Werkzeuge |
| Git für Windows | `winget install Git.Git` | Versionsverwaltung (EP-01); bringt Git Bash mit, das Claude Code nutzt |
| GitHub CLI (`gh`) | `winget install GitHub.cli`, Anmeldung über den Browser mit Berechtigung `workflow` | Pull Requests und Releases aus Claude Code; Anmeldung für Git |
| Claude Code | nativer Installer, Bedienung über die Erweiterung in VS Code | Umsetzung, Pflege von Code und Dokumentation |
| Visual Studio Code | vorhanden | Lesen und Nachvollziehen; Erweiterungen ESLint, Prettier, Stylelint, Playwright, Claude Code |
| mkcert | `winget install FiloSottile.mkcert` | Lokales HTTPS für Tests auf Mobilgeräten (16.6) |
| Brave, Chrome | Brave vorhanden; Chrome als Vergleichsbrowser | Tests und Entwicklertools (IndexedDB, Service Worker) |

Ein Versionsmanager für Node.js wird bewusst nicht verwendet: Es gibt nur ein Projekt, und ein Versionsmanager müsste zusätzlich in Git Bash eingebunden werden, in dem Claude Code seine Befehle ausführt. Das Projekt liegt in einem Pfad ohne Leerzeichen und außerhalb von OneDrive (z. B. `C:\dev\boardbrain`), weil die Synchronisation den Ordner `node_modules` stört.

Git-Einstellungen: `user.name` `Jonasss29`, `user.email` die noreply-Adresse von GitHub, `init.defaultBranch main`, `core.autocrlf false`, `pull.ff only`, `fetch.prune true`, `core.longpaths true`. Die Zeilenenden legt `.gitattributes` fest (`* text=auto eol=lf`).

### 16.2 Befehle

| Befehl | Wirkung |
|---|---|
| `npm run dev` | Entwicklungsserver, im WLAN erreichbar; über HTTPS, wenn das Zertifikat vorhanden ist (16.6); ohne Service Worker und ohne Content-Security-Policy |
| `npm run build` | Typprüfung und Produktions-Build nach `dist/` |
| `npm run preview` | Produktions-Build lokal ausliefern, im WLAN erreichbar, über HTTPS wie `dev` |
| `npm test` | Unit-, Eigenschafts-, Datenbank- und Komponententests |
| `npm run test:stat` | Statistische Suite |
| `npm run test:e2e` | Playwright gegen `preview` (Chromium, WebKit; Smartphone- und Tablet-Formate) |
| `npm run format` | Prettier formatiert alle Dateien außer `docs/` |
| `npm run check` | Typen, ESLint, Stylelint, Prettier (nur prüfen), dependency-cruiser, `npm test` mit Abdeckungsprüfung |

### 16.3 Branches, Pull Requests und Auslieferung (ADR-023)

**Branches.** `main` enthält nur Releases, `develop` den integrierten Entwicklungsstand und ist Standard-Branch auf GitHub. Gearbeitet wird in kurzlebigen Arbeitsbranches nach dem Schema `‹typ›/‹beschreibung›`, die von `develop` abzweigen (EP-03); Hotfixes zweigen von `main` ab.

**Merge-Arten.** Arbeitsbranch nach `develop`: nur Squash merge, der Titel des Pull Requests wird zur Commit-Nachricht. `develop` bzw. `hotfix/…` nach `main`: nur Merge commit, damit `main` und `develop` ihre gemeinsame Geschichte behalten. Rebase merge ist abgeschaltet.

**Schutzregeln (Rulesets).** Für `develop` und `main`: Änderungen nur per Pull Request, null erforderliche Freigaben (der Product Owner kann seinen eigenen Pull Request nicht freigeben; die Kontrolle liegt darin, dass nur er mergt), erforderliche Prüfungen, kein Force-Push, kein Löschen, keine Ausnahmen. Für Tags `v*`: kein Verschieben, kein Löschen.

**Workflow `ci.yml`** (bei jedem Pull Request nach `develop` oder `main`, nur Leserechte):

| Job | Inhalt | Erforderlich für |
|---|---|---|
| `check` | `npm ci`, `npm run check`, `npm audit --omit=dev --audit-level=high` | `develop`, `main` |
| `e2e` | Playwright-Browser installieren, `npm run build`, `npm run test:e2e` | `develop`, `main` |
| `pr-title` | commitlint prüft den Titel des Pull Requests | `develop`, `main` |
| `stat` | `npm run test:stat` (nur bei Ziel `main`) | `main` |
| `guard-main` | schlägt fehl, wenn ein Pull Request nach `main` nicht aus `develop` oder `hotfix/…` kommt (nur bei Ziel `main`) | `main` |

Übersprungene Jobs gelten bei GitHub als bestanden; `stat` und `guard-main` blockieren Pull Requests nach `develop` daher nicht.

**Workflow `deploy.yml`** (bei Push eines Tags `v*`): `npm ci`, `npm run check`, `npm run build`, Hochladen und Veröffentlichen über die GitHub-eigenen Pages-Actions. Nur dieser Workflow erhält die Rechte `pages: write` und `id-token: write`. Die Umgebung `github-pages` erlaubt zusätzlich nur Tags `v*`, sodass GitHub die Regel „nur Releases werden veröffentlicht“ unabhängig vom Workflow durchsetzt (EP-03).

**Release.** (1) Pull Request `chore/release-x.y.z` nach `develop` mit Versionsnummer und Eintrag in `CHANGELOG.md`; (2) Pull Request `develop` nach `main` mit Titel `release: x.y.z`; (3) nach dem Merge erzeugt Claude Code nach Zustimmung des Product Owners mit `gh release create vx.y.z --target main` das GitHub-Release mit Tag; der Tag löst die Veröffentlichung aus. Bei Hotfixes wird `main` danach per Pull Request nach `develop` zurückgeführt.

**Erste Veröffentlichung.** Release 0.1.0 am Ende der Setup-Phase: der Stand des Setups mit der Diagnoseansicht (13.1), ohne Service Worker und ohne Datenspeicherung (EP-02, E-25). Er weist die gesamte Kette bis zur echten Adresse nach.

**Keine öffentlichen Vorschauversionen.** Eine Vorschau unter derselben Herkunft würde dieselbe Datenbank wie die echte App sehen. Getestet wird lokal. Über Vorabversionen der echten App wird nach I2 entschieden (OP-13).

**Sicherheit auf GitHub.** Erlaubt sind nur Actions von GitHub selbst, Workflows haben standardmäßig nur Leserechte; Secret scanning mit Push protection, Dependabot alerts und security updates, CodeQL (Default setup) und Private vulnerability reporting sind aktiv. Dependabot version updates laufen monatlich, gebündelt, mit Ziel `develop` und Titelpräfix `deps:`.

### 16.4 `CLAUDE.md`

Die Datei im Repository ist die kurze, verbindliche Fassung der Entwicklungsrichtlinien für Claude Code und verweist für Details auf diese. Sie enthält unter anderem: Arbeitsablauf mit Story-Bündeln und Haltepunkten (EP-10); Schichten und Abhängigkeitsregeln; durchgehend englischer Code; kein `Math.random`, Zufall nur über `RandomSource`; keine Farbwerte außerhalb der Tokens; keine festen Texte; Animationen nur über Motion; jeder Schreibzugriff über Repositories; Sperren in Diensten prüfen; Fehlerbehandlung nach 4.6; Tests zu jeder Fachlogik; Git-Konventionen; vor jedem Pull Request `npm run check` und `npm run test:e2e`, vor einem Pull Request nach `main` zusätzlich `npm run test:stat`. Sie verweist auf die Dokumente in `docs/`.

### 16.5 Claude Code

**Berechtigungen** stehen in `.claude/settings.json` im Repository; persönliche Ergänzungen in `.claude/settings.local.json`, die nicht ins Repository gelangt. Berechtigungen werden von Claude Code durchgesetzt, Anweisungen in `CLAUDE.md` nicht; harte Grenzen gehören deshalb in die Berechtigungen. Befehlsregeln stehen jeweils für das Bash- und das PowerShell-Werkzeug von Claude Code. Sie greifen auf die übliche Schreibweise eines Befehls und sind keine vollständige Sicherheitsgrenze; `develop` und `main` schützen zusätzlich die Rulesets auf GitHub.

| Bereich | Regel |
|---|---|
| Dateien im Projekt bearbeiten | ohne Nachfrage (`defaultMode: acceptEdits`) |
| `npm run …`, `npx` für Projektwerkzeuge, lokale `git`-Befehle, `git push` in Arbeitsbranches, `gh pr …` | erlaubt |
| `npm install` bzw. `npm uninstall` | Nachfrage (neue Abhängigkeiten sind ein Haltepunkt) |
| `git tag`, `gh release …`, `gh api`, `gh repo edit` | Nachfrage |
| Lesen von `rootCA-key.pem` und des Zertifikatsordners | verboten (Lesen und Bearbeiten, zusätzlich `cat` und `Get-Content` auf diese Pfade) |
| `git push --force`, `git reset --hard`, `rm -rf`, `gh repo delete` | verboten |
| Modus ohne Berechtigungsprüfung | gesperrt (`disableBypassPermissionsMode`) |
| Hinweise auf Claude in Commits und Pull Requests | abgeschaltet (`attribution` mit leeren Texten; Entwicklungsrichtlinien 3.3) |

**Modelle:** siehe Anforderungsdokumentation 9.3.

### 16.6 Lokales HTTPS

mkcert erzeugt eine lokale Zertifizierungsstelle, die in Windows sowie von Hand auf Android und dem iPad als vertrauenswürdig installiert wird (ein eigenes iPhone gibt es nicht, auf fremden Geräten wird sie nie installiert; Anforderungsdokumentation OP-13), und ein Serverzertifikat für `localhost`, `127.0.0.1`, `::1` und die feste IP-Adresse des PCs im Heimnetz (Adressreservierung in der FRITZ!Box). Das Serverzertifikat liegt unter `%USERPROFILE%\.boardbrain-certs\` (`cert.pem`, `key.pem`) und wird vom Product Owner erzeugt, nicht von Claude Code. `vite.config.ts` liest es von dort und schaltet HTTPS nur ein, wenn die Dateien vorhanden sind; ohne Zertifikat (z. B. auf GitHub) laufen `dev` und `preview` über `http://localhost`. Der Schlüssel der Zertifizierungsstelle verlässt den PC nie.

---

## 17. Architekturentscheidungen (ADR)

Alle ADRs haben, sofern nicht anders angegeben, den Status **Angenommen**, das Datum 06.10.2026 und wurden vom Product Owner entschieden. Spätere Änderungen werden als neue ADR erfasst, die die alte ersetzt („Ersetzt durch ADR-0xx“).

### Übersicht

| ADR | Titel | Status |
|---|---|---|
| ADR-001 | PWA ohne nativen Wrapper | Angenommen |
| ADR-002 | TypeScript im strikten Modus | Angenommen |
| ADR-003 | React 19 mit React Compiler | Angenommen |
| ADR-004 | Motion für Animationen | Angenommen |
| ADR-005 | Vite als Build-Werkzeug | Angenommen |
| ADR-006 | Framework-freie Fachlogik in Schichten | Angenommen |
| ADR-007 | IndexedDB mit Dexie, eine Datenbank | Angenommen |
| ADR-008 | Englische Bezeichner, deutsche Kommentare | Angenommen; für Kommentare ersetzt durch ADR-027 |
| ADR-009 | Zufallsquelle und Verwerfungsverfahren | Angenommen |
| ADR-010 | Sackgassen: verdeckte Vorausberechnung | Angenommen |
| ADR-011 | UUID Version 4 als Kennungen | Angenommen |
| ADR-012 | Exportformat: versioniertes JSON, kein QR-Code | Angenommen |
| ADR-013 | Sicherungspunkte im Exportformat in derselben Datenbank | Angenommen |
| ADR-014 | Laufende Partie: erst speichern, dann zeigen | Angenommen |
| ADR-015 | Kontrollierte Update-Umschaltung | Angenommen |
| ADR-016 | Nutzung unter iOS nur installiert; persistenter Speicher | Angenommen |
| ADR-017 | Ton über Web Audio mit Audio-Session „ambient“ | Angenommen |
| ADR-018 | Eigene Textlösung und Design-Tokens als CSS-Variablen | Angenommen |
| ADR-019 | Hash-Routing mit React Router; Zustand für Sitzungszustand | Angenommen |
| ADR-020 | Teststrategie für den Zufall | Angenommen |
| ADR-021 | Eigene SVG-Diagramme | Angenommen |
| ADR-022 | Hosting auf GitHub Pages mit eigener Herkunft | Angenommen |
| ADR-023 | Branch- und Release-Modell | Angenommen |
| ADR-024 | Prettier als Formatierer | Angenommen |
| ADR-025 | Fehlerbehandlung mit Ergebnistyp | Angenommen |
| ADR-026 | ESLint 10 ohne eslint-plugin-react | Angenommen |
| ADR-027 | Code durchgehend englisch | Angenommen |

---

### ADR-001: PWA ohne nativen Wrapper

**Kontext:** Die App muss auf Android, iOS, iPadOS und Windows laufen, kostenlos und ohne Server (RB-01, RB-02). Native iOS-Apps erfordern ein kostenpflichtiges Entwicklerkonto.

**Entscheidung:** BoardBrain wird als reine Progressive Web App gebaut und über statisches Hosting ausgeliefert.

**Betrachtete Optionen:**

| Option | Vorteile | Nachteile |
|---|---|---|
| Reine PWA | Eine Codebasis, ein Auslieferungsweg, kostenlos, offline-fähig | iOS-Besonderheiten (getrennte Speicher, manuelle Installation); Update-Verhalten muss selbst gesteuert werden |
| Capacitor oder Tauri als Hülle | Echte Apps unter Android und Windows | Für iOS weiterhin kostenpflichtig; zwei Auslieferungswege |
| Flutter (Web) | Einheitliche Darstellung | Große Downloads, weniger webnah, PWA-Werkzeuge schwächer |

**Konsequenzen:** Einfache Auslieferung und Pflege. Die iOS-Besonderheiten werden durch ADR-016 abgefangen, das Update-Verhalten durch ADR-015.

---

### ADR-002: TypeScript im strikten Modus

**Kontext:** Der Code wird überwiegend von Claude geschrieben und muss vom Product Owner nachvollzogen werden (RB-04). Im Browser läuft nur JavaScript.

**Entscheidung:** TypeScript mit `strict: true` und `noUncheckedIndexedAccess: true`; gebrandete Kennungstypen (`PersonId`, `GroupId` …), damit Kennungen nicht verwechselt werden.

**Betrachtete Optionen:** JavaScript ohne Typen (weniger Sicherheit, Fehler erst zur Laufzeit); in Web-Code übersetzte Sprachen wie C# (Blazor) oder Dart (große Downloads, schwächere PWA-Werkzeuge).

**Konsequenzen:** Fehler fallen vor der Ausführung auf; Funktionssignaturen dokumentieren Ein- und Ausgaben. Etwas mehr Schreibaufwand, den Claude übernimmt.

---

### ADR-003: React 19 mit React Compiler

**Kontext:** Die Oberfläche braucht ein Framework, das DOM und Zustand synchron hält. Kandidaten waren React, Svelte 5 und Vue 3.

**Entscheidung:** React 19 mit aktiviertem React Compiler und den Lint-Regeln von `eslint-plugin-react-hooks` einschließlich der Compiler-Prüfungen.

**Betrachtete Optionen:**

| Option | Vorteile | Nachteile |
|---|---|---|
| React | Größte Verbreitung, meiste Routine bei der Codeerzeugung, großes Ökosystem, Marktwert der Kenntnisse | Mehr Code; Animationen nur mit Bibliothek; Fehlerquellen bei Effekten |
| Svelte 5 | Wenig Code, eingebaute Animationen, gekapseltes CSS | Kleineres Ökosystem; Risiko veralteter Syntax bei der Codeerzeugung |
| Vue 3 | Ausgewogen, eingebaute Übergänge | Kein entscheidender Vorteil; zwei API-Stile |

**Abwägung:** Bei gleich schönem Ergebnis und gleicher spürbarer Leistung gaben Verbreitung, Routine und der Wert über das Projekt hinaus den Ausschlag.

**Konsequenzen:** Effekte mit falschen Abhängigkeiten werden durch Lint-Regeln und Compiler abgefangen; `useEffect` wird sparsam eingesetzt. Ein späterer Wechsel betrifft nur `ui` (ADR-006).

---

### ADR-004: Motion für Animationen

**Kontext:** Die Inszenierung ist Kern des Erlebnisses (Z-03). React bringt keine Animationen mit. Animationen über React-Zustand pro Bild würden auf älteren Geräten ruckeln.

**Entscheidung:** Motion (`motion/react`) für alle Animationen. Animiert wird über Motion-Werte, nie über React-Zustand pro Bild.

**Betrachtete Optionen:** CSS-Animationen und Web Animations API direkt (keine Abhängigkeit, aber mehr eigener Code für Glücksrad und Abläufe); React Spring (kleinere Verbreitung).

**Konsequenzen:** Eine zusätzliche Abhängigkeit mit hoher Verbreitung. Dauern und Kurven kommen aus den Tokens.

---

### ADR-005: Vite als Build-Werkzeug

**Kontext:** TypeScript und JSX müssen übersetzt und gebündelt werden; die Entwicklung braucht eine schnelle Vorschau, auch auf Mobilgeräten.

**Entscheidung:** Vite mit `@vitejs/plugin-react` und `vite-plugin-pwa`; Vitest nutzt dieselbe Konfiguration.

**Betrachtete Optionen:** webpack (langsamer, aufwendig zu konfigurieren); Create React App (eingestellt); Next.js (für Apps mit Server, widerspricht RB-02).

**Konsequenzen:** Schnelle Vorschau, Dateinamen mit Prüfsummen als Grundlage für ADR-015, App und Tests werden identisch übersetzt.

---

### ADR-006: Framework-freie Fachlogik in Schichten

**Kontext:** Fairness, Regeln und Daten sind der wertvollste und am strengsten zu prüfende Teil. Sie sollen unabhängig von Oberfläche und Speicher testbar und langlebig sein (NFA-EW-01 bis -07).

**Entscheidung:** Schichten `core`, `games`, `app`, `infra`, `ui`, `sw` mit den Abhängigkeitsregeln aus Kapitel 4.2, geprüft durch dependency-cruiser.

**Betrachtete Optionen:** Logik in Komponenten (schnell begonnen, schlecht testbar, an React gebunden).

**Konsequenzen:** Etwas mehr Struktur am Anfang; dafür vollständig testbare Fachlogik und austauschbare Oberfläche und Datenbank.

---

### ADR-007: IndexedDB mit Dexie, eine Datenbank

**Kontext:** Eine Web-App kann nur Browserspeicher nutzen. Gebraucht werden dauerhafte Speicherung, Transaktionen über mehrere Datenarten und Schema-Migrationen.

**Entscheidung:** IndexedDB über Dexie, eine Datenbank `boardbrain` mit den Stores aus Kapitel 7.3, `dexie-react-hooks` für Ansichten.

**Betrachtete Optionen:**

| Option | Bewertung |
|---|---|
| `localStorage` | Zu klein, synchron, keine Transaktionen |
| IndexedDB ohne Bibliothek | Umständliche Schnittstelle, Migrationen selbst bauen |
| `idb` | Dünne Hülle, mehr Eigenbau |
| SQLite oder PGlite (WebAssembly) | Relationale Abfragen, aber 1 bis 3 MB Download, mehr Technik, auf iOS fehleranfälliger; keine höhere Datensicherheit |
| Mehrere Datenbanken | Transaktionen wirken nur innerhalb einer Datenbank |

**Konsequenzen:** Kein Fremdschlüsselschutz durch die Datenbank; Invarianten prüft `core/model`. Statistik wird in TypeScript berechnet.

---

### ADR-008: Englische Bezeichner, deutsche Kommentare

**Status:** Angenommen; für Kommentare ersetzt durch ADR-027 (07.10.2026)

**Kontext:** Bibliotheken und Werkzeuge sind englisch; die Fachsprache und der Product Owner sind deutsch. Gemischte Bezeichner (`setSieger`, `partienCount`) sind schwer lesbar.

**Entscheidung:** Bezeichner, Dateinamen und das Exportformat sind englisch; Kommentare, Commit-Nachrichten und Dokumentation deutsch; die Zuordnung in Kapitel 4.5 ist verbindlich. Sichtbare Texte stehen ohnehin in den Sprachdateien.

**Betrachtete Optionen:** Deutsche Bezeichner (näher an der Fachsprache, aber Mischformen mit englischen APIs und Umlautprobleme).

**Konsequenzen:** Einheitlicher Code; die Begriffstabelle ist Teil von `CLAUDE.md`. Codeskizzen in früheren Gesprächen mit deutschen Bezeichnern dienten nur der Veranschaulichung.

---

### ADR-009: Zufallsquelle und Verwerfungsverfahren

**Kontext:** NFA-ZF-01 bis -03 verlangen kryptografisch sicheren, verzerrungsfreien und austauschbaren Zufall.

**Entscheidung:** Schnittstelle `RandomSource`; einzige Produktivimplementierung über `crypto.getRandomValues` mit Puffer; Umrechnung per Verwerfungsverfahren (Kapitel 6.2); `Math.random` per Lint-Regel verboten, auch für dekorative Zwecke.

**Betrachtete Optionen:** Modulo-Umrechnung (verzerrt); Gleitkomma-Umrechnung `Math.floor(x / 2^32 * n)` (ebenfalls verzerrt); externe Zufallsdienste (online, widerspricht NFA-PL-03).

**Konsequenzen:** Exakt nachweisbare Gleichverteilung; reproduzierbare Tests durch Austausch der Quelle.

---

### ADR-010: Sackgassen: verdeckte Vorausberechnung

**Kontext:** Bei 4 Personen kann die Platzierung in eine Sackgasse laufen. Nutzer dürfen sie nie sehen, bestätigte Gebäude nie verschwinden (E-09, US-PL-02 AK-4).

**Entscheidung:** Strategie `RetryOnDeadEnd` hinter der Schnittstelle `BuildingPlanner`: alle verbleibenden Gebäude verdeckt losen, bei Sackgasse neu losen, dann schrittweise anzeigen; der Plan wird mit der Sitzung gespeichert. Straßen werden im jeweiligen Schritt gelost.

**Betrachtete Optionen:** Gebäude einzeln losen und bei Sackgasse zurücksetzen (sichtbar, widerspricht E-09); vorausschauende Gültigkeit (Variante A, geparkt als PP-14).

**Konsequenzen:** Einfach und nachvollziehbar; Gesamtverteilung bedingt auf Durchläufe ohne Sackgasse (bewusst akzeptiert, 3.2). Variante A ist als zweite Implementierung nachrüstbar.

---

### ADR-011: UUID Version 4 als Kennungen

**Kontext:** Unabhängig angelegte Datensätze auf verschiedenen Geräten dürfen nie kollidieren (3.9, NFA-DH-05).

**Entscheidung:** `crypto.randomUUID()` für alle Datensätze; Catan mit fester Kennung `c47a0000-0000-4000-8000-000000000001`.

**Betrachtete Optionen:** UUID Version 7 (zeitlich sortierbar, enthält aber den Anlagezeitpunkt und weniger Zufall; Sortierung brauchen wir nicht über Kennungen); fortlaufende Nummern (kollidieren zwischen Geräten).

**Konsequenzen:** Kollisionsfrei, synchronisationstauglich. Erfordert einen sicheren Kontext, auch beim lokalen Testen (mkcert).

---

### ADR-012: Exportformat: versioniertes JSON, kein QR-Code

**Kontext:** Exporte dienen der Sicherung und dem Austausch und müssen mit späteren Versionen lesbar bleiben (NFA-DH-04). Ein QR-Code wurde ausdrücklich nicht gewünscht.

**Entscheidung:** JSON mit Hülle (`format`, `formatVersion`, `appVersion`, `exportedAt`, `scope`, `data`, bei Vollsicherung `settings` und `appState`); Migrationskette; Schemaprüfung mit Valibot; Weitergabe über das Teilen-Menü bzw. Download; Endung `.json`.

**Betrachtete Optionen:** Eigene Endung `.boardbrain` (auf iOS unzuverlässig in der Dateiauswahl); komprimiertes Format (unlesbar, unnötig); Prüfsumme (verhindert bewusste Handkorrektur, Schemaprüfung genügt); QR-Code (zu geringe Kapazität, nicht gewünscht).

**Konsequenzen:** Lesbare, robuste Dateien; je Formatversion eine dauerhafte Beispieldatei für Tests.

---

### ADR-013: Sicherungspunkte im Exportformat in derselben Datenbank

**Kontext:** Sicherungspunkte müssen atomar mit der auslösenden Änderung entstehen und auch nach Updates wiederherstellbar sein.

**Entscheidung:** Sicherungspunkte enthalten ein Exportobjekt (`scope.type = 'snapshot'`) und liegen im Store `snapshots` derselben Datenbank. Wiederherstellung über die Migrationskette des Exportformats.

**Betrachtete Optionen:** Kopie der Datenbank-Stores im internen Format (nach Schemaänderungen nicht mehr lesbar); separate Datenbank (keine gemeinsame Transaktion).

**Konsequenzen:** Eine einzige Lese- und Migrationslogik für Import und Wiederherstellung; Sicherungspunkt und Änderung sind immer konsistent.

---

### ADR-014: Laufende Partie: erst speichern, dann zeigen

**Kontext:** Die laufende Partie muss jeden Neustart überstehen, auch wenn das Betriebssystem die App beendet (US-AB-05).

**Entscheidung:** Jeder Schritt wird gelost und dauerhaft gespeichert, bevor seine Animation beginnt; Bestätigungen werden ebenfalls sofort gespeichert. Eine unterbrochene Animation wird nach dem Neustart mit demselben Ergebnis erneut abgespielt.

**Betrachtete Optionen:** Speichern erst nach Bestätigung (ein Neustart würde neu losen); Ergebnis nach Neustart ohne Animation zeigen (nimmt die Spannung, obwohl vermutlich niemand das Ergebnis gesehen hat).

**Konsequenzen:** Ein Schreibvorgang je Schritt; bei der geringen Datenmenge unkritisch.

---

### ADR-015: Kontrollierte Update-Umschaltung

**Kontext:** Das Standardverhalten von Service Workern aktiviert neue Versionen beim Neustart ohne Zustimmung. FA-UP-02 verlangt ausdrückliche Bestätigung und keine Updates während einer Partie; FA-UP-03 einen Sicherungsdialog.

**Entscheidung:** Eigener Service Worker mit einem Cache je Build und einem Zeiger auf die aktive Version (Kapitel 11). Umschaltung nur auf Befehl der App nach Sicherungsdialog und Sicherungspunkt „Vor Update“.

**Betrachtete Optionen:**

| Option | Bewertung |
|---|---|
| Standardverfahren (`registerType: 'prompt'`) | Einfach, aber Aktivierung beim nächsten Kaltstart ohne Zustimmung; widerspricht FA-UP-02 |
| Automatische Updates | Widerspricht FA-UP-02 |
| Kontrollierte Umschaltung | Erfüllt die Anforderungen; rund 150 Zeilen eigener Code, sorgfältige Tests nötig |

**Konsequenzen:** Der Service Worker muss abwärtskompatibel bleiben und darf keine App-Logik enthalten. Update-Abläufe sind fester Bestandteil der Ende-zu-Ende-Tests.

---

### ADR-016: Nutzung unter iOS nur installiert; persistenter Speicher

**Kontext:** Unter iOS und iPadOS haben installierte Web-App und Safari-Tab getrennte Speicher. Daten aus dem Tab fehlen in der App. Browser können Daten bei Speicherknappheit löschen, wenn kein persistenter Speicher gewährt ist.

**Entscheidung:** Unter iOS und iPadOS zeigt die App im Browser ausschließlich eine Installationsanleitung. Auf allen Plattformen fordert sie persistenten Speicher an, zeigt seinen Status und warnt, wenn er fehlt.

**Betrachtete Optionen:** Nutzung im Tab mit Dauerwarnung; einmaliger Hinweis. Beide würden Datenverlust oder fehlende Daten in Kauf nehmen.

**Konsequenzen:** Kein Ausprobieren ohne Installation unter iOS (Installation dauert Sekunden). Unter Android und Windows teilen Tab und installierte App ihre Daten; dort genügt ein Hinweis.

---

### ADR-017: Ton über Web Audio mit Audio-Session „ambient“

**Kontext:** Dezente Soundeffekte (FA-IN-03), abschaltbar (FA-IN-05), ohne Musik anderer Apps zu unterbrechen und mit Rücksicht auf die Stummschaltung (FA-IN-07).

**Entscheidung:** Web Audio API, Freischaltung beim Start der Generierung, `navigator.audioSession.type = 'ambient'` wo verfügbar, eigener Tonschalter.

**Betrachtete Optionen:** HTML-Audioelemente (höhere Latenz, unterbrechen unter iOS eher andere Wiedergabe); Audio-Session „playback“ (ignoriert den Stummschalter, unterbricht Musik).

**Konsequenzen:** Auf Plattformen ohne Audio-Session-Steuerung entscheidet der Browser über das Verhalten bei Stummschaltung; der Tonschalter der App greift immer.

---

### ADR-018: Eigene Textlösung und Design-Tokens als CSS-Variablen

**Kontext:** NFA-I18N-01/-02 verlangen ausgelagerte Texte, NFA-GB-05 zentrale Farben; beides soll automatisch prüfbar sein.

**Entscheidung:** Typisiertes Textobjekt `de.ts` mit `t()`, `Intl` für Formate, `react/jsx-no-literals`. Tokens als CSS-Variablen in `tokens.css`, CSS Modules für Komponenten, Stylelint- und ESLint-Regeln gegen Farbwerte außerhalb der Tokens.

**Betrachtete Optionen:** i18next oder ähnliche Bibliotheken (mächtiger als nötig); CSS-in-JS oder Tailwind (Farben schwerer zentral zu erzwingen).

**Konsequenzen:** Keine zusätzlichen Abhängigkeiten; fehlende Texte und unzulässige Farben fallen beim Bauen auf.

**Hinweis (0.4):** Die Regel gegen feste Texte setzt seit dem Setup ADR-026 um; `react/jsx-no-literals` entfällt. Die Entscheidung selbst bleibt unverändert.

---

### ADR-019: Hash-Routing mit React Router; Zustand für Sitzungszustand

**Kontext:** Die App braucht Navigation mit funktionierender Zurück-Taste unter Android, ohne Serverkonfiguration auf GitHub Pages; die laufende Partie braucht einen gemeinsamen Zustand über mehrere Ansichten.

**Entscheidung:** React Router mit Hash-Routing; Zustand für Sitzung und Vorbereitung; gespeicherte Daten über `useLiveQuery`.

**Betrachtete Optionen:** Pfad-Routing (braucht Umleitungstricks auf GitHub Pages); eigene Navigation ohne Bibliothek (Zurück-Taste aufwendig); React Context mit `useReducer` (möglich, aber mehr Code und unnötige Neuberechnungen).

**Konsequenzen:** Adressen enthalten `#`, was für eine installierte App unsichtbar ist.

---

### ADR-020: Teststrategie für den Zufall

**Kontext:** Fairness ist das wichtigste Qualitätsmerkmal. Statistische Tests allein können Verzerrungen nur wahrscheinlich erkennen und schlagen gelegentlich zufällig fehl.

**Entscheidung:** Dreistufig: exakter Nachweis der Umrechnung durch vollständiges Durchzählen; deterministische Tests und Eigenschaftstests für Regeln und Abläufe; Chi-Quadrat-Tests mit dem echten Generator (100.000 Ziehungen, α = 0,001, eine Wiederholung bei Fehlschlag) in einer eigenen Suite.

**Betrachtete Optionen:** Nur Chi-Quadrat-Tests (kein exakter Nachweis, häufigere Fehlalarme); fester Startwert für alle Tests (prüft nicht den echten Generator).

**Konsequenzen:** Hohe Sicherheit bei vertretbarer Laufzeit; die statistische Suite läuft vor Merges nach `main`, nicht bei jedem Speichern.

---

### ADR-021: Eigene SVG-Diagramme

**Kontext:** Es gibt genau zwei Diagrammtypen (US-ST-04). Farben müssen aus Tokens, Texte aus Sprachdateien stammen.

**Entscheidung:** Zwei eigene SVG-Komponenten; Daten aus `core/stats`.

**Betrachtete Optionen:** Chart.js oder Recharts (schneller eingebaut, eigene Farb- und Textlogik, zusätzliche Abhängigkeit).

**Konsequenzen:** Volle Kontrolle über Darstellung und Barrierefreiheit; weitere Diagramme (PP-16) erfordern eigene Arbeit.

---

### ADR-022: Hosting auf GitHub Pages mit eigener Herkunft

**Status:** Angenommen (Setup-Planung, 06.10.2026; klärt OP-12)

**Kontext:** Die Herkunft (Schema, Domain, Port) bestimmt, welche Daten eine Web-App sieht. Alle Projektseiten unter `‹konto›.github.io/‹projekt›/` teilen sich eine Herkunft. Ein späterer Adresswechsel trennt Nutzer von ihren Daten; sie müssten exportieren und importieren.

**Entscheidung:** Kostenlose GitHub-Organisation `boardbrain`, Repository `boardbrain.github.io`; die App liegt unter `https://boardbrain.github.io/` mit eigener Herkunft und Wurzelpfad `/`. Quellcode und Veröffentlichung liegen im selben Repository. Datenbankname `boardbrain`. Keine öffentlichen Vorschauversionen. Die Organisation und das Repository werden nie umbenannt.

**Betrachtete Optionen:**

| Option | Bewertung |
|---|---|
| Organisationsseite (gewählt) | Eigene Herkunft, kurze Adresse, kostenlos; Repository-Name ist vorgegeben |
| Projektseite in eigener Organisation | Faktisch eigene Herkunft, solange kein anderes Repository der Organisation Pages nutzt; längerer Pfad in Vite, Manifest und Service Worker |
| Projektseite unter dem persönlichen Konto | Teilt die Herkunft mit allen Pages-Projekten des Kontos |
| Zweites persönliches Konto | Verstößt gegen die Nutzungsbedingungen von GitHub |
| Kostenlose Subdomain eines Dritten (z. B. js.org) | Abhängig von Ehrenamtlichen; bei Entzug ist die Herkunft verloren |
| Eigene Domain | Kostenpflichtig (RB-01) |
| Cloudflare Pages oder Netlify | Eigene Subdomain kostenlos; zusätzliches Konto, Abweichung von E-05 ohne Mehrwert |

**Konsequenzen:** Die Adresse steht vor der ersten Veröffentlichung fest und bleibt unverändert. Der persönliche Kontoname erscheint nicht in der Adresse.

---

### ADR-023: Branch- und Release-Modell

**Status:** Angenommen

**Kontext:** EP-02 bis EP-05 verlangen einen `main`-Branch nur mit Releases, Entwicklung in separaten Branches und Releases nach Semantic Versioning. Der Product Owner arbeitet allein, Claude Code schreibt den Großteil des Codes, und eine schnelle Umsetzung hat Vorrang (E-22).

**Entscheidung:** Schlankes Git Flow mit `main` (Releases), `develop` (Standard-Branch, Integration) und kurzlebigen Arbeitsbranches für Story-Bündel; Squash merge nach `develop`, Merge commit nach `main`; Conventional Commits für die Titel der Pull Requests; Veröffentlichung ausschließlich durch Tags `v*` auf `main`, durchgesetzt durch Workflow, Umgebungsschutz und Tag-Schutz (16.3).

**Betrachtete Optionen:**

| Option | Bewertung |
|---|---|
| GitHub Flow (nur `main` und Feature-Branches) | `main` enthielte vor 1.0 unfertige Stände; widerspricht EP-02 |
| Vollständiges Git Flow mit `release/…`-Branches | Zusätzlicher Aufwand ohne Nutzen für einen Einzelentwickler |
| Squash auch nach `main` | Zerstört die gemeinsame Geschichte von `main` und `develop`; jeder folgende Release-PR zeigte alte Änderungen erneut |
| Release-Automatisierung (release-please, semantic-release) | Lohnt erst bei vielen Releases; release-please wäre eine Action eines Dritten |

**Konsequenzen:** Auf `develop` steht ein Commit je Bündel; jedes Release ist ein Merge-Commit auf `main` mit Tag. Zwischencommits bleiben im Pull Request einsehbar. Nur der Product Owner mergt (EP-11).

---

### ADR-024: Prettier als Formatierer

**Status:** Angenommen

**Kontext:** Der Stack enthielt keinen Formatierer. Einheitliche Formatierung macht Änderungen lesbar und erspart Diskussionen über Form.

**Entscheidung:** Prettier für Code, CSS, JSON und YAML mit einfachen Anführungszeichen, Zeilenlänge 100 und LF; `eslint-config-prettier` schaltet kollidierende ESLint-Regeln ab; VS Code formatiert beim Speichern; `npm run check` prüft die Formatierung. `docs/` ist ausgenommen, weil Prettier Markdown-Tabellen auf gleiche Spaltenbreite auffüllt und kleine Änderungen so zu großen Änderungen machen würde.

**Betrachtete Optionen:**

| Option | Bewertung |
|---|---|
| Prettier (gewählt) | Standard neben ESLint, formatiert alle benötigten Dateiarten |
| Biome | Deutlich schneller, Formatierer und Linter in einem; die benötigten ESLint-Regeln (React Hooks und Compiler, `jsx-no-literals`, typbasierte Prüfungen, Projektregeln) fehlen, sodass zwei überlappende Werkzeuge entstünden |
| dprint | Schnell, weniger verbreitet; kein Vorteil für dieses Projekt |
| ESLint Stylistic | Formatierung über Lint-Regeln; langsamer und aufwendiger zu konfigurieren |

**Konsequenzen:** Eine zusätzliche Entwicklungsabhängigkeit; keine Formfragen in Pull Requests.

---

### ADR-025: Fehlerbehandlung mit Ergebnistyp

**Status:** Angenommen

**Kontext:** Ein großer Teil der Abläufe kennt erwartbare Fehlschläge (Eingaben, Importdateien, Sperren). Geworfene Ausnahmen sind in TypeScript nicht typisiert und werden leicht vergessen.

**Entscheidung:** Erwartbare Fehler werden als `Result<T, E>` mit typisiertem Fehlercode zurückgegeben; unerwartete Fehler werden geworfen und an den Grenzen aufgefangen (4.6). Der Ergebnistyp ist eine kleine eigene Lösung in `core/shared`.

**Betrachtete Optionen:**

| Option | Bewertung |
|---|---|
| Eigener Ergebnistyp (gewählt) | Wenige Zeilen, vollständig typisiert, keine Abhängigkeit |
| Ausnahmen für alles | Fehlerfälle sind im Typ nicht sichtbar und werden leicht übersehen |
| Bibliothek (z. B. neverthrow) | Mehr Komfort, aber eine Abhängigkeit für eine triviale Aufgabe (Architektur 3.2) |

**Konsequenzen:** TypeScript erzwingt die Behandlung beider Fälle; Fehlercodes werden über die Sprachdatei übersetzt.

---

### ADR-026: ESLint 10 ohne eslint-plugin-react

**Status:** Angenommen (Setup, 07.10.2026; Entscheidung des Product Owners; ergänzt ADR-018)

**Kontext:** `eslint-plugin-react` 7.37.5 (letztes Release April 2025) unterstützt ESLint nur bis Version 9; aktuell ist ESLint 10. Gebraucht werden aus dem Plugin nur wenige Regeln: keine festen Texte in JSX (`jsx-no-literals`), kein `dangerouslySetInnerHTML` (`no-danger`), kein Index als `key`, nur Funktionskomponenten.

**Entscheidung:** ESLint 10. Die benötigten Regeln werden mit der eingebauten Regel `no-restricted-syntax` nachgebildet und melden auf Deutsch, welche Projektregel verletzt ist. Jede Ersatzregel ist durch einen Negativtest belegt. Bedingung des Product Owners war, dass alle übrigen ESLint-Plugins ESLint 10 unterstützen: typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-jsdoc und eslint-plugin-testing-library nennen ESLint 10 ausdrücklich, @vitest/eslint-plugin wird mit ESLint 10 getestet; eslint-plugin-check-file (`>=9`) und eslint-config-prettier (`>=7`) erlauben es über offene Versionsbereiche und wurden praktisch geprüft.

**Betrachtete Optionen:**

| Option | Bewertung |
|---|---|
| ESLint 10 mit Ersatzregeln (gewählt) | Aktuelle, gepflegte Version; eine Abhängigkeit weniger; Regeln prüfen nur die Syntax |
| ESLint 9.39 mit eslint-plugin-react | Entspricht dem bisherigen Wortlaut, aber ESLint 9 läuft aus; ein Umstieg wäre bald nötig |
| `@eslint-react/eslint-plugin` | Zusätzliche Abhängigkeit, ohne Regel gegen feste Texte |
| eslint-plugin-react unter ESLint 10 erzwingen | Nicht unterstützt, fehleranfällig |

**Konsequenzen:** Der Index als `key` wird nur an den üblichen Namen `i`, `idx` und `index` erkannt, Klassenkomponenten nur bei direkter Ableitung von `Component` oder `PureComponent`; der Rest bleibt Review. Unterstützt eslint-plugin-react später ESLint 10, kann es die Ersatzregeln wieder ablösen (neue ADR).

---

### ADR-027: Code durchgehend englisch

**Status:** Angenommen (Setup, 07.10.2026; Entscheidung des Product Owners; ersetzt ADR-008 für Kommentare)

**Kontext:** ADR-008 legte englische Bezeichner und deutsche Kommentare fest, Entwicklungsrichtlinien 8.2 deutsche Testnamen. Der Product Owner hat im Setup entschieden, dass Code immer englisch ist.

**Entscheidung:** Code- und Konfigurationsdateien sind vollständig englisch: Bezeichner, alle Kommentare (`//`, `/* … */`, `/** … */`, `#`) einschließlich Doku-Kommentaren, Testnamen, Fehler- und Protokollmeldungen, Meldungen der Prüfwerkzeuge und Namen von Workflow-Schritten. Anforderungs-IDs werden weiterhin genannt, z. B. `// FA-PL-03: distance rule` oder `describe('US-AB-03 Repeat step')`. Deutsch bleiben nur die Texte der Oberfläche in `src/i18n/de.ts` (die App ist deutsch, NFA-I18N) sowie Dokumentation (`docs/` und Markdown-Dateien), Commit-Nachrichten und Pull Requests.

**Betrachtete Optionen:** Deutsche Kommentare und Testnamen (ADR-008, Entwicklungsrichtlinien 8.2, bisher); nur Kommentare englisch (uneinheitlich).

**Konsequenzen:** Code liest sich durchgehend englisch, passend zu Bezeichnern und Bibliotheken. Fachbegriffe folgen der Zuordnung in 4.5. Tests finden Elemente der Oberfläche weiterhin über deren deutsche Beschriftung. Die Sprache wird nicht automatisch geprüft (Review).

---

## 18. Risiken und offene Punkte

### 18.1 Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Fehler im eigenen Service Worker | App startet nicht oder aktualisiert sich nicht | Minimaler Umfang ohne App-Logik; Ende-zu-Ende-Tests mit zwei Builds; Abnahme auf allen Geräten |
| Apple ändert das Verhalten von Web-Apps unter iOS | Installation oder Speicher beeinträchtigt | Vollsicherung als Rückfallebene; Abnahme bei jedem Release; Beobachtung der WebKit-Ankündigungen |
| Brave unter Android installiert nur als Verknüpfung | Kein Vollbild oder kein persistenter Speicher | Frühe Prüfung in Inkrement I1; Chrome als Ausweichbrowser |
| Browser löscht Daten (Einstellungen, Speicherknappheit) | Datenverlust | Persistenter Speicher, Warnung, Export-Erinnerung, Sicherungsdialog vor Updates |
| Fehlgeschlagene Datenmigration nach Update | Daten nicht nutzbar | Sicherungspunkt „Vor Update“; Migrationstests mit Beispieldaten |
| Subtile Fehler in React-Effekten | Fehlverhalten in Randfällen | React Compiler, Hooks-Lint-Regeln, sparsame Effekte, Komponenten- und Ende-zu-Ende-Tests |
| Veraltete Abhängigkeiten | Sicherheits- oder Kompatibilitätsprobleme | Dependabot (Sicherheitsupdates sofort, übrige monatlich gebündelt); wenige Abhängigkeiten |
| Große Story-Bündel werden nicht vollständig gelesen | Code ist schwerer nachzuvollziehen (RB-04) | Pull-Request-Beschreibung nach Vorlage; Anforderungs-IDs im Code; strenge automatische Regeln; Bündel bei Fachlogik kleiner schneiden |
| Nutzungsgrenzen des Claude-Plans | Unterbrechungen während eines Bündels | Sonnet als Standard, Opus nur für Setup und kritische Teile (Anforderungsdokumentation 9.3) |

### 18.2 Offene Punkte

| ID | Punkt | Phase |
|---|---|---|
| OP-12 | Dauerhafte Adresse der App | Setup – geklärt: ADR-022 |
| OP-13 | Vorabversionen der echten App vor 1.0 | Umsetzung, nach I2 |
| OP-06 | Visuelle Gestaltung von Glücksrad, Aufblinken und Klängen | Design |
| OP-11 | Konkrete Farbwerte der Paletten | Design |

---

## 19. Nächste Schritte

1. **Setup-Phase** mit Claude Code nach `docs/Setup-Anleitung.md`, bis alle Punkte der `docs/Setup-DoD.md` erfüllt sind; Abschluss mit Release 0.1.0.
2. **Design:** OP-06 und OP-11.
3. **Umsetzung ab Inkrement I1** in Story-Bündeln (EP-10): zuerst `core/random`, `core/board` und `core/placement` mit ihren Tests, weil dort die strengsten Prüfkriterien gelten; in I1 außerdem Manifest und minimaler Service Worker, um die Installation unter Brave für Android früh zu prüfen (18.1).
4. **Nach I2:** Entscheidung über Vorabversionen (OP-13).
