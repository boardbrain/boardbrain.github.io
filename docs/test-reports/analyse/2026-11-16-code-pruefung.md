# Code-Prüfung 16.11.2026

| | |
|---|---|
| Datum | 16.11.2026 |
| Commit-Stand | `994fdc9` auf `develop` (feat(results): Punkte und Rangfolge für eigene Spiele (I3-A2), #52), Arbeitsordner sauber, `git pull` ohne Änderung |
| Modell | Claude Fable 5.2 (`claude-fable-5-2`) |
| Umfang | gesamter Code (`src/`, `tests/`, Konfiguration, CI), abgeglichen mit `CLAUDE.md`, Richtlinien, Architektur und Spezifikation (Stand der Inkremente I1, I2, I3-A, I3-A2) |
| Nicht im Umfang | Zufall, Platzierung und Statistik im Detail (eigene Sitzung; Hinweise in Kapitel 6) |
| Status | abgeschlossen |

## 1. Kurzfassung

- **Kein kritischer Fund.** Datenverlust oder falsche Losergebnisse habe ich nicht gefunden.
- **1 Fund hoch:** Ein Abnahmekriterium zum Ändern der Spielbindung (US-VW-02 AK-3, bestehende Partien) ist weder umgesetzt noch in einem Bündel eingeplant. Es wird erreichbar, sobald I3-B Ergebnisse speichert.
- **3 Funde mittel:** Startperson nirgends gekennzeichnet (weicht von Spezifikation und Design-Referenz ab); ein Verdacht im Ablauf (Stein antippen während des Aufblinkens); ein Update während einer laufenden Partie verwirft sie beim Sprung von 0.2.0 auf 0.3.0.
- **10 Funde gering**, dazu Testlücken und weitere Auffälligkeiten.
- Die harten Regeln aus `CLAUDE.md` sind eingehalten (Kapitel 3).

**Was „Verdacht“ heißt:** Der Weg ist am Code Schritt für Schritt begründet, aber nicht im laufenden Programm nachgestellt. Alle anderen Funde sind am Code belegt. Ausgeführt habe ich in dieser Sitzung keine Tests; die Aussagen stützen sich auf das Lesen von Code, Tests und Dokumenten.

## 2. Was geprüft wurde

| Bereich | Tiefe |
|---|---|
| `src/app` (Dienste, Ports) | vollständig gelesen |
| `src/core` (Modell, Ablaufsteuerung, Ergebnisse, Losbausteine, Zufall) | vollständig gelesen; Zufall nur gestreift |
| `src/games` (Catan-Ablauf, Optionen, Übersicht, Registry) | Ablauf vollständig; Brett und Platzierung (`board/`, `placement/`) nicht |
| `src/infra` (Datenbank, Lesehooks, Plattform, Update), `src/sw`, `src/main.tsx` | vollständig gelesen (außer `userAgent.ts`) |
| `src/ui` Partie: `MatchView`, `matchFlow`, `MatchOverviewView`, Vorbereitung, `StagedCards`, `OrderScene` (Teil) | gelesen |
| `src/ui` Verwaltung: `GroupEditor` (Speichern, Sperre), übrige Ansichten | Dienstaufrufe und Fehlerbehandlung gezielt, nicht jede Zeile |
| `src/ui` Bilder, Karten-Bewegungen (`stagePlan`, `playStage`), Aufblinken (`highlightPlan`, `PlacementHighlight`), Diagnose, Kartenhand, CSS | nur über Regelsuche (Kapitel 3), nicht gelesen |
| Tests | alle Testnamen von Diensten, `infra` und E2E gesichtet; einzelne Tests gelesen |
| Konfiguration | `package.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `ci.yml`, `deploy.yml`, `index.html` gelesen; `eslint.config.js`, `.dependency-cruiser.cjs` nicht |
| Dokumente | Spezifikation 3.1 bis 3.7 und Stories SP, PG, VW, AB, LS, PL, SR, IN, ER; Umsetzungsplan 1 bis 5 und 9; Architektur nur 10.3, 10.4 und Fundstellen |

## 3. Regeln aus CLAUDE.md: Ergebnis der Suche

Gesucht über den ganzen Ordner `src/` (und wo sinnvoll `tests/`, `scripts/`):

| Regel | Ergebnis |
|---|---|
| Kein `Math.random` | kein Treffer |
| Kein `eval`, `new Function`, `innerHTML`, `dangerouslySetInnerHTML` | kein Treffer |
| Kein `eslint-disable`, `@ts-ignore`, `@ts-expect-error` | kein Treffer |
| Farbwerte nur in `tokens.css` | eingehalten; einziger Treffer ist `color-mix(… currentcolor …)` in `Pressable.module.css:21`, ohne Farbwert |
| Keine CSS-Animationen (`@keyframes`, `animation`, `transition`) | kein Treffer in CSS; Bewegungen laufen über Motion |
| Kein `useMemo`, `useCallback`, `memo` | kein Treffer |
| `useEffect` nur für externe Systeme | 14 Stellen mit `useEffect`/`useLayoutEffect` in 13 Dateien; angesehen: `AppLayout`, `RouteErrorScreen`, `UnsavedChangesGuard`, `StagedCards`, `TurnBand`, `MatchView` – alle für Dokument-Ereignisse, Router, DOM-Messung oder Animationen. Nicht angesehen: `EditorDialog`, `HandNavigation`, `DiagnosticsView`, `LookBackNote`, `MatchDialog`, `useElementSize`, `PlacementHighlight` |
| Knöpfe und Links nur als `PressableButton`/`PressableLink` | kein rohes `<button>` oder `<a>` in `src/ui` |
| Netzwerk nur im Service Worker und `infra/update` | einziges `fetch` in `src/sw/sw.ts:54` |
| Dexie nur in `infra/db`, Zusammensetzung nur in `main.tsx` | eingehalten |
| Code englisch | eingehalten; Deutsch nur als zitierte Beschriftungen in Kommentaren und als Testdaten |
| Valibot für Daten von außen | Paket ist nicht installiert; laut Umsetzungsplan 5 (I1-B) bewusst bis I4 zurückgestellt, bisher kommen keine Daten von außen |
| Erst speichern, dann zeigen (ADR-014) | eingehalten: jede Änderung der Partie läuft über `change` in `sessionService.ts:264-280`, die Ansicht liest nur über `useCurrentSession` |
| Sperre während der Partie (FA-AB-09) | Dienst prüft in derselben Transaktion (`masterDataService.ts:286`, `masterDataStore.ts:73`); bisher nur die Spielbindung, Archivieren und Löschen gibt es noch nicht |

## 4. Funde nach Schwere

Größe: klein = bis etwa eine Stunde, mittel = ein halber Tag, groß = eigenes Bündel.

### 4.1 Kritisch

Keine.

### 4.2 Hoch

#### H-1 Spielbindung ändern prüft bestehende Partien nicht (US-VW-02 AK-3)

- **Fundstelle:** `src/app/services/masterDataService.ts:279-307` (`editGroup`), `src/app/ports.ts:93-96` (`MatchFacts` kennt nur `hasScores`).
- **Soll:** „Gegeben ich ändere die Spielbindung, wenn alle bestehenden Partien und die Mitgliederzahl zur neuen Bindung passen, dann wird die Änderung übernommen; andernfalls verhindert die App sie und nennt den Grund.“ Laut Hinweis zur Story wird der Teil „bestehende Partien“ mit I3 nachgewiesen. In Umsetzungsplan 9 führt aber kein Bündel von I3 diese Story.
- **Ist:** `editGroup` prüft die Mitgliederzahl und die laufende Partie, nicht die gespeicherten Ergebnisse.
- **Fehlerfall:** Globaler Tisch „Dreier“ hat ein Catan-Ergebnis. Bindung auf „Nur Uno“ ändern wird gespeichert. Danach hängt ein Catan-Ergebnis an einem Tisch, der Catan nicht spielen darf, und die Catan-Farben der Mitglieder sind gelöscht. Gleiches bei „Catan ausschließen“ (AK-6 verweist auf AK-3).
- **Heute erreichbar?** Noch nicht über die Oberfläche, weil Ergebnisse erst mit I3-B gespeichert werden. Der Dienst `ResultService.record` existiert aber schon.
- **Vorschlag:** `MatchFacts` um „welche Spiele hat dieser Tisch gespielt“ erweitern, in `editGroup` vor dem Speichern prüfen, neuen Fehlercode zurückgeben, im Editor den Grund bei der Spielbindung nennen. Vorher klären, was „passen“ genau heißt (Vorschlag: an Spiel X binden nur, wenn alle Ergebnisse des Tischs von Spiel X sind; Catan ausschließen nur ohne Catan-Ergebnis). In ein Bündel von I3 aufnehmen, spätestens I3-C.
- **Größe:** mittel.

### 4.3 Mittel

#### M-1 Startperson ist nirgends gekennzeichnet

- **Fundstelle:** `src/ui/views/match/MatchOverviewView.tsx:144-163` und `:320-334` (nur Platznummern); `src/games/catan/generation/summary.ts:141` liefert `startingPersonId`, niemand liest es; in `src/i18n/de.ts` gibt es das Wort „Startperson“ nicht.
- **Soll:** US-LS-03 AK-3 („Person auf Platz 1 als Startperson des Spiels gekennzeichnet“), US-AB-04 AK-1, US-PL-05 AK-2. Die Design-Referenz `docs/design/i2d-running-match-final-preview.html:5148` und `:5176` zeigt ein Schild „Startperson“ an Platz 1 (ebenso `i2h-tap-pieces-final-preview.html:5390`).
- **Fehlerfall:** Am Tisch ist aus der App nicht ersichtlich, dass Platz 1 auch das Spiel beginnt; wer die Regel nicht kennt, erfährt es nicht.
- **Vorschlag:** Schild „Startperson“ wie in der Referenz in Reihenfolge und Übersicht ergänzen. Falls das Schild bewusst entfallen ist, die drei Abnahmekriterien und die Referenz anpassen (Entscheidung des Product Owners).
- **Größe:** klein.

#### M-2 Verdacht: Stein antippen während des Aufblinkens

- **Fundstelle:** `src/ui/views/match/MatchView.tsx:420-425` (`askRepeat` sperrt nur bei `isPending`, nicht während einer Bewegung) und `:633` (`onRepeatPiece={askRepeat}` immer gesetzt); `src/ui/views/match/PlacementStep.tsx:163-172`; `src/ui/board/Board.tsx:194-201` (Tippfläche immer da); `src/app/services/sessionService.ts:400-412`; `src/core/generation/flow.ts:110-113`.
- **Weg:** Während das Licht für Stein N läuft, sind „Wiederholen“, „Zurück“ und der Vorwärts-Knopf gesperrt, die schon gesetzten Steine auf dem Brett aber antippbar. Tippt jemand eine frühere Straße an und bestätigt „Wiederholen“, bestätigt der Dienst Stein N (er wartet ja) und verwirft die Straße. Stein N behält `isStaged: false`, weil seine Bewegung nie zu Ende gemeldet wurde: die spätere Meldung `markStaged(N)` trifft nach dem Verwerfen einen anderen Index.
- **Folge:** `unstagedStepIndex` zeigt danach dauerhaft auf den alten Stein. `MatchView.tsx:264-267` spielt eine Bewegung nur, wenn der angezeigte Schritt genau dieser Index ist. Alle weiteren Schritte der Partie erscheinen dann sofort, ohne Karten-Bewegung und ohne Aufblinken. Zusätzlich widerspricht schon das Öffnen der Rückfrage US-IN-04 AK-3 („ein Tippen außerhalb dieses Buttons beeinflusst die Animation nicht“).
- **Schaden:** Keine falschen Daten, aber die Inszenierung fällt für den Rest der Partie aus.
- **Vorschlag:** Erst mit einem E2E-Test nachstellen (Stein antippen, während `data-page` noch die Bewegung zeigt). Dann in `MatchView` Steine während einer Bewegung nicht antippbar machen (`onRepeatPiece` nur ohne `isStaging`). Zur Absicherung im Dienst beim Bestätigen eines wartenden Schritts durch `repeatStep` dessen Merker mit setzen.
- **Größe:** klein.

#### M-3 Update während einer laufenden Partie verwirft sie

- **Fundstelle:** `src/core/generation/session.ts:18` (`SESSION_SCHEMA_VERSION = 4`; Version 0.2.0 ist mit 3 veröffentlicht), `src/sw/sw.ts:9-13` (neuer Stand wird aktiv, sobald alle Fenster geschlossen sind), `docs/BoardBrain_Architektur.md:911` („Weil Updates während einer Partie gesperrt sind (FA-UP-02), wechselt eine Sitzung nie die App-Version“).
- **Ist:** Die Sperre von Updates kommt erst mit I4. Bis dahin kann die App mitten in einer Partie wechseln.
- **Fehlerfall:** Auf dem Handy läuft mit 0.2.0 eine Partie in der Platzierung. 0.3.0 erscheint, die App wird geschlossen und wieder geöffnet. Statt der Partie steht dort „unbekannte Version“ mit dem Angebot, sie zu beenden (`UnsupportedSession.tsx`); die gelosten Schritte sind nicht mehr einsehbar.
- **Einordnung:** Kein Absturz, und Vorabversionen versprechen nichts für ihre Daten (E-40). Trotzdem überraschend am Spieleabend.
- **Vorschlag:** Für 0.3.0 im Änderungsprotokoll und in der Abnahme nennen („laufende Partie vor dem Update beenden“). Annahme in Architektur 10.3 um „ab I4“ ergänzen. Kein Code nötig, wenn I4 die Sperre bringt.
- **Größe:** klein (Doku).

### 4.4 Gering

#### G-1 „Generierung starten“ ohne Prüfung der Optionen

- **Fundstelle:** `src/ui/views/match/ColorsView.tsx:40-50`, `src/app/services/sessionService.ts:346`.
- **Fehlerfall (PC-Browser):** Optionen → Farben → zurück → „Selbst festlegen“ wählen und nur eine Person antippen → Vorwärts-Taste des Browsers → „Generierung starten“. `startInputOf` liefert eine unvollständige Reihenfolge, der Dienst wirft „the options of the match are valid“, der Fehlerbildschirm erscheint. Auf Handy und Tablet ohne Vorwärts-Taste kaum erreichbar.
- **Vorschlag:** In `ColorsView` wie bei fehlender Vorbereitung umleiten, wenn `isOrderComplete(preparation)` falsch ist. Größe: klein.

#### G-2 Verdacht: Service Worker kann eine alte `index.html` einlagern

- **Fundstelle:** `src/sw/sw.ts:24-28` (`cache.addAll` ohne `cache: 'reload'`).
- **Weg:** `cache.addAll` lädt über den HTTP-Cache des Browsers. GitHub Pages liefert Dateien mit zehn Minuten Haltbarkeit aus. Hat das Gerät `index.html` in den letzten zehn Minuten aus dem Netz geladen (erster Besuch oder vorheriges Update) und erscheint in dieser Zeit eine neue Version, landet die alte `index.html` im neuen Cache. Sie verweist auf Skriptdateien, die es auf dem Server nicht mehr gibt: leere Seite bis zum nächsten Update.
- **Einordnung:** Das Zeitfenster ist sehr schmal (zwei Veröffentlichungen binnen zehn Minuten sind wegen der Prüfungen praktisch ausgeschlossen; bleibt „erster Besuch kurz vor einer Veröffentlichung“).
- **Vorschlag:** Mit dem Umbau des Service Workers in I4 (US-UP-01) Dateien ohne Hash im Namen mit `new Request(url, { cache: 'reload' })` laden und einen Test dafür ergänzen. Größe: klein.

#### G-3 Tisch-Editor zeigt bei jedem Dienstfehler denselben Text

- **Fundstelle:** `src/ui/views/management/GroupEditor.tsx:232-237` und `:493-495`; Sperre in `:130-131` nur bei `status === 'active'`.
- **Fehlerfall:** Nach M-3 liegt eine Partie unbekannter Version vor. `useCurrentSession` meldet `unsupported` ohne Tisch, der Editor zeigt keine Sperre. Der Dienst lehnt die geänderte Spielbindung trotzdem mit `group-in-session` ab (`masterDataService.ts:286`). Angezeigt wird nur der allgemeine Text „Bearbeiten fehlgeschlagen“, ohne Grund und ohne „Partie beenden“ (Spezifikation 3.5).
- **Vorschlag:** Fehlercode `group-in-session` im Editor wie die sichtbare Sperre behandeln, oder `useCurrentSession` gibt den Tisch auch bei unbekannter Version zurück. Größe: klein.

#### G-4 `errorLogService.record` kann entgegen seiner Zusage werfen

- **Fundstelle:** `src/app/services/errorLogService.ts:40-56` und `:93-101`.
- **Fehlerfall:** `JSON.stringify` gibt für manche Objekte `undefined` zurück (z. B. mit `toJSON() { return undefined; }`). `cut(undefined)` greift auf `.length` zu und wirft, bevor der `try`-Block beginnt. Praktisch sehr selten.
- **Vorschlag:** Ergebnis von `JSON.stringify` mit `?? Object.prototype.toString.call(error)` absichern; Testfall ergänzen. Größe: klein.

#### G-5 Verdacht: Bewegung vor dem Speichern ohne Zeitgrenze

- **Fundstelle:** `src/ui/views/match/MatchView.tsx:379-381` (`await leaveRef.current?.leave()` vor `sessions.confirm`), `src/ui/views/match/cards/ResourcesScene.tsx:100`. Die Steine in `MatchView.tsx:403-412` sind dagegen mit `atMost` begrenzt, nachdem am 12.11.2026 genau so eine Sperre aufgetreten war.
- **Fehlerfall:** Endet die Bewegung der Startrohstoff-Karten einmal nicht, bleibt „Weiter“ dauerhaft gesperrt; die Bestätigung wird nie gespeichert.
- **Vorschlag:** `leave()` ebenfalls in `atMost` legen. Größe: klein.

#### G-6 Ungenutzte Dienstfunktionen, Lesezugriffe als Schreibtransaktion

- **Fundstelle:** `src/app/services/sessionService.ts:305-318` (`current`, `isSessionActive` werden außerhalb der Tests nirgends aufgerufen); `sessionStore.ts:28` und `resultStore.ts:55` öffnen auch für `prepare`, `draft`, `draftFromSession` eine Schreibtransaktion.
- **Einordnung:** Kein Fehler. `isSessionActive` ist nach Architektur 10.4 für Import und Update (I4) gedacht.
- **Vorschlag:** `current` entfernen oder nutzen; `isSessionActive` bis I4 stehen lassen. Lesetransaktionen erst anfassen, wenn die Stores für I4 ohnehin geändert werden. Größe: klein.

#### G-7 Tests, die weniger prüfen als ihr Name sagt

- `tests/e2e/match.spec.ts:287`: heißt „US-AB-06 AK-1“, prüft aber AK-3 (Beenden ohne Ergebnis). AK-1 („Ergebnis eintragen“ und „Partie beenden ohne Ergebnis“ in der Übersicht) ist erst mit I3-B erfüllbar.
- `tests/e2e/match.spec.ts:274`: „US-PL-05 AK-1, AK-2“ prüft nur den Text „Platzierung übersprungen“, nicht Reihenfolge und Startperson in der Übersicht.
- `src/games/catan/generation/summary.test.ts:26`: „shows the order with place 1 as starting person“ prüft nur das Datenfeld; angezeigt wird es nirgends (M-1).
- `src/app/services/sessionService.test.ts:379`: „AK-7: a repetition is recorded nowhere“ vergleicht nur die Feldnamen der Sitzung.
- **Vorschlag:** Namen und Bezüge berichtigen, AK-2 von US-PL-05 um die Reihenfolge ergänzen. Größe: klein.

#### G-8 Ergebnis ohne Obergrenzen

- **Fundstelle:** `src/core/results/rules.ts:196-214`.
- **Ist:** Punkte, Spieldauer und Notizen haben keine Obergrenze, das Datum darf in der Zukunft liegen. Die Spezifikation 3.6 nennt keine Grenzen.
- **Fehlerfall:** Tippfehler „1200“ statt „120“ Minuten oder Jahr 2062 gehen ohne Rückfrage in Durchschnittsdauer, Rekorde und Diagramme ein.
- **Vorschlag:** In I3-B entscheiden: Plausibilitätswarnung (wie beim Sieger) für sehr lange Dauer und Datum in der Zukunft, Längengrenze für Notizen. Größe: klein, aber Spezifikation betroffen (Haltepunkt).

#### G-9 Feste Werte in der Oberfläche statt aus Daten

- `src/ui/views/match/MatchOverviewView.tsx:290`: Modus immer `t('partie.standard')`, nicht aus `session.setup.options.mode`. In Version 1 gleich, mit einem zweiten Modus falsch.
- `src/ui/views/match/TableChoiceView.tsx:25` und `:198`: `CATAN_MAX_SEATS = 4` doppelt zur Spielerzahl im Catan-Modul.
- **Vorschlag:** Bei der nächsten Änderung dieser Dateien mitnehmen. Größe: klein.

#### G-10 Reiter der Übersicht für Screenreader unvollständig

- **Fundstelle:** `src/ui/views/match/MatchOverviewView.tsx:295-316`.
- **Ist:** `role="tablist"` und `role="tab"`, aber kein `tabpanel`, kein `aria-controls`, keine Pfeiltasten.
- **Vorschlag:** Mit den Reitern der Tischseite in I3-C eine gemeinsame Reiter-Komponente bauen. Größe: klein bis mittel.

## 5. Testlücken

| Nr. | Lücke | Fundstelle | Vorschlag |
|---|---|---|---|
| T-1 | Kein Test führt den echten `ResultService` auf der echten Datenbank aus. Die Diensttests nutzen `InMemoryResultStore`, die Datenbanktests nur die Repositories. Dass die Kombination heikel ist, sagt der Kommentar in `src/infra/db/resultStore.ts:7-10` selbst (vorzeitiger Abschluss der Transaktion). | `tests/support/resultFakes.ts:44-97`, `src/infra/db/resultStore.test.ts:75-103` | Ein Test je Weg (`record`, `recordFromSession`, `edit`, `delete`) mit `createResultService` auf `createDexieResultStore`; spätestens die E2E-Tests von I3-B decken es ab. |
| T-2 | Kein Test für Tippen auf einen Stein während des Aufblinkens (M-2). `cardDraw.spec.ts:143` prüft „Tippen daneben“ nur bei Karten. | `tests/e2e/highlight.spec.ts` | E2E-Test ergänzen; er entscheidet zugleich über den Verdacht. |
| T-3 | Kein Test für US-VW-02 AK-3 mit bestehenden Partien (H-1). | `src/app/services/masterDataService.test.ts:613-645` | Mit der Umsetzung von H-1. |
| T-4 | Kein Test für den Tisch-Editor bei einer Partie unbekannter Version (G-3) und für „Generierung starten“ mit unvollständiger Reihenfolge (G-1). | `src/ui/views/match/PreparationViews.test.tsx` | Mit den Korrekturen. |
| T-5 | Für `src/app` gibt es keine Abdeckungsschwelle, obwohl jede Funktion dort Tests haben soll. | `vitest.config.ts:51-54` | Schwelle für `src/app/**` ergänzen, sobald der aktuelle Wert bekannt ist. |

Positiv: Die Diensttests decken Doppeltipps, Neustart, Sperre und Transaktionsgrenzen gut ab; die Sperre wird auch auf der echten Datenbank geprüft (`sessionStore.test.ts:85`).

## 6. Für die Zufallsprüfung

Hier nur gestreift; bitte in der eigenen Sitzung nachprüfen.

1. **Bewegungen kennen das Ergebnis.** `OrderScene.tsx:143-149` gibt `result` an `planOrder`, ebenso bekommen `stagePlan.ts` und `highlightPlan.ts` das Ergebnis. Prüfen, dass bis zur Landung nichts davon abhängt (US-IN-02 AK-3, E-39) und dass die Tests den Anteil 1/n je Station wirklich belegen.
2. **Eine Zufallsquelle für Losen und Dekoration.** `src/main.tsx:81-100` gibt dieselbe `CryptoRandomSource` an Dienst und Ansichten (NFA-ZF-03). Für die Fairness unkritisch, aber: Die Zahl der dekorativ verbrauchten Werte hängt von Ansicht und Gerät ab; prüfen, dass kein Test eine feste Abfolge über beide hinweg annimmt.
3. **Kandidaten doppelt berechnet.** `definition.ts:213-216`: `candidates` wird getrennt von `drawOrderSpin` gebildet (dort `remainingForOrder`). Beide müssen dieselbe Menge in derselben Reihenfolge sein; ein Test, der das festhält, fehlt vermutlich.
4. **Verdeckter Plan liegt lesbar in der Datenbank.** `gameState.hiddenPlan` (`definition.ts:25-38`) steht unverschlüsselt in IndexedDB; mit den Entwicklerwerkzeugen wären die nächsten Gebäude sichtbar. Bewerten, ob das für einen Spieleabend zählt.
5. **Wiederholen und Plan.** Nach „Gebäude k wiederholen“ wird ab k neu geplant (`gameStateAfterRepeat`, `definition.ts:318-339`), nach „Straße wiederholen“ bleibt der Plan. Bedingte Verteilung gegen `docs/test-reports/sackgassen.md` prüfen.
6. **Abbruch des Planers.** `planner.ts:71` wirft nach 10.000 Versuchen; das führte mitten in einer Partie zum Fehlerbildschirm. Wahrscheinlichkeit belegen.
7. **Verzerrungsfreie Umrechnung.** `uniform.ts:14-26` sieht richtig aus (Verwerfen ab dem größten Vielfachen); Grenzfälle n = 1 und n = 2^32 prüfen.
8. **Statistische Suite mit Wiederholung.** `vitest.config.ts:41` wiederholt einen gescheiterten Test einmal. Prüfen, ob die Tests bei α = 0,001 eine kleine echte Verzerrung trotzdem sicher finden.
9. **Würfeltest der Diagnose.** `diceTest.ts:49-57`: 60.000 Würfe am Stück auf dem Hauptfaden, und einer von tausend Läufen meldet „auffällig“, obwohl alles stimmt. Text und Laufzeit auf einem langsamen Handy prüfen.
10. **E2E-Zufall.** `tests/e2e/seededRandom.ts` ersetzt `crypto.getRandomValues` nur in der Testseite; im Produktivcode gibt es keinen Schalter dafür. Gut so, bitte bestätigen.

## 7. Weitere Auffälligkeiten

| Nr. | Fundstelle | Einschätzung |
|---|---|---|
| W-1 | Kopfzeile „Grundlage“ in `docs/Umsetzungsplan.md:9` (Spezifikation v0.17, Richtlinien v0.13, Anforderungen v0.21, Architektur v0.32), `docs/BoardBrain_Architektur.md:10`, `docs/BoardBrain_Spezifikation.md:10`, `docs/Entwicklungsrichtlinien.md:10`, `docs/Abnahme-Checkliste.md:10` | Die genannten Versionen sind veraltet (aktuell: Spezifikation 0.21, Architektur 0.40, Anforderungen 0.25, Richtlinien 0.17). Entweder pflegen oder die Versionsnummern dort weglassen. |
| W-2 | `CLAUDE.md:7` und `:68` | Valibot steht im Stack und als Regel, ist aber bis I4 nicht installiert. Ein Halbsatz „ab I4“ vermeidet Verwirrung. |
| W-3 | `src/infra/db/masterDataStore.ts:11-46`, `sessionStore.ts:9-11` gegenüber `resultStore.ts:7-10` | Zwei Bauweisen für Repositories: native `async`-Funktionen und Dexie-Ketten. Die erste bricht laut eigenem Kommentar, sobald nach einem Schreiben in derselben Transaktion weitergearbeitet wird. Für I4 und I5 (Sicherungspunkt plus Löschen, Import) vorher vereinheitlichen. |
| W-4 | `src/infra/db/readHooks.ts:114-130` | Die Diagnose zählt Personen, Tische und Spiele, aber keine Ergebnisse. Mit I3-C ergänzen. |
| W-5 | `src/infra/db/readHooks.ts:83-86` | `unsupported` trägt keinen Tisch; der Start zeigt dann kein Band „spielt gerade“ (`StartView.tsx:39`). Hängt mit G-3 zusammen. |
| W-6 | `index.html:8` | Der Seitentitel ist fest „BoardBrain“, auch im Abnahme-Build „BoardBrain Dev“. Im Browser-Reiter nicht unterscheidbar. |
| W-7 | `src/app/services/sessionService.ts:234-238`, `resultService.ts:130-134` | Eine Gruppe wird über `listAll()` gesucht statt gezielt gelesen. Bei den erwarteten Datenmengen ohne Belang; ein `get(id)` wäre klarer. |
| W-8 | `.github/workflows/deploy.yml:27-28` | Vor der Veröffentlichung läuft nur `check`, nicht E2E und nicht die statistische Suite; verlässt sich auf die Prüfungen des PRs nach `main`. In Ordnung, solange Tags nur auf solchen Commits entstehen. |
| W-9 | `src/ui/views/diagnostics/DiagnosticsView.tsx:100`, `src/i18n/format.ts:12` | Die Oberfläche liest die Uhr direkt (`new Date()`), die Dienste über `Clock`. Kein Regelverstoß, aber uneinheitlich. |
| W-10 | `src/games/catan/generation/summary.ts:97` | `placeOf` gibt ohne Reihenfolge 0 zurück und verlässt sich dann auf die stabile Sortierung; funktioniert, ist aber leicht zu übersehen. |
| W-11 | `vite.config.ts:17` | `style-src 'unsafe-inline'` ist für die Stilangaben von Motion nötig; bei der Sicherheitsbetrachtung vor 1.0 bewusst festhalten. |
| W-12 | `src/core/model/names.ts:9-11` | Namen werden nur am Rand bereinigt; „Anna  Meier“ mit zwei Leerzeichen gilt als anderer Name als „Anna Meier“. Entspricht der Spezifikation 3.4, kann aber beim Import zu scheinbar doppelten Personen führen. |

## 8. Vereinfachungen

Nur eine mit deutlichem Gewinn: **W-3**, die Repositories auf eine Bauweise bringen. Alles andere, was mir beim Lesen auffiel (zweimal `repeatLinesOrOnly` in `MatchView.tsx:732` und `MatchOverviewView.tsx:396`, zweimal `findGroup`), ist zu klein für einen eigenen Schritt.

## 9. Vorschlag für den Umsetzungsplan

| Aufgabe | Funde | Wann | Modell, Aufwand |
|---|---|---|---|
| In I3 aufnehmen: Spielbindung gegen bestehende Partien prüfen (US-VW-02 AK-3 und AK-6) | H-1, T-3 | als Teil von I3-C; vorher Frage an den Product Owner, was „passen“ heißt | Sonnet, medium |
| **K-10** Startperson kennzeichnen | M-1, G-7 (Testnamen) | vor Release 0.3.0 | Sonnet, medium |
| **K-11** Ablauf absichern: Steine während einer Bewegung sperren, `leave()` begrenzen, „Generierung starten“ prüfen, Sperrgrund im Editor | M-2, G-1, G-3, G-5, T-2, T-4 | vor Release 0.3.0; zuerst der E2E-Test zu M-2 | Sonnet, medium (bei zwei Fehlversuchen Opus nach der Wechselregel) |
| **K-12** Aufräumen im Dienst: `messageOf`, ungenutztes `current`, Abdeckungsschwelle für `app` | G-4, G-6, T-5 | bei Gelegenheit | Sonnet, medium |
| **K-13** Doku-Pflege: Kopfzeilen „Grundlage“, Valibot „ab I4“, Annahme zu Updates in Architektur 10.3, Hinweis im Änderungsprotokoll 0.3.0 | M-3, W-1, W-2 | reiner Doku-PR | Sonnet, low |
| In I3-B mitnehmen | G-8 (Grenzen, Haltepunkt Spezifikation), T-1 | im Bündel | wie Bündel |
| In I3-C mitnehmen | G-9, G-10, W-4 | im Bündel | wie Bündel |
| In I4 mitnehmen (erstes Bündel) | G-2, W-3, W-5 | im Bündel „Service Worker und Updates“ bzw. „Datenbank“ | Opus, high |

Die Nummern K-10 bis K-13 sind Vorschläge; die letzte vergebene Nummer im Plan ist K-9.
