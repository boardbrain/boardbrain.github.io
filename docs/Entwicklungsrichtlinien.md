# BoardBrain – Entwicklungsrichtlinien

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Verbindliche Arbeitsregeln für Code, Tests, Git, Abhängigkeiten und Dokumentation (EP-12) |
| Version | 0.5 |
| Status | Verbindlich ab der Setup-Phase |
| Stand | 08.10.2026 |
| Grundlage | BoardBrain_Anforderungsdokumentation.md v0.8, BoardBrain_Spezifikation.md v0.5, BoardBrain_Architektur.md v0.2 |
| Kurzfassung | `CLAUDE.md` im Wurzelordner des Repositorys |
| Sprache | Deutsch |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 06.10.2026 | Erstfassung aus der Setup-Planung |
| 0.2 | 07.10.2026 | Ergebnisse des Setups: keine Hinweise auf Claude in Commits und Pull Requests (3.3); Markdown von Prettier ausgenommen (4.2); ESLint-Regeln ohne `eslint-plugin-react` (5, 13; Architektur ADR-026); Node.js 26 vor LTS-Einstufung (10.3); Code durchgehend englisch, auch Kommentare und Testnamen (4.3, 4.6, 8.2; Architektur ADR-027) (PR #2) |
| 0.3 | 07.10.2026 | Aufträge an Claude Code verweisen auf `docs/Umsetzungsplan.md` (14) |
| 0.4 | 07.10.2026 | Namensregel für React-Kontexte (4.3) (PR #12) |
| 0.5 | 08.10.2026 | Designvorschläge vor dem Bau neuer oder geänderter Oberflächen (2.2, 2.5); Lehre aus I1-C, wo der Product Owner nach der Umsetzung einen anderen Aufbau wollte |

## Inhaltsverzeichnis

1. Zweck und Geltung
2. Arbeitsweise
3. Git und GitHub
4. TypeScript und Code-Stil
5. Architekturregeln
6. React und Oberfläche
7. Fehlerbehandlung
8. Tests
9. Sicherheit
10. Abhängigkeiten
11. Dokumentation
12. Definition of Done
13. Übersicht: automatisch geprüfte Regeln
14. Arbeit mit Claude Code

---

## 1. Zweck und Geltung

Diese Richtlinien sind die ausführliche Referenz zum Nachschlagen. Sie gelten für alle Beiträge zum Repository, gleich ob von Claude Code oder vom Product Owner. Die Datei `CLAUDE.md` fasst sie für Claude Code verbindlich zusammen; bei Abweichungen gilt dieses Dokument.

Rangfolge bei Widersprüchen: Anforderungsdokumentation, Spezifikation, Architektur, dann diese Richtlinien. Widersprüche werden nicht stillschweigend aufgelöst, sondern als Haltepunkt gemeldet (2.3) und in allen betroffenen Dokumenten bereinigt.

Wo eine Regel automatisch geprüft wird, steht das in der jeweiligen Tabelle; Kapitel 13 fasst alle automatischen Prüfungen zusammen. Regeln ohne automatische Prüfung werden im Pull Request geprüft („Review“).

Leitlinie: **Schnelle Umsetzung hat Vorrang vor feingranularer Steuerung** (E-22). Aufwand bleibt dort, wo die Anforderungen ihn verlangen: Fairness des Zufalls, Datensicherheit und die Nachvollziehbarkeit des Codes (RB-04).

---

## 2. Arbeitsweise

### 2.1 Rollen

| Rolle | Aufgabe |
|---|---|
| Product Owner | Entscheidet über Anforderungen und Haltepunkte, nimmt jeden Pull Request lokal ab und mergt ihn (EP-11), löst Releases aus |
| Claude Code | Setzt Story-Bündel eigenständig um, schreibt Tests und Dokumentation, eröffnet Pull Requests, bereitet Releases vor (EP-10) |

### 2.2 Ablauf eines Story-Bündels

Ein **Story-Bündel** ist eine Gruppe zusammengehöriger User Stories, die gemeinsam umgesetzt und abgenommen wird, etwa „Personen und Gruppen“ (US-PG-01 bis US-PG-04). Je Inkrement gibt es etwa zwei bis vier Bündel; Fachlogik mit strengen Prüfkriterien wird kleiner geschnitten als Oberflächen. Der Zuschnitt wird zu Beginn eines Inkrements festgelegt.

1. **Auftrag:** Der Product Owner nennt das Bündel.
2. **Designvorschläge:** Enthält das Bündel eine neue oder sichtbar geänderte Oberfläche, zeigt Claude Code zuerst Designvorschläge (2.5) und baut erst nach der Wahl des Product Owners. *(neu in 0.5)*
3. **Umsetzung:** Claude Code legt den Arbeitsbranch von `develop` an, programmiert, schreibt Tests, aktualisiert betroffene Dokumente und committet in sinnvollen Zwischenschritten.
4. **Lokale Prüfung:** Claude Code führt `npm run check` und `npm run test:e2e` aus und behebt alle Fehler.
5. **Pull Request:** Claude Code pusht und eröffnet den Pull Request nach `develop` mit einer Beschreibung nach Vorlage (3.4), einschließlich Testanleitung für den Product Owner.
6. **Abnahme:** Claude Code startet den Entwicklungsserver mit diesem Stand; der Product Owner testet am PC und bei Bedarf auf Mobilgeräten. Gleichzeitig laufen die Prüfungen auf GitHub.
7. **Nachbesserung:** Rückmeldungen behebt Claude Code im selben Branch; der Pull Request aktualisiert sich.
8. **Merge:** Der Product Owner mergt (Squash).

### 2.3 Haltepunkte

Claude Code hält an und fragt den Product Owner, bevor es weitermacht, wenn

1. eine Anforderung oder ein Abnahmekriterium unklar oder widersprüchlich ist,
2. eine Lösung von der Architektur abweichen würde,
3. eine neue Abhängigkeit nötig wäre (Kapitel 10),
4. Anforderungsdokumentation oder Spezifikation geändert werden müssten.

Alles andere entscheidet Claude Code selbst und begründet es im Pull Request. Eine Frage an einem Haltepunkt enthält einen begründeten Vorschlag und die wichtigsten Alternativen.

### 2.4 Kleine Aufgaben

Fehlerbehebungen, Dokumentationsänderungen und Abhängigkeits-Updates folgen demselben Ablauf mit kleinerem Umfang. Die Abnahme richtet sich nach der Art der Änderung:

| Art | Abnahme durch den Product Owner |
|---|---|
| Oberfläche | App im Browser testen, bei Plattformthemen auf Mobilgeräten |
| Fachlogik ohne Oberfläche | Liste der Testfälle in Klartext und deren Ergebnis prüfen |
| Dokumentation | Änderungen lesen |
| Abhängigkeits-Updates | Kurzer Rundgang durch die App |

### 2.5 Designvorschläge *(neu in 0.5)*

Vor dem Bau einer neuen oder sichtbar geänderten Oberfläche (Ansicht, Ablauf, Farben) zeigt Claude Code mehrere Vorschläge. Das spart Rückschritte: Ein Aufbau lässt sich in einer Vorschau in Minuten ändern, in fertigem Code mit Tests erst nach Stunden.

- **Form:** eine lokale, klickbare HTML-Datei im Wurzelordner des Repositorys (z. B. `groups-preview.html`, `color-preview.html`), eingetragen in `.git/info/exclude` und damit nicht im Repository. Der Entwicklungsserver liefert sie mit aus, sodass der Product Owner sie auf allen Abnahmegeräten öffnen kann (`https://192.168.178.20:5173/‹datei›`).
- **Inhalt:** mindestens zwei, besser drei bis fünf deutlich verschiedene Ansätze, umschaltbar; Handy hochkant und Tablet quer; die echten Farbwerte aus `tokens.css` und realistische Datenmengen (auch eine volle Liste); bei Farben die Kontraste und Farbabstände als Zahl.
- **Ablauf:** Der Product Owner wählt, kombiniert oder wünscht weitere Varianten; jede Runde bleibt als eigene Datei zum Vergleich erhalten (`…-v1.html`). Die gewählte Variante hält Claude Code im Pull Request fest.
- **Ausnahme:** reine Fehlerbehebungen und Änderungen, die einem bereits gewählten Entwurf folgen.

---

## 3. Git und GitHub

### 3.1 Branch-Modell (ADR-023)

```
main      ●──────────────────────────────●──────────────  nur Releases (Tags v0.1.0, v1.0.0 …)
           \                            ╱ Release-PR (Merge commit)
develop     ●────●──────●──────●───────●───────────────  Integrationsstand, Standard-Branch
                ╱      ╱      ╱
Arbeits-   ●──●      ╱      ╱      je Bündel oder Aufgabe ein Branch (Squash merge)
branches        ●──●      ╱
                      ●──●
```

| Branch | Zweck | Entsteht aus | Geht nach |
|---|---|---|---|
| `main` | Nur Releases (EP-02); vor 1.0 nur der Platzhalter 0.1.0 | – | – |
| `develop` | Integrierter Entwicklungsstand; Standard-Branch auf GitHub | `main` (einmalig) | `main` per Release-PR |
| Arbeitsbranch | Ein Story-Bündel oder eine Aufgabe | `develop` | `develop` |
| `hotfix/…` | Dringender Fehler in einem Release | `main` | `main`, danach `main` per PR zurück nach `develop` |

Arbeitsbranches leben Stunden bis wenige Tage. Nach dem Merge löscht GitHub sie automatisch.

### 3.2 Branch-Namen

Schema: `‹typ›/‹beschreibung›`, klein geschrieben, Wörter mit Bindestrich, Beschreibung englisch. Bei Story-Bündeln steht die erste Story-ID vorn.

| Typ | Wofür | Beispiel |
|---|---|---|
| `feat` | Neue Funktion, Story-Bündel | `feat/us-pg-01-persons-and-groups` |
| `fix` | Fehlerbehebung | `fix/wheel-stops-early` |
| `refactor` | Umbau ohne Verhaltensänderung | `refactor/split-session-service` |
| `test` | Nur Tests | `test/placement-properties` |
| `docs` | Nur Dokumentation | `docs/architecture-16` |
| `chore` | Werkzeuge, Konfiguration, Release-Vorbereitung | `chore/setup-scaffold`, `chore/release-1.0.0` |
| `build`, `ci` | Build bzw. Workflows | `ci/cache-playwright` |
| `deps` | Abhängigkeiten | `deps/node-26` |
| `hotfix` | Dringender Fehler im Release | `hotfix/1.0.1-import-crash` |

Automatisch geprüft: nein (Review). Branches von Dependabot folgen dessen eigenem Schema.

### 3.3 Commit-Nachrichten und Titel von Pull Requests

Weil nach `develop` gesquasht wird, wird der **Titel des Pull Requests** zur Commit-Nachricht auf `develop`. Zwischencommits im Arbeitsbranch sind frei formuliert, sollen aber verständlich sein; sie verschwinden beim Squash.

Format nach Conventional Commits:

```
‹typ›(‹bereich›): ‹Beschreibung›
```

| Teil | Regel | Beispiel |
|---|---|---|
| Typ | Einer der Typen aus 3.2 sowie `release` und `revert` | `feat` |
| Bereich | Optional; Modulname englisch (`random`, `board`, `placement`, `draws`, `generation`, `results`, `stats`, `exchange`, `backup`, `model`, `catan`, `db`, `platform`, `audio`, `update`, `sw`, `ui`, `i18n`, `setup`) | `placement` |
| Beschreibung | Deutsch, beginnt klein oder mit einem Substantiv, ohne Schlusspunkt, höchstens 72 Zeichen insgesamt | `Gebäude zufällig platzieren` |

Beispiele:

```
feat(groups): Personen und Gruppen anlegen, bearbeiten, archivieren
fix(wheel): Glücksrad hält nicht mehr zu früh an
docs: Architektur 16.3 an Branch-Modell angepasst
deps: React auf 19.2 aktualisiert
release: 1.0.0
```

Bezüge stehen in der Beschreibung des Pull Requests, nicht im Titel: `Stories: US-PG-01 bis US-PG-04`, `Fixes #12`.

Commit-Nachrichten und Beschreibungen von Pull Requests enthalten **keine Hinweise auf Claude**: keine Zeile `Co-Authored-By: Claude …`, kein „Generated with Claude Code“. Claude Code ist dafür über `attribution` in `.claude/settings.json` eingestellt (Architektur 16.5).

Automatisch geprüft: ja, der Job `pr-title` prüft den Titel jedes Pull Requests mit commitlint.

### 3.4 Pull Requests

Jede Änderung an `develop` und `main` erfolgt per Pull Request (EP-04). Die Vorlage `.github/pull_request_template.md` gibt die Beschreibung vor:

| Abschnitt | Inhalt |
|---|---|
| Was | Kurze Zusammenfassung in Klartext |
| Stories und Abnahmekriterien | Enthaltene Stories; je Abnahmekriterium: automatisierter Test (Name) oder manueller Prüfschritt |
| Bewusst nicht enthalten | Was fehlt oder in ein späteres Bündel gehört |
| Entscheidungen | Was Claude Code selbst entschieden hat und warum |
| Testanleitung | Konkrete Schritte für die Abnahme, abgeleitet aus den Abnahmekriterien |
| Checkliste | Definition of Done (12.1) |

Erforderliche Freigaben: null. GitHub lässt niemanden seinen eigenen Pull Request freigeben; die Kontrolle liegt darin, dass nur der Product Owner mergt.

### 3.5 Merge-Arten

| Ziel | Merge-Art | Begründung |
|---|---|---|
| `develop` | Squash merge | Ein sauberer Commit je Bündel; einzeln rückgängig zu machen |
| `main` | Merge commit | `main` und `develop` behalten ihre gemeinsame Geschichte; der Merge-Commit trägt den Release-Tag |
| – | Rebase merge | Abgeschaltet |

Automatisch geprüft: ja, die Schutzregeln (Rulesets) erlauben je Branch nur die vorgesehene Art.

### 3.6 Prüfungen vor dem Merge

| Ziel | Lokal durch Claude Code vor dem Push | Auf GitHub (Merge gesperrt, bis bestanden) |
|---|---|---|
| `develop` | `npm run check`, `npm run test:e2e` | `check`, `e2e`, `pr-title` |
| `main` | zusätzlich `npm run test:stat` | zusätzlich `stat` und `guard-main` (nur aus `develop` oder `hotfix/…`) |

Details der Jobs: Architektur 16.3.

### 3.7 Versionierung

Semantic Versioning (EP-05), übertragen auf eine App:

| Stufe | Wann | Beispiel |
|---|---|---|
| MAJOR | Nutzer müssen etwas tun oder verlieren etwas, z. B. alte Exportdateien sind nicht mehr importierbar oder eine Plattform entfällt | sollte selten bis nie vorkommen |
| MINOR | Neue Funktionen, auch mit automatischer Datenmigration | Hellmodus, weiteres Spiel |
| PATCH | Nur Fehlerbehebungen | Absturz beim Import behoben |

Bis zum Release 1.0 steht in `package.json` eine Version `0.x.y`. Die App-Version ist unabhängig von der Schemaversion der Datenbank und der Version des Exportformats (Architektur 7.5).

### 3.8 Release-Ablauf

1. Claude Code legt `chore/release-x.y.z` von `develop` an, setzt die Version in `package.json`, ergänzt `CHANGELOG.md` und eröffnet den Pull Request nach `develop` (Titel `chore: Release x.y.z vorbereiten`).
2. Nach dem Merge eröffnet Claude Code den Pull Request `develop` → `main` mit Titel `release: x.y.z`.
3. Alle Prüfungen einschließlich der statistischen Suite laufen; der Product Owner führt die manuelle Abnahme nach `docs/Abnahme-Checkliste.md` durch (ab 1.0; beim Platzhalter 0.1.0 entfällt sie).
4. Der Product Owner mergt.
5. Nach Zustimmung des Product Owners erzeugt Claude Code das Release: `gh release create vx.y.z --target main --title "x.y.z" --notes-file ‹Auszug aus CHANGELOG›`. Der Tag löst die Veröffentlichung aus.
6. Der Product Owner prüft die veröffentlichte App unter `https://boardbrain.github.io/`.

`CHANGELOG.md` ist deutsch und folgt dem Aufbau von „Keep a Changelog“: je Version ein Abschnitt mit Datum und den Unterabschnitten *Neu*, *Geändert*, *Behoben*, *Entfernt*, *Sicherheit*. Claude Code erstellt die Einträge aus den Titeln der Pull Requests seit dem letzten Release und formuliert sie für Nutzer verständlich.

Ein Release-Tag kann weder verschoben noch gelöscht werden. Ist ein Release fehlerhaft, folgt ein neues mit erhöhter PATCH-Nummer.

### 3.9 Hotfix

1. `hotfix/x.y.z-beschreibung` von `main` anlegen, Fehler beheben, Version und `CHANGELOG.md` anpassen.
2. Pull Request nach `main` (Merge commit), Release wie in 3.8, Schritt 5.
3. Pull Request `main` → `develop`, damit die Korrektur nicht verloren geht.

### 3.10 Issues

Issues dienen nur für Fehler und technische Aufgaben, nie für Anforderungen; diese stehen in der Spezifikation. Ein Pull Request, der ein Issue erledigt, nennt `Fixes #‹Nummer›` in der Beschreibung.

---

## 4. TypeScript und Code-Stil

### 4.1 TypeScript

| Regel | Automatisch |
|---|---|
| Strikter Modus mit `noUncheckedIndexedAccess` (Zugriff auf Array-Elemente kann `undefined` liefern), `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` | ja, Compiler |
| Nur Syntax, die sich rückstandslos entfernen lässt: keine `enum`, keine `namespace`; stattdessen Vereinigungen von Zeichenketten (`'base' \| 'cities-and-knights'`) | ja, `erasableSyntaxOnly` |
| Kein `any`; für Unbekanntes `unknown` mit Prüfung | ja, ESLint |
| Keine Nicht-Null-Behauptung (`wert!`) | ja, ESLint |
| Keine Typbehauptung mit `as`, außer `as const`; in Tests erlaubt | ja, ESLint |
| `type` statt `interface`; Typimporte mit `import type` | ja, ESLint |
| Exportierte Funktionen haben ausdrückliche Rückgabetypen | ja, ESLint |
| `switch` über Vereinigungstypen behandelt jeden Fall | ja, ESLint |
| Daten in `core` sind unveränderlich: `readonly` in Typen, keine Änderung von Parametern; neue Objekte statt Mutation | teilweise; `readonly` per Review |
| Funktionen sind klein und haben eine Aufgabe; Richtwert höchstens etwa 40 Zeilen | nein (Review) |

### 4.2 Formatierung (ADR-024)

Prettier formatiert Code, CSS, JSON und YAML: einfache Anführungszeichen, Zeilenlänge 100, LF-Zeilenenden, sonst Standardwerte. Markdown ist ausgenommen (`docs/`, `README.md`, `CHANGELOG.md`, `CLAUDE.md`), weil Prettier Tabellen auf gleiche Spaltenbreite auffüllen würde. VS Code formatiert beim Speichern; `npm run format` formatiert alles.

Automatisch geprüft: ja, `prettier --check` in `npm run check`.

### 4.3 Namen

Code ist immer englisch: Bezeichner, Kommentare, Testnamen, Fehler- und Protokollmeldungen. Deutsch sind nur die Texte der Oberfläche in `src/i18n/de.ts`, die Dokumentation, Commit-Nachrichten und Pull Requests (Architektur ADR-008, ADR-027). Fachbegriffe folgen verbindlich der Zuordnung in Architektur 4.5.

| Element | Konvention | Beispiel | Automatisch |
|---|---|---|---|
| Typen, Komponenten | PascalCase, ohne Präfix `I` | `GroupForm`, `RandomSource` | ja |
| Variablen, Funktionen, Parameter | camelCase | `pickWinner` | ja |
| Echte Konstanten auf Modulebene | UPPER_SNAKE_CASE | `MAX_GROUP_SIZE` | ja |
| React-Kontexte (werden in JSX wie Komponenten verwendet) | PascalCase mit Endung `Context` | `AppDependenciesContext` | ja |
| Wahrheitswerte | Präfix `is`, `has`, `can`, `should` | `isArchived` | ja |
| Ereignis-Props und Behandler | `onX` bzw. `handleX` | `onSave`, `handleSave` | nein (Review) |
| Fehlercodes | kebab-case-Zeichenketten | `'group-full'` | nein (Review) |
| Textschlüssel | Bereich und Punkt, deutsch wie in Architektur 13.3 | `t('statistik.siege')` | ja (Typprüfung) |

Abkürzungen nur, wenn allgemein üblich (`id`, `url`). Namen beschreiben den Inhalt, nicht den Typ (`members`, nicht `memberArray`).

### 4.4 Dateien und Ordner

| Regel | Beispiel | Automatisch |
|---|---|---|
| Komponentendateien PascalCase, ihr CSS-Modul daneben | `GroupForm.tsx`, `GroupForm.module.css` | ja, ESLint `check-file` |
| Andere Dateien camelCase | `buildingPlanner.ts` | ja |
| Ordner klein, bei Bedarf mit Bindestrich | `core/placement/` | ja |
| Unit-Tests neben dem Code, Endung `.test.ts(x)`; statistische Tests `*.stat.test.ts` in `tests/statistical`; Ende-zu-Ende-Tests `*.spec.ts` in `tests/e2e` | `placement.test.ts` | ja (Testkonfiguration findet nur diese Muster) |
| Eine exportierte Komponente je Datei | – | nein (Review) |

### 4.5 Importe und Exporte

| Regel | Automatisch |
|---|---|
| Nur benannte Exporte; `export default` nur, wo ein Werkzeug es verlangt (Konfigurationsdateien) | ja, ESLint |
| Jedes Modul in `core` und jedes Spielmodul hat eine `index.ts` als öffentliche Schnittstelle; andere Module importieren nur darüber | ja, dependency-cruiser |
| Importe über Modulgrenzen mit dem Kurzpfad `@/` (`@/core/random`), innerhalb eines Moduls relativ | ja, ESLint |
| Keine zirkulären Abhängigkeiten | ja, dependency-cruiser |

### 4.6 Kommentare

| Regel | Automatisch |
|---|---|
| Kommentare und Doku-Kommentare englisch, in allen Code- und Konfigurationsdateien (Architektur ADR-027) | nein (Review) |
| Jede exportierte Funktion, Klasse und jeder exportierte Typ in `core`, `games` und `app` hat einen Doku-Kommentar (`/** … */`): was sie tut, und bei nicht offensichtlichen Entscheidungen warum | ja, ESLint `jsdoc` |
| Wo Code eine Anforderung umsetzt, nennt der Kommentar deren ID: `// FA-PL-03: distance rule` | nein (Review) |
| Kommentare erklären das Warum, nicht das Was | nein (Review) |
| Kein auskommentierter Code; `TODO` nur mit Bezug: `// TODO(#12): …` | nein (Review) |

Die Anforderungs-IDs im Code machen die Rückverfolgung möglich: Eine Suche nach `FA-PL-03` findet die Umsetzung.

---

## 5. Architekturregeln

Kurzfassung der Architektur; Details in BoardBrain_Architektur.md.

| Regel | Bezug | Automatisch |
|---|---|---|
| Schichten und erlaubte Abhängigkeiten: `core` ← `games` ← `app` ← `ui`; `infra` implementiert Schnittstellen; `sw` ist eigenständig | Architektur 4.1, 4.2 | ja, dependency-cruiser |
| `core` und `games` verwenden keine Browser-APIs (`window`, `document`, `navigator`, `indexedDB`, `localStorage`, `crypto`, `fetch`) und kein React, Dexie oder Motion | 4.2 | ja, ESLint und dependency-cruiser |
| Dexie wird nur in `infra/db` importiert; jeder Schreibzugriff läuft über Repositories in `infra/db`, aufgerufen aus Anwendungsdiensten | 4.4, 7.3 | ja, dependency-cruiser (Importe); Schreibzugriffe per Review |
| Die Oberfläche liest Daten über die Lesehooks aus `infra/db` und schreibt nur über Anwendungsdienste | 4.2, 13.2 | teilweise, dependency-cruiser |
| Anwendungsdienste definieren Transaktionsgrenzen und prüfen Sperren während einer laufenden Partie | 4.4, FA-AB-09 | nein (Review, Tests) |
| Kein `Math.random`, nirgends, auch nicht in Tests; Zufall nur über `RandomSource`; `crypto.getRandomValues` nur in `infra/random` | 6, NFA-ZF-01 | ja, ESLint |
| `crypto.randomUUID()` ist die einzige Quelle für Kennungen und wird nur in `infra` aufgerufen | 7.2, NFA-DH-05 | ja, ESLint |
| Keine festen Texte in der Oberfläche; alle Texte aus `src/i18n/de.ts` über `t()` | 13.3, NFA-I18N | ja, ESLint (`no-restricted-syntax`, Architektur ADR-026) und Typprüfung |
| Keine Farbwerte außerhalb von `src/ui/styles/tokens.css` | 13.4, NFA-GB-05 | ja, Stylelint und ESLint |
| Animationen nur über Motion; keine CSS-Animationen | 13.6 | ja, Stylelint |
| Erst speichern, dann zeigen: Das Ergebnis eines Schritts ist gespeichert, bevor die Animation beginnt | 10, ADR-014 | nein (Review, Ende-zu-Ende-Test) |
| Keine Netzwerkzugriffe außer im Service Worker und in `infra/update` | 12.4, NFA-DH-01 | ja, ESLint und Netzwerkwächter in Playwright |
| Zusammensetzung der Abhängigkeiten nur in `src/main.tsx` | 4.2 | nein (Review) |
| Spielmodule ändern keine anderen Spielmodule | NFA-EW-01 | ja, dependency-cruiser |

---

## 6. React und Oberfläche

| Regel | Automatisch |
|---|---|
| Nur Funktionskomponenten; Props als `type ‹Name›Props` | teilweise, ESLint |
| Regeln der Hooks und des React Compilers werden eingehalten | ja, ESLint `react-hooks` |
| `useEffect` nur zum Abgleich mit externen Systemen (z. B. Audio, Service Worker), nicht für abgeleitete Werte oder zum Laden von Daten | teilweise, ESLint `react-hooks`; sonst Review |
| Kein manuelles `useMemo`, `useCallback`, `memo`; das übernimmt der React Compiler. Ausnahme nur mit gemessenem Grund | nein (Review) |
| Zustand: gespeicherte Daten über `useLiveQuery`, laufende Partie und Vorbereitung in Zustand-Stores, Formulare lokal (Architektur 13.2) | nein (Review) |
| Stile über CSS Modules; Inline-Stile nur für Motion-Werte und dynamische CSS-Variablen | nein (Review) |
| Listen-Keys sind stabile Kennungen, nie der Index | teilweise, ESLint |
| Echte Bedienelemente (`button`, `a`, `input` mit `label`) statt klickbarer `div`; jedes Bedienelement hat eine sichtbare oder hinterlegte Beschriftung aus der Sprachdatei. Grund ist sauberer Code und robuste Tests, nicht Barrierefreiheit, die kein Ziel ist (E-24) | nein (Review); Tests finden Elemente über Rolle und Name (8.3) |
| Jede Ansicht ist von einer Error Boundary umschlossen (7.2) | nein (Review) |
| Berührungsflächen sind auf Smartphones bequem treffbar (Richtwert 44 × 44 Pixel) | nein (Review, manuelle Abnahme) |

---

## 7. Fehlerbehandlung (ADR-025)

### 7.1 Erwartbare Fehler

Erwartbare Fehler gehören zum normalen Ablauf: ungültige Eingabe, volle Gruppe, doppelter Name, kaputte oder zu große Importdatei, gesperrte Aktion während einer Partie. Sie werden **nicht geworfen**, sondern als Ergebnis zurückgegeben:

```ts
// Skizze, core/shared/result.ts
type Result<T, E extends string> = { ok: true; value: T } | { ok: false; error: E };

function addMember(group: Group, person: Person): Result<Group, 'group-full' | 'name-taken'> { … }
```

TypeScript zwingt den Aufrufer, beide Fälle zu behandeln. Die Oberfläche übersetzt den Fehlercode über die Sprachdatei in eine deutsche Meldung (`t('fehler.group-full')`).

### 7.2 Unerwartete Fehler

Programmierfehler, verletzte Invarianten und technische Störungen werden **geworfen** und aufgefangen

1. in den Anwendungsdiensten, damit die Datenbanktransaktion vollständig zurückgerollt wird,
2. in einer Error Boundary je Ansicht, die eine verständliche Meldung mit „Neu laden“ zeigt,
3. global über `error` und `unhandledrejection` für alles Übrige.

Fehlerdetails werden nie übertragen (NFA-DH-01). Der Fehlerbildschirm bietet sie zum Kopieren an, damit sie in ein Issue übernommen werden können. Invarianten in `core` werden mit `assert(bedingung, 'beschreibung')` aus `core/shared` geprüft.

### 7.3 Regeln

| Regel | Automatisch |
|---|---|
| Kein leerer `catch`-Block, kein stilles Verschlucken von Fehlern | ja, ESLint |
| Jede asynchrone Operation wird abgewartet oder ausdrücklich behandelt | ja, ESLint `no-floating-promises` |
| Nur `Error`-Objekte werfen | ja, ESLint |
| `catch`-Variablen sind `unknown` und werden vor Verwendung geprüft | ja, Compiler |
| Daten von außen (Importdatei, gelesene Sicherungspunkte) werden mit Valibot geprüft, bevor sie verwendet werden | nein (Review, Tests mit kaputten Dateien) |
| Fehlermeldungen für Nutzer sagen, was passiert ist und was man tun kann; keine technischen Details im Haupttext | nein (Review) |

---

## 8. Tests

### 8.1 Testarten

Die Teststrategie steht in Architektur Kapitel 14. Übersicht:

| Art | Werkzeug | Ort | Befehl |
|---|---|---|---|
| Unit- und Eigenschaftstests | Vitest, fast-check | neben dem Code | `npm test` |
| Datenbanktests | Vitest mit `fake-indexeddb` | neben dem Code in `infra/db` | `npm test` |
| Komponententests | Vitest mit React Testing Library | neben der Komponente | `npm test` |
| Statistische Tests | Vitest | `tests/statistical` | `npm run test:stat` |
| Ende-zu-Ende-Tests | Playwright (Chromium, WebKit) | `tests/e2e` | `npm run test:e2e` |

### 8.2 Regeln

| Regel | Automatisch |
|---|---|
| Jede Funktion in `core`, `games` und `app` hat Unit-Tests; alle Abnahmekriterien zu LS, PL und SR sind automatisiert (NFA-EW-07) | teilweise, Abdeckung ja; Vollständigkeit per Review |
| Mindestabdeckung 90 % (Zeilen und Verzweigungen) für `src/core` und `src/games` | ja, Vitest |
| Testnamen englisch, als Verhalten formuliert, mit Bezug: `describe('US-AB-03 Repeat step')`, `it('AK-2: discards all following steps')` (Architektur ADR-027) | nein (Review) |
| Aufbau jedes Tests: Ausgangslage herstellen, Handlung ausführen, Ergebnis prüfen | nein (Review) |
| Kein echter Zufall in Unit-, Komponenten- und Ende-zu-Ende-Tests: nur `SeededRandomSource` oder `ScriptedRandomSource`; fast-check mit festem Startwert. Echter Zufall nur in der statistischen Suite | teilweise, ESLint (`Math.random` überall verboten, `crypto` außerhalb von `infra` und `tests/statistical`) |
| Testdaten über Hilfsfunktionen aus `tests/support` (z. B. `aGroup({ … })`), nicht über lange Literale in jedem Test | nein (Review) |
| Neue Abläufe in der Oberfläche erhalten mindestens einen Ende-zu-Ende-Test für den Hauptweg | nein (Definition of Done) |
| Kein vergessenes `.only`; übersprungene Tests nur mit Begründung im Kommentar | ja, ESLint und Playwright (`forbidOnly`) |
| Ein unzuverlässiger Test wird repariert, nicht wiederholt. Einzige Ausnahme: die festgelegte einmalige Wiederholung in der statistischen Suite (NFA-ZF-02) | nein (Review) |

### 8.3 Ende-zu-Ende-Tests

- Elemente werden über Rolle und Beschriftung gefunden (`getByRole('button', { name: 'Speichern' })`), nicht über CSS-Klassen oder interne Kennungen.
- Der Netzwerkwächter lässt jeden Test fehlschlagen, der eine fremde Adresse anfragt (NFA-DH-01).
- Formate: Smartphone und Tablet, jeweils Hoch- und Querformat (NFA-PL-04).
- Jeder Test beginnt mit leerer Datenbank oder einem definierten Datenstand aus `tests/fixtures`.

---

## 9. Sicherheit

| Regel | Automatisch |
|---|---|
| Content-Security-Policy als Meta-Tag im Build, nur eigene Herkunft (Architektur 12.4) | ja, Ende-zu-Ende-Test prüft das Tag |
| Kein `eval`, kein `new Function`, kein `dangerouslySetInnerHTML`, keine Zuweisung an `innerHTML` | ja, ESLint |
| Importdateien sind nicht vertrauenswürdig: Größenlimit, Schemaprüfung mit Valibot, Inhalte nie als HTML darstellen | teilweise, Tests mit manipulierten Dateien |
| Keine Netzwerkzugriffe außer für Updates | ja, ESLint und Netzwerkwächter |
| Keine Geheimnisse im Repository; es gibt auch keine | ja, Secret scanning mit Push protection |
| Bekannte Lücken in Produktivabhängigkeiten blockieren den Merge | ja, `npm audit --omit=dev --audit-level=high` im Job `check` |
| Workflows haben standardmäßig nur Leserechte; nur Actions von GitHub | ja, GitHub-Einstellungen |
| Lokale Zertifikate und der Schlüssel der Zertifizierungsstelle liegen nie im Repository und werden von Claude Code nicht gelesen | ja, Berechtigungen von Claude Code, `.gitignore` |
| CodeQL prüft den Code bei jedem Pull Request | ja, GitHub (nicht blockierend) |

---

## 10. Abhängigkeiten

### 10.1 Neue Abhängigkeiten

Jede neue Abhängigkeit ist ein Haltepunkt (2.3). Claude Code beantwortet im Antrag:

| Kriterium | Anforderung |
|---|---|
| Zweck | Klar und nicht mit vertretbarem Aufwand selbst lösbar (Architektur 3.2) |
| Pflege | Release in den letzten zwölf Monaten, keine offenen kritischen Sicherheitsmeldungen |
| Lizenz | MIT, ISC, BSD oder Apache 2.0 |
| Typen | Eigene TypeScript-Typen oder gepflegte `@types`-Pakete |
| Laufzeitverhalten | Keine Netzwerkzugriffe, kein Tracking |
| Größe | Bei Laufzeitabhängigkeiten: Zuwachs des Bundles |
| Alternativen | Mindestens eine Alternative mit Bewertung |

Laufzeitabhängigkeiten werden zusätzlich in Architektur 3.1 eingetragen; eine grundlegende Wahl erhält eine ADR. Für Entwicklungsabhängigkeiten genügt die Begründung im Pull Request.

### 10.2 Versionen

| Regel | Automatisch |
|---|---|
| Exakte Versionen in `package.json` | ja, `save-exact=true` in `.npmrc` |
| `package-lock.json` liegt im Repository; auf GitHub wird mit `npm ci` installiert | ja, Workflows |
| Node.js-Hauptversion in `.nvmrc`, von den Workflows gelesen | ja |

### 10.3 Updates

| Art | Vorgehen |
|---|---|
| Sicherheitsupdates (Dependabot security updates) | Pull Request kommt automatisch; mergen, sobald die Prüfungen bestanden sind und ein kurzer Rundgang unauffällig war |
| Kleine Updates (Dependabot version updates, monatlich gebündelt) | Ein Pull Request im Monat; Vorgehen wie oben |
| Große Versionssprünge (MAJOR) | Eigener Pull Request je Paket; Claude Code liest die Migrationshinweise des Pakets, passt den Code an und beschreibt die Änderungen |
| Node.js | Wechsel der Hauptversion als `deps/node-‹version›`, frühestens nach deren LTS-Einstufung. Einmalige Ausnahme: Das Setup startet auf Entscheidung des Product Owners mit Node.js 26, bevor es als LTS eingestuft ist |

Dependabot-Pull-Requests zielen auf `develop` und tragen das Präfix `deps:`. Aktualisiert werden auch die GitHub-Actions-Bausteine in den Workflows.

---

## 11. Dokumentation

### 11.1 Grundsätze

- `docs/` ist die einzige Masterkopie (EP-09). Dokumente werden wie Code über Branches und Pull Requests geändert.
- Dokumente ändern sich **im selben Pull Request** wie der Code, den sie beschreiben.
- Änderungen an Anforderungsdokumentation und Spezifikation sind Haltepunkte; sie erfolgen nur nach Entscheidung des Product Owners.
- Änderungen an der Architektur, die eine Entscheidung betreffen, erhalten eine neue ADR; die alte erhält den Status „Ersetzt durch ADR-0xx“.
- IDs (Anforderungen, Stories, Entscheidungen, ADRs, offene Punkte) werden nie wiederverwendet oder umnummeriert.

### 11.2 Welches Dokument wofür

| Dokument | Inhalt |
|---|---|
| `BoardBrain_Anforderungsdokumentation.md` | Was die App leisten muss; Rahmenbedingungen, Entwicklungsprozess, Entscheidungen, offene Punkte |
| `BoardBrain_Spezifikation.md` | User Stories, Abnahmekriterien, Prüfkriterien, Priorisierung |
| `BoardBrain_Architektur.md` | Technische Umsetzung, ADRs, Teststrategie, Build und Auslieferung |
| `Entwicklungsrichtlinien.md` | Dieses Dokument |
| `Setup-Anleitung.md`, `Setup-DoD.md` | Einrichtung und deren Nachweis |
| `Abnahme-Checkliste.md` | Manuelle Abnahme vor jedem Release (ab I1) |
| `test-reports/` | Ergebnisse von Messungen, z. B. Sackgassenquote |
| `README.md` (Wurzel) | Kurzbeschreibung, Adresse der App, Verweis auf `docs/` |
| `CHANGELOG.md` (Wurzel) | Änderungen je Release |
| `CLAUDE.md` (Wurzel) | Kurzfassung dieser Richtlinien für Claude Code |

### 11.3 Kopf und Änderungshistorie

Jedes Dokument in `docs/` behält Kopftabelle und Änderungshistorie, damit es ohne Git lesbar ist. Ändert ein Pull Request ein Dokument inhaltlich, erhöht er dessen Version an der zweiten Stelle (0.8 → 0.9, 1.0 → 1.1) und ergänzt eine Zeile in der Änderungshistorie mit Datum, Zusammenfassung und Nummer des Pull Requests. Reine Tippfehler erhalten keine neue Version. Geänderte Anforderungen werden wie bisher mit *(präzisiert in x.y)* bzw. *(neu in x.y)* markiert.

### 11.4 Form

Markdown, deutsch, Tabellen für Festlegungen, Codebeispiele nur als Skizzen. Prettier formatiert `docs/` nicht (ADR-024).

---

## 12. Definition of Done

### 12.1 Je Pull Request (Story-Bündel)

1. Alle Abnahmekriterien der enthaltenen Stories sind erfüllt; jedes hat einen automatisierten Test oder einen manuellen Prüfschritt in der Beschreibung des Pull Requests.
2. `npm run check` und `npm run test:e2e` sind lokal und auf GitHub bestanden, ohne neue Warnungen.
3. Texte stammen aus der Sprachdatei, Farben aus den Tokens, Zufall aus `RandomSource`.
4. Neue Abläufe in der Oberfläche haben einen Ende-zu-Ende-Test für den Hauptweg.
5. Betroffene Dokumente in `docs/` sind im selben Pull Request angepasst.
6. Keine neue Abhängigkeit ohne Zustimmung des Product Owners.
7. Der Product Owner hat lokal abgenommen.

### 12.2 Je Release

1. Alle Pull Requests des Releases erfüllen 12.1.
2. `npm run test:stat` ist bestanden.
3. Die manuelle Abnahme nach `docs/Abnahme-Checkliste.md` ist auf allen Abnahmeplattformen bestanden (NFA-PL-01; ab 1.0).
4. Version und `CHANGELOG.md` sind aktualisiert.
5. Für Release 1.0 zusätzlich: alle User Stories umgesetzt und abgenommen, alle Prüfkriterien der Spezifikation erfüllt (Spezifikation 2.1).

---

## 13. Übersicht: automatisch geprüfte Regeln

| Regel | Werkzeug | Konfiguration | Läuft in |
|---|---|---|---|
| Typen, strikter Modus, löschbare Syntax | TypeScript | `tsconfig.json` | `check`, Build |
| Kein `any`, keine `!`-Behauptung, keine `as`-Behauptung, `type` statt `interface`, Typimporte, Rückgabetypen, vollständige `switch` | typescript-eslint | `eslint.config.js` | `check` |
| Namenskonventionen | typescript-eslint `naming-convention` | `eslint.config.js` | `check` |
| Datei- und Ordnernamen | `eslint-plugin-check-file` | `eslint.config.js` | `check` |
| Nur benannte Exporte, Kurzpfad `@/` | ESLint `no-restricted-syntax`, `no-restricted-imports` | `eslint.config.js` | `check` |
| Doku-Kommentare an Exporten in `core`, `games`, `app` | `eslint-plugin-jsdoc` | `eslint.config.js` | `check` |
| Kein `Math.random`; `crypto` und `fetch` nur an erlaubten Orten; keine Browser-APIs in `core` und `games` | ESLint `no-restricted-properties`, `no-restricted-globals` | `eslint.config.js` | `check` |
| Keine festen Texte in JSX (auch in `title`, `placeholder`, `alt`, `aria-label`); Index nicht als `key`; nur Funktionskomponenten | ESLint `no-restricted-syntax` (Ersatz für `eslint-plugin-react`, Architektur ADR-026) | `eslint.config.js` | `check` |
| Keine Farbwerte in TypeScript | ESLint `no-restricted-syntax` | `eslint.config.js` | `check` |
| Hooks- und Compiler-Regeln | `eslint-plugin-react-hooks` | `eslint.config.js` | `check` |
| Fehlerbehandlung (`no-empty`, `no-floating-promises`, `only-throw-error`) | ESLint, typescript-eslint | `eslint.config.js` | `check` |
| Sicherheit (`no-eval`, `no-implied-eval`, `no-new-func`; `dangerouslySetInnerHTML`, `innerHTML` und `insertAdjacentHTML` über `no-restricted-syntax`) | ESLint | `eslint.config.js` | `check` |
| Testkonventionen (`no-focused-tests`, `.only` auch in Playwright-Tests, Abfragen über `screen`) | `@vitest/eslint-plugin`, `eslint-plugin-testing-library`, `no-restricted-syntax` | `eslint.config.js` | `check` |
| Keine Farbwerte außerhalb von `tokens.css`; keine CSS-Animationen | Stylelint | `stylelint.config.js` | `check` |
| Formatierung | Prettier | `.prettierrc.json`, `.prettierignore` | `check` |
| Schichten, Modulschnittstellen, erlaubte Bibliotheken je Schicht, keine Zyklen | dependency-cruiser | `.dependency-cruiser.cjs` | `check` |
| Mindestabdeckung `core` und `games` | Vitest | `vitest.config.ts` | `check` |
| Kein `.only` in Ende-zu-Ende-Tests; Netzwerkwächter; Content-Security-Policy | Playwright | `playwright.config.ts`, `tests/e2e` | `e2e` |
| Gleichverteilung des Zufalls | Vitest | `tests/statistical` | `stat` |
| Titel des Pull Requests | commitlint | `commitlint.config.js` | `pr-title` |
| Pull Requests nach `main` nur aus `develop` oder `hotfix/…` | Workflow-Skript | `.github/workflows/ci.yml` | `guard-main` |
| Lücken in Produktivabhängigkeiten | `npm audit` | `ci.yml` | `check` |
| Exakte Versionen | npm | `.npmrc` | bei jeder Installation |
| Zeilenenden LF | Git | `.gitattributes` | bei jedem Commit |
| Nur Pull Requests, Merge-Art je Branch, Prüfungen erforderlich, kein Force-Push | GitHub Rulesets | Repository-Einstellungen | auf GitHub |
| Veröffentlichung nur aus Tags `v*`; Tags unveränderlich | GitHub Environments und Rulesets | Repository-Einstellungen | auf GitHub |
| Geheimnisse, Sicherheitslücken, Codeanalyse | Secret scanning, Dependabot, CodeQL | Repository-Einstellungen | auf GitHub |
| Grenzen für Claude Code | Berechtigungen | `.claude/settings.json` | in Claude Code |

---

## 14. Arbeit mit Claude Code

- **Modelle und Aufwand:** nach Anforderungsdokumentation 9.3. Standard ist Sonnet 5.5 mit Aufwand „medium“; Opus 5.5 mit „high“ für das Setup und die kritischen Teile (Zufall, Platzierung und Sackgassen, Service Worker und Updates, Importkonflikte, Migrationen). Liegt Sonnet zweimal hintereinander daneben, auf Opus wechseln.
- **Kontext:** Für jedes Bündel eine neue Sitzung beginnen (`/clear`). Das spart Kontingent und verhindert, dass alte Annahmen nachwirken. `CLAUDE.md` wird in jeder Sitzung automatisch gelesen.
- **Berechtigungen:** nach Architektur 16.5. Harte Grenzen stehen in `.claude/settings.json`, nicht nur in `CLAUDE.md`.
- **Auftrag formulieren:** Bündel und Aufgaben stehen mit Modell, Aufwand und Branch-Namen in `docs/Umsetzungsplan.md`, ebenso der genaue Ablauf einer Sitzung. Auftrag: „Setze Bündel I1-A aus docs/Umsetzungsplan.md um.“, bei Bedarf mit besonderen Wünschen.
- **Designvorschläge:** bei Oberflächen vor dem Bau (2.5). *(neu in 0.5)*
- **Nach dem Merge:** Claude Code wechselt zurück auf `develop` und holt den neuen Stand (`git switch develop && git pull`).
