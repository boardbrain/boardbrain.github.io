# BoardBrain – Definition of Done der Setup-Phase

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Prüfbare Checkliste für den Abschluss der Setup-Phase |
| Version | 0.4 |
| Status | Abgeschlossen am 07.10.2026: alle Punkte erfüllt |
| Stand | 07.10.2026 |
| Grundlage | BoardBrain_Architektur.md v0.5, Entwicklungsrichtlinien.md v0.2, Setup-Anleitung.md v0.4 |
| Sprache | Deutsch |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 06.10.2026 | Erstfassung aus der Setup-Planung |
| 0.2 | 06.10.2026 | Lizenz PolyForm Strict License 1.0.0 statt MIT (C3); C2 ohne feste Versionsnummern, weil die Dokumente während des Setups fortgeschrieben werden (PR #1) |
| 0.3 | 07.10.2026 | Node.js 26 nach Entscheidung des Product Owners (B1); Begleitpakete und spätere Testpakete (C7); „alle Prüfwerte grün“ präzisiert (C12, E4 bis E7); kein eigenes iPhone: E6 entfällt, iPhone in G3 optional; `.only` auch per ESLint (D15) (PR #2) |
| 0.4 | 07.10.2026 | Setup abgeschlossen, alle Punkte abgehakt; 2FA-Pflicht in der Organisation optional, solange der Product Owner einziges Mitglied ist (A1); Leseversuch in H2 mit nicht vorhandener Datei |

## Grundsatz

Die Setup-Phase ist abgeschlossen, wenn **jeder** Punkt abgehakt ist. Jeder Punkt hat einen Nachweis, den der Product Owner selbst sehen kann. Für jede automatische Regel genügt es nicht, dass die Prüfung grün ist: Sie muss einmal **nachweislich an einem absichtlichen Verstoß scheitern** (Abschnitt D). Die Verstöße werden danach wieder entfernt und nicht committet.

Spalte „Wer“: **PO** = Product Owner, **CC** = Claude Code.

---

## A. Konten und GitHub

| # | Kriterium | Nachweis | Wer | ✓ |
|---|---|---|---|---|
| A1 | 2FA im persönlichen Konto aktiv; 2FA-Pflicht in der Organisation `boardbrain` optional, solange der Product Owner das einzige Mitglied ist (Entscheidung des Product Owners) | GitHub-Einstellungen | PO | ☑ |
| A2 | Commits verwenden die noreply-Adresse | `git log -1 --format=%ae` zeigt `…@users.noreply.github.com` | CC | ☑ |
| A3 | Repository `boardbrain/boardbrain.github.io` öffentlich; Standard-Branch `develop`; Wiki und Projects aus; Issues an; gemergte Branches werden gelöscht | Settings → General | PO | ☑ |
| A4 | Merge-Arten: Merge commit und Squash erlaubt, Rebase aus; Standard-Nachricht jeweils „Pull request title“ | Settings → General → Pull Requests | PO | ☑ |
| A5 | Ruleset `develop`: nur PR, 0 Freigaben, nur Squash, lineare Geschichte, Prüfungen `check`, `e2e`, `pr-title`, kein Force-Push, kein Löschen, keine Ausnahmen | Settings → Rules | PO | ☑ |
| A6 | Ruleset `main`: nur PR, 0 Freigaben, nur Merge commit, Prüfungen `check`, `e2e`, `pr-title`, `stat`, `guard-main`, kein Force-Push, kein Löschen, keine Ausnahmen | Settings → Rules | PO | ☑ |
| A7 | Tag-Ruleset `Release-Tags` für `v*`: kein Verschieben, kein Löschen, kein Force-Push | Settings → Rules | PO | ☑ |
| A8 | Pages: Source „GitHub Actions“; Umgebung `github-pages` nur für Tags `v*` | Settings → Pages, Settings → Environments | PO | ☑ |
| A9 | Actions: nur Actions von GitHub; Workflow-Rechte „Read“; Actions dürfen keine PRs erstellen | Settings → Actions → General | PO | ☑ |
| A10 | Secret scanning mit Push protection, Dependabot alerts, Dependabot security updates (gruppiert), Private vulnerability reporting, CodeQL Default setup aktiv; Dependency graph zeigt die Pakete | Settings → Advanced Security; Insights → Dependency graph | PO | ☑ |

## B. Werkzeuge unter Windows

| # | Kriterium | Nachweis | Wer | ✓ |
|---|---|---|---|---|
| B1 | Node.js in der Hauptversion, die in `.nvmrc` steht (26; Entscheidung des Product Owners, LTS-Einstufung Ende Oktober 2026); npm vorhanden | `node -v`, `npm -v`, Inhalt von `.nvmrc` | CC | ☑ |
| B2 | Git, GitHub CLI, mkcert installiert | `git --version`, `gh --version`, `mkcert -version` | CC | ☑ |
| B3 | Git-Konfiguration nach Architektur 16.1 | `git config --global --list` | CC | ☑ |
| B4 | GitHub CLI angemeldet mit Berechtigung `workflow` und Zugriff auf die Organisation | `gh auth status`; `gh repo view boardbrain/boardbrain.github.io` | CC | ☑ |
| B5 | Claude Code installiert, angemeldet, VS Code-Erweiterung aktiv | `claude --version`; Erweiterung sichtbar | PO | ☑ |
| B6 | Projekt liegt in `C:\dev\boardbrain`, außerhalb von OneDrive | Pfad | PO | ☑ |
| B7 | Feste IP-Adresse für den PC in der FRITZ!Box; Windows-Netzwerk „Privat“ | FRITZ!Box-Oberfläche; Windows-Einstellungen | PO | ☑ |

## C. Repository-Inhalt

| # | Kriterium | Nachweis | Wer | ✓ |
|---|---|---|---|---|
| C1 | Ordnerstruktur nach Architektur Kapitel 15, soweit für das Setup nötig; jedes Modul in `src/core` mit `index.ts` | Dateibaum | CC | ☑ |
| C2 | `docs/` enthält die aktuellen Fassungen von Anforderungen, Spezifikation, Architektur, Entwicklungsrichtlinien, Setup-Anleitung, Setup-DoD | Dateien auf GitHub | CC | ☑ |
| C3 | `CLAUDE.md`, `README.md` (Kurzbeschreibung, Adresse, Verweis auf `docs/`), `LICENSE` (PolyForm Strict License 1.0.0 mit „Required Notice: Copyright (c) 2026 Jonasss29“), `CHANGELOG.md` | Dateien auf GitHub | CC | ☑ |
| C4 | `.gitattributes` mit `* text=auto eol=lf`; alle Textdateien im Repository haben LF | `git ls-files --eol` zeigt keine `crlf` im Index | CC | ☑ |
| C5 | `.gitignore` deckt `node_modules`, `dist`, `coverage`, Testergebnisse, `.claude/settings.local.json`, Zertifikatsdateien (`*.pem`, `*.key`) ab | Inhalt | CC | ☑ |
| C6 | `.nvmrc`, `.npmrc` mit `save-exact=true`; alle Versionen in `package.json` exakt; `package-lock.json` committet | Inhalt | CC | ☑ |
| C7 | Alle Abhängigkeiten aus Architektur 3.1 und den Prüfwerkzeugen in Kapitel 13 der Richtlinien sind installiert, keine weiteren; Laufzeitabhängigkeiten nur, soweit für das Gerüst nötig, die übrigen folgen mit ihrem Inkrement; ebenso `fake-indexeddb`, das erst mit Dexie gebraucht wird. Zulässige Begleiter: `@rolldown/plugin-babel`, `@babel/core` und `@types/babel__core` für den React Compiler | `npm ls --depth=0`, Liste im PR | CC | ☑ |
| C8 | `tsconfig.json`: strikt, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `erasableSyntaxOnly`; Kurzpfad `@/` | Inhalt | CC | ☑ |
| C9 | React Compiler im Build aktiv | Konfiguration in `vite.config.ts`; Hinweis im Build oder in den React-Entwicklertools | CC | ☑ |
| C10 | Sprachdatei `src/i18n/de.ts` mit typisiertem `t()`; Tokens in `src/ui/styles/tokens.css` (Platzhalterwerte bis OP-11) | Dateien | CC | ☑ |
| C11 | `core/shared` mit `Result`, `ok`, `err`, `assert` und Tests | Dateien, Tests | CC | ☑ |
| C12 | Diagnoseansicht `#/diagnose` zeigt Version, sicheren Kontext, `crypto.randomUUID`, Verfügbarkeit von Service Worker und persistentem Speicher (nur lesend), Installationsstatus; alle Texte aus der Sprachdatei. Prüfwerte erscheinen grün oder rot; Speicherschutz und Installationsstatus sind im Browser-Tab erwartungsgemäß „nein“ und erscheinen neutral als Information | Ansicht im Browser | CC | ☑ |
| C13 | Error Boundary um die Ansichten; globale Fehlerbehandlung | Code; Komponententest | CC | ☑ |
| C14 | `index.html` mit Content-Security-Policy als Meta-Tag (nur im Build) | Inhalt von `dist/index.html` | CC | ☑ |
| C15 | Kein Service Worker, kein PWA-Plugin, keine Datenspeicherung im Setup-Stand | Code; `dist/` enthält keinen Service Worker | CC | ☑ |
| C16 | `.github/`: `ci.yml`, `deploy.yml`, `dependabot.yml` (monatlich, gruppiert, Ziel `develop`, Präfix `deps`, npm und GitHub Actions), `pull_request_template.md` | Dateien | CC | ☑ |
| C17 | `.claude/settings.json` mit Berechtigungen nach Architektur 16.5 | Inhalt | CC | ☑ |
| C18 | `.vscode/extensions.json` (ESLint, Prettier, Stylelint, Playwright, Claude Code) und `.vscode/settings.json` (Formatieren beim Speichern mit Prettier) | Inhalt; VS Code bietet die Erweiterungen an | CC | ☑ |

## D. Prüfungen und Negativtests

Jeder Befehl läuft auf dem sauberen Stand fehlerfrei. Jeder Negativtest wird einmal eingebaut, die Prüfung schlägt mit verständlicher Meldung fehl, der Verstoß wird entfernt. Claude Code dokumentiert die Ergebnisse als Tabelle im Pull Request des Gerüsts.

| # | Kriterium | Nachweis | Wer | ✓ |
|---|---|---|---|---|
| D1 | `npm run check`, `npm run build`, `npm test`, `npm run test:stat`, `npm run test:e2e` laufen fehlerfrei; jede Testart hat mindestens einen echten Test | Ausgabe | CC | ☑ |
| D2 | Abdeckungsschwelle 90 % für `core` und `games` ist aktiv | Negativtest: ungetestete Funktion in `core` → `check` rot | CC | ☑ |
| D3 | `Math.random()` irgendwo in `src` oder `tests` → ESLint rot | Negativtest | CC | ☑ |
| D4 | `crypto` in `src/core` bzw. `window` in `src/games` → ESLint rot | Negativtest | CC | ☑ |
| D5 | Import von `react` oder `dexie` in `src/core` → dependency-cruiser rot | Negativtest | CC | ☑ |
| D6 | Import an der `index.ts` eines `core`-Moduls vorbei → dependency-cruiser rot | Negativtest | CC | ☑ |
| D7 | Fester Text in JSX → ESLint rot | Negativtest | CC | ☑ |
| D8 | Farbwert in einer CSS-Datei außer `tokens.css` → Stylelint rot; Farbwert als Zeichenkette in TypeScript → ESLint rot | Negativtest | CC | ☑ |
| D9 | `transition` bzw. `@keyframes` in CSS → Stylelint rot | Negativtest | CC | ☑ |
| D10 | `any`, `!`-Behauptung, `export default`, `enum` → ESLint bzw. Compiler rot | Negativtest | CC | ☑ |
| D11 | Exportierte Funktion in `core` ohne Doku-Kommentar → ESLint rot | Negativtest | CC | ☑ |
| D12 | Falscher Dateiname (z. B. `group-form.tsx` für eine Komponente) → ESLint rot | Negativtest | CC | ☑ |
| D13 | Nicht abgewartetes Promise, leerer `catch` → ESLint rot | Negativtest | CC | ☑ |
| D14 | Unformatierte Datei → Prettier-Prüfung rot | Negativtest | CC | ☑ |
| D15 | `.only` in einem Ende-zu-Ende-Test → Playwright rot (mit gesetzter Variable `CI`); zusätzlich ESLint rot | Negativtest | CC | ☑ |
| D16 | Anfrage an eine fremde Adresse in einem Ende-zu-Ende-Test → Netzwerkwächter rot | Negativtest | CC | ☑ |
| D17 | Ende-zu-Ende-Test prüft das Meta-Tag der Content-Security-Policy im Build | Test vorhanden und grün | CC | ☑ |
| D18 | Ungültiger PR-Titel (z. B. `Update stuff`) → commitlint rot | Negativtest lokal mit `npx commitlint` | CC | ☑ |

## E. Lokales HTTPS und Geräte

| # | Kriterium | Nachweis | Wer | ✓ |
|---|---|---|---|---|
| E1 | mkcert-Zertifizierungsstelle in Windows installiert; Serverzertifikat für `localhost`, `127.0.0.1`, `::1` und die feste IP in `%USERPROFILE%\.boardbrain-certs\` | Dateien vorhanden | PO | ☑ |
| E2 | `rootCA-key.pem` liegt ausschließlich im mkcert-Ordner; keine Zertifikatsdatei im Repository | `git ls-files` enthält keine `.pem`; Kontrolle des Ordners | PO, CC | ☑ |
| E3 | `npm run dev` liefert über HTTPS aus, im WLAN erreichbar; ohne Zertifikat Rückfall auf `http://localhost` | Konfiguration; Ausgabe des Servers | CC | ☑ |
| E4 | Windows, Brave: Diagnoseansicht über `https://localhost:5173` ohne Warnung, alle Prüfwerte grün (siehe C12) | Bildschirm | PO | ☑ |
| E5 | Android, Brave: Diagnoseansicht über `https://‹IP›:5173` ohne Warnung, alle Prüfwerte grün (siehe C12) | Bildschirm | PO | ☑ |
| E6 | iPhone, Safari: entfällt (kein eigenes iPhone) | – | – | – |
| E7 | iPad, Safari: wie E5 | Bildschirm | PO | ☑ |
| E8 | `npm run preview` liefert den Produktions-Build ebenso aus; im Build ist die Content-Security-Policy aktiv, und die Konsole zeigt keine Verstöße | Brave-Entwicklertools | PO | ☑ |

## F. Prüfungen auf GitHub

| # | Kriterium | Nachweis | Wer | ✓ |
|---|---|---|---|---|
| F1 | PR nach `develop` löst `check`, `e2e`, `pr-title` aus; Merge ist gesperrt, bis sie bestanden sind | PR des Gerüsts | PO | ☑ |
| F2 | Direkter Push nach `develop` wird abgelehnt | Ausgabe des abgelehnten Pushs | CC | ☑ |
| F3 | PR nach `main` aus einem anderen Branch als `develop` oder `hotfix/…` lässt `guard-main` fehlschlagen | Test-PR (danach geschlossen) | CC | ☑ |
| F4 | PR nach `main` löst zusätzlich `stat` aus | Test-PR bzw. Release-PR | PO | ☑ |
| F5 | Ruleset `develop` erlaubt nur Squash, Ruleset `main` nur Merge commit | Auswahl im Merge-Knopf | PO | ☑ |
| F6 | Workflows verwenden nur Actions von GitHub; Node.js-Version aus `.nvmrc`; Installation mit `npm ci` | Inhalt der Workflows | CC | ☑ |
| F7 | CodeQL ist bei mindestens einem PR gelaufen | Prüfungen im PR | PO | ☑ |

## G. Veröffentlichung

| # | Kriterium | Nachweis | Wer | ✓ |
|---|---|---|---|---|
| G1 | Release-Ablauf nach Richtlinien 3.8 durchlaufen: `chore/release-0.1.0` → `develop`, `develop` → `main` (Merge commit), `gh release create v0.1.0` | PRs, Release auf GitHub | PO, CC | ☑ |
| G2 | Workflow „Deploy“ läuft nur durch den Tag und ist erfolgreich | Actions | PO | ☑ |
| G3 | `https://boardbrain.github.io/` zeigt auf PC, Android und iPad die Diagnoseansicht mit Version 0.1.0; iPhone optional über das Gerät eines Freundes | Bildschirm | PO | ☑ |
| G4 | Auf der veröffentlichten Seite ist kein Service Worker registriert und nichts gespeichert | Brave-Entwicklertools → Application | PO | ☑ |
| G5 | Content-Security-Policy auf der veröffentlichten Seite aktiv, keine Verstöße in der Konsole | Brave-Entwicklertools | PO | ☑ |
| G6 | `CHANGELOG.md` enthält Version 0.1.0; das GitHub-Release trägt die Änderungsbeschreibung (EP-05) | Release-Seite | PO | ☑ |

## H. Claude Code

| # | Kriterium | Nachweis | Wer | ✓ |
|---|---|---|---|---|
| H1 | `CLAUDE.md` wird gelesen | Claude Code nennt auf Nachfrage drei Haltepunkte aus `CLAUDE.md` | PO | ☑ |
| H2 | Berechtigungen wirken: Lesen von `rootCA-key.pem` wird verweigert; `npm install ‹paket›` und `git tag` lösen eine Rückfrage aus | Versuch in Claude Code (Rückfragen ablehnen); der Leseversuch nutzt eine nicht vorhandene Datei dieses Namens, damit der echte Schlüssel auch bei einer fehlerhaften Regel nie gelesen wird | PO | ☑ |
| H3 | Modus ohne Berechtigungsprüfung ist gesperrt | Eintrag in `.claude/settings.json` | CC | ☑ |

## I. Dokumentation und Abschluss

| # | Kriterium | Nachweis | Wer | ✓ |
|---|---|---|---|---|
| I1 | Alle während des Setups getroffenen Abweichungen und Präzisierungen sind in den betroffenen Dokumenten nachgetragen (Version und Änderungshistorie) | PRs | CC | ☑ |
| I2 | Diese Checkliste ist vollständig abgehakt und per PR in `develop` übernommen | PR `docs: Setup-DoD abgeschlossen` | PO | ☑ |
| I3 | Die alten Dokumente im Claude-Projekt auf claude.ai sind gelöscht; `docs/` ist die einzige Masterkopie (EP-09) | Claude-Projekt | PO | ☑ |
