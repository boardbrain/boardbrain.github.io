# CLAUDE.md – BoardBrain

Verbindliche Kurzfassung von `docs/Entwicklungsrichtlinien.md`. Dort stehen die Details; bei Abweichungen gelten die Richtlinien. Antworte dem Product Owner auf Deutsch. Er lernt dabei: Erkläre Entscheidungen kurz und verständlich.

## Projekt

Progressive Web App für faire Zufallsentscheidungen und Statistik am Spieleabend (Catan). Veröffentlicht unter `https://boardbrain.github.io/` (Repository `boardbrain/boardbrain.github.io`). Stack: TypeScript strikt, React 19 mit React Compiler, Motion, Vite, Dexie (IndexedDB), Valibot, React Router (Hash), Zustand, Vitest, Playwright.

Grundlagen in `docs/`: `BoardBrain_Anforderungsdokumentation.md` (Was), `BoardBrain_Spezifikation.md` (User Stories, Abnahmekriterien), `BoardBrain_Architektur.md` (Wie, ADRs), `Entwicklungsrichtlinien.md` (Arbeitsregeln), `Umsetzungsplan.md` (Reihenfolge, Bündel, Modelle, Ablauf jeder Sitzung). Lies den Umsetzungsplan und die betroffenen Kapitel, bevor du ein Bündel umsetzt. Rangfolge bei Widerspruch: Anforderungen > Spezifikation > Architektur > Richtlinien.

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver (HTTPS mit mkcert, im WLAN erreichbar) |
| `npm run check` | Typen, ESLint, Stylelint, Prettier, dependency-cruiser, Unit-Tests mit Abdeckung |
| `npm run test:e2e` | Playwright |
| `npm run test:stat` | Statistische Suite |
| `npm run format` | Prettier schreibt |

## Arbeitsablauf (EP-10, EP-11)

0. Auftrag nennt ein Bündel oder eine Aufgabe aus `docs/Umsetzungsplan.md`. Zuerst kurzen Umsetzungsplan mit Tests, Paketen und Haltepunkt-Fragen zeigen; erst nach „los“ beginnen (Umsetzungsplan 4.1). Bei neuen oder geänderten Oberflächen zuerst Designvorschläge als lokale, klickbare HTML-Datei `…-preview….html` im Wurzelordner zeigen (per `.gitignore` nicht im Repository, über den Dev-Server auf allen Geräten erreichbar, alte Runden archivieren statt löschen) und erst nach der Wahl des Product Owners bauen (Richtlinien 2.5). Status im Umsetzungsplan im selben PR fortschreiben.
1. Arbeitsbranch von aktuellem `develop`: `‹typ›/‹beschreibung›`, englisch, klein (`feat/us-pg-01-persons-and-groups`).
2. Umsetzen mit Tests und Doku-Anpassungen; in sinnvollen Schritten committen.
3. Vor dem Push: `npm run check` und `npm run test:e2e` bestanden. Vor einem PR nach `main` zusätzlich `npm run test:stat`.
4. Pushen, PR nach `develop` mit `gh pr create`, Beschreibung nach `.github/pull_request_template.md`, inklusive Testanleitung.
5. Entwicklungsserver frisch starten (nach jedem Branch-Wechsel neu, sonst läuft er ohne HTTPS) und dem Product Owner Adressen und Testschritte je Gerät nennen. Rückmeldungen im selben Branch beheben.
6. **Nie selbst mergen.** Der Product Owner mergt.

## Haltepunkte: anhalten und fragen, wenn

- eine Anforderung oder ein Abnahmekriterium unklar oder widersprüchlich ist,
- eine Lösung von der Architektur abweichen würde,
- eine neue Abhängigkeit nötig wäre (Kriterien: Richtlinien 10.1),
- Anforderungsdokumentation oder Spezifikation geändert werden müssten.

Frage mit begründetem Vorschlag und Alternativen. Alles andere entscheidest du selbst und begründest es im PR.

## Harte Regeln

**Architektur**
- Schichten: `core` ← `games` ← `app` ← `ui`; `infra` implementiert Schnittstellen aus `core`/`app/ports`; `sw` eigenständig. Zusammensetzung nur in `src/main.tsx`.
- `core` und `games`: reines TypeScript, keine Browser-APIs, kein React, Dexie oder Motion.
- Dexie nur in `infra/db`. Schreiben nur über Repositories, aufgerufen aus Anwendungsdiensten; die UI liest über Lesehooks und schreibt über Dienste.
- Dienste setzen Transaktionsgrenzen und prüfen Sperren während einer laufenden Partie (FA-AB-09).
- Erst speichern, dann zeigen: Schrittergebnis ist gespeichert, bevor die Animation startet (ADR-014).
- Keine Netzwerkzugriffe außer im Service Worker und `infra/update`.

**Zufall und Kennungen**
- Kein `Math.random`, nirgends. Zufall nur über `RandomSource`; `crypto.getRandomValues` nur in `infra/random`.
- Kennungen nur über `crypto.randomUUID()` in `infra`.
- Tests nur mit `SeededRandomSource`/`ScriptedRandomSource`; echter Zufall nur in `tests/statistical`.

**Oberfläche**
- Keine festen Texte: alles aus `src/i18n/de.ts` über `t()`.
- Keine Farbwerte außerhalb von `src/ui/styles/tokens.css`.
- Animationen nur über Motion, keine CSS-Animationen; nie per React-Zustand pro Bild.
- Echte Bedienelemente (`button`, `a`, `label`) mit Beschriftung aus der Sprachdatei. Kein manuelles `useMemo`/`useCallback`/`memo`. `useEffect` nur für externe Systeme.

**Code**
- **Code immer englisch** (ADR-027): Bezeichner nach Architektur 4.5, Kommentare, Testnamen, Fehlermeldungen. Deutsch nur UI-Texte in `de.ts`, Doku, Commits, PRs. Doku-Kommentar an jedem Export in `core`, `games`, `app`; Anforderungs-ID nennen, wo Code eine Regel umsetzt (`// FA-PL-03: …`).
- Kein `any`, kein `!`, kein `as` (außer `as const`), keine `enum`. Nur benannte Exporte. Module in `core` nur über ihre `index.ts` importieren; über Modulgrenzen mit `@/`.
- Dateien: Komponenten PascalCase mit `*.module.css` daneben, sonst camelCase; Ordner klein.
- Erwartbare Fehler als `Result<T, E>` zurückgeben, unerwartete werfen (ADR-025). Kein leerer `catch`, jedes Promise behandelt. Daten von außen mit Valibot prüfen.

**Tests**
- Jede Funktion in `core`, `games`, `app` hat Tests; Abdeckung `core`/`games` ≥ 90 %.
- Testnamen englisch mit Bezug: `describe('US-AB-03 …')`, `it('AK-2: …')`.
- Neue UI-Abläufe: Ende-zu-Ende-Test für den Hauptweg; Elemente über Rolle und Name finden.
- Unzuverlässige Tests reparieren, nicht wiederholen.

**Git**
- PR-Titel nach Conventional Commits, Beschreibung deutsch: `feat(placement): Gebäude zufällig platzieren`. Typen: feat, fix, refactor, test, docs, chore, build, ci, deps, release, revert.
- Squash nach `develop`, Merge commit nach `main`. Nach `main` nur aus `develop` oder `hotfix/…`.
- Release nach Richtlinien 3.8. `git tag` und `gh release` nur nach ausdrücklicher Zustimmung.
- Kein Force-Push, kein Umschreiben veröffentlichter Geschichte.
- Keine Hinweise auf Claude in Commits und PRs: kein `Co-Authored-By`, kein „Generated with Claude Code“ (Richtlinien 3.3).

**Abhängigkeiten**
- Keine neue Abhängigkeit ohne Zustimmung. Exakte Versionen. `package-lock.json` immer mit committen.

**Dokumentation**
- Betroffene Dokumente in `docs/` im selben PR anpassen; Version und Änderungshistorie fortschreiben (Richtlinien 11.3). IDs nie wiederverwenden. Architekturentscheidungen als neue ADR.
- Prettier formatiert `docs/` nicht; Tabellen von Hand sauber halten.

**Sicherheit**
- Nie Dateien aus `%USERPROFILE%\.boardbrain-certs\` oder dem mkcert-Ordner (`rootCA-key.pem`) lesen. Keine Geheimnisse ins Repository.
- Kein `eval`, `new Function`, `dangerouslySetInnerHTML`, `innerHTML`.

## Definition of Done je PR

Abnahmekriterien erfüllt und je Kriterium Test oder Prüfschritt genannt · `check` und `e2e` bestanden, keine neuen Warnungen · Texte, Farben, Zufall nach den Regeln · E2E-Test für neue Abläufe · Doku angepasst · keine ungenehmigte Abhängigkeit · Abnahme durch den Product Owner.

## Nach dem Merge

`git switch develop && git pull`. Für das nächste Bündel eine neue Sitzung beginnen.
