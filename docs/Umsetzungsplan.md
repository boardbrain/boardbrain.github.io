# BoardBrain – Umsetzungsplan

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Reihenfolge, Zuschnitt der Story-Bündel, Modellwahl und Ablauf der Sitzungen mit Claude Code |
| Version | 0.11 |
| Stand | 08.10.2026 |
| Grundlage | BoardBrain_Spezifikation.md v0.8 (2.3), Entwicklungsrichtlinien.md v0.5 (2, 14), BoardBrain_Anforderungsdokumentation.md v0.14 (9.3, 13), BoardBrain_Architektur.md v0.10 (19) |
| Sprache | Deutsch |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 07.10.2026 | Erstfassung nach Abschluss des Setups: Reihenfolge, Zuschnitt von Inkrement I1, Modelle, Ablauf |
| 0.2 | 07.10.2026 | K-1 erledigt: Empfehlung, Dependabot-PR #3 (`@babel/core` 8) zu mergen |
| 0.3 | 07.10.2026 | I1-A umgesetzt (PR #11) |
| 0.4 | 07.10.2026 | I1-B umgesetzt (PR #12); Valibot nach Entscheidung des Product Owners erst mit dem ersten Bündel, das Daten von außen prüft (I4) |
| 0.5 | 07.10.2026 | Neues Bündel I1-E „Personen und Gruppen im Überblick“ (US-VW-05) nach I1-C (PR #13) |
| 0.6 | 07.10.2026 | D-1 erledigt (#14): Farbwerte, Designs mit Standard „Holz“; Hinweise für I1-C und US-GB-01 (I6) |
| 0.7 | 07.10.2026 | I1-C umgesetzt: Gruppen und Farben (Abnahme durch den Product Owner offen) |
| 0.8 | 08.10.2026 | Ergebnis der Abnahme von I1-C: Gruppenseite als „Spielraum“, Catan ausschließen, überarbeitete Gruppenfarben (I1-C); neues Bündel I1-F „Bearbeiten“ nach I1-E (Spezifikation 0.8); Designvorschläge vor jeder neuen Oberfläche (4.1, Richtlinien 2.5) |
| 0.9 | 08.10.2026 | I1-C umgesetzt (#15): Spielraum wie Designvorschlag F6, Spielauswahl mit aufklappbarer Liste eigener Spiele (Variante C), Suchfelder fokussieren nur mit Maus |
| 0.10 | 08.10.2026 | Neue Aufgabe D-3 „Startansicht und Navigation“ nach I1-C und vor I1-E: Startansicht, Kopfzeile und Verwaltung im Stil des Spielraums |
| 0.11 | 08.10.2026 | D-3 umgesetzt (#17): Kartenhand, Startansicht mit Spielkarten, Logo, Zurück, Smartphones nur im Hochformat (E-29); Abnahme von I1-D angepasst; Design-Referenz `docs/design/d3-start-navigation-final-preview.html` mit Verweisen je Inkrement, Platz für „Ergebnis eintragen“ auf dem Start (7) |

## 1. Zweck

Dieses Dokument legt fest, **was als Nächstes kommt und wie**. Jede neue Sitzung mit Claude Code beginnt mit einem Auftrag, der auf diesen Plan verweist. Claude Code pflegt den Status im selben Pull Request, mit dem ein Bündel oder eine Aufgabe umgesetzt wird. Den Zuschnitt eines neuen Inkrements legt Claude Code dem Product Owner zu Beginn des Inkrements zur Freigabe vor (Spezifikation 2.3) und trägt ihn hier nach.

Rangfolge bei Widerspruch bleibt: Anforderungen > Spezifikation > Architektur > Richtlinien > dieser Plan.

## 2. Reihenfolge

| # | Schritt | Wann | Status |
|---|---|---|---|
| 0 | Kleine Aufgabe K-1: Dependabot-PR #3 (`@babel/core` 8) prüfen | als Erstes | erledigt: Empfehlung „mergen“ |
| 1 | Inkrement I1 Fundament: Bündel I1-A, I1-B, I1-C, I1-E, I1-F, I1-D (Kapitel 5) | danach, in dieser Reihenfolge | in Arbeit: I1-A (#11) und I1-B (#12) umgesetzt, I1-C umgesetzt (#15) |
| 2 | Design D-1: Farbwerte (OP-11) | parallel zu I1, spätestens vor der Abnahme von I1-C | erledigt (#14) |
| 2a | Design D-3: Startansicht und Navigation | nach I1-C, vor I1-E | umgesetzt (#17) |
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
| Design (D-1, D-2, D-3), Zuschnitt eines neuen Inkrements | Opus 5.5 | medium |
| Code-Review, schwierige Fehler | Opus 5.5 | high |

**Wechselregel:** Liegt Sonnet zweimal hintereinander daneben (Tests scheitern wiederholt, Anforderung falsch verstanden), wechselt der Product Owner mit `/model` auf Opus und schreibt „mach weiter“. Der Arbeitsbranch bleibt erhalten.

## 4. Ablauf einer Sitzung

### 4.1 Bündel

1. **Product Owner:** neue Sitzung in VS Code beginnen (bzw. `/clear`), Modell und Aufwand nach Kapitel 5 (Bündel) bzw. 6 (kleine Aufgaben) einstellen, Auftrag senden:
   > Setze Bündel ‹ID› aus docs/Umsetzungsplan.md um.
2. **Claude Code:** liest diesen Plan, die genannten Stories und Kapitel. Antwortet mit einem **kurzen Umsetzungsplan**: Schritte, Tests je Abnahmekriterium, neue Pakete mit Version, Fragen zu Haltepunkten. Beginnt erst nach „los“.
   **Bei neuen oder geänderten Oberflächen** zeigt Claude Code danach zuerst Designvorschläge als lokale, klickbare HTML-Datei (Richtlinien 2.5) und baut erst nach der Wahl des Product Owners. *(neu in 0.8)*
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
| I1-A Zufall und Losbaustein | US-LS-01 | Opus, high | `feat/us-ls-01-random-draw` | umgesetzt (#11) |
| I1-B Personen, Spiele, Datenbank | US-PG-01, US-SP-02 | Opus, high | `feat/us-pg-01-persons-and-games` | umgesetzt (#12) |
| I1-C Gruppen und Farben | US-PG-02, US-PG-03 | Sonnet, medium | `feat/us-pg-02-groups-and-colors` | umgesetzt (#15) |
| I1-E Personen und Gruppen im Überblick | US-VW-05 | Sonnet, medium | `feat/us-vw-05-persons-and-groups-overview` | offen |
| I1-F Bearbeiten | US-VW-06, US-VW-02, US-VW-07 | Sonnet, medium | `feat/us-vw-06-edit-master-data` | offen |
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
- **Pakete:** `dexie` 4.4.6, `dexie-react-hooks` 4.4.0, `fake-indexeddb` 6.2.5 (nur Entwicklung). `valibot` wurde nach Entscheidung des Product Owners zurückgestellt: In I1-B kommen keine Daten von außen (Richtlinien 7.3); es kommt mit dem ersten Bündel von I4, das Importdateien oder Sicherungspunkte prüft.
- **Abnahme durch den Product Owner:** am PC und auf Galaxy S26 Personen und Spiele anlegen, Duplikat-Hinweise prüfen, Seite neu laden (Daten bleiben).

### I1-C Gruppen und Farben

- **Inhalt:** Gruppen mit 2 bis 12 Mitgliedern und Bindung (global, global ohne Catan oder ein Spiel), Namensvorschlag, Prüfung gleichnamiger Personen (US-PG-02, Spezifikation 3.4); Farbmodell mit Gruppen- und Catan-Farbe, automatische Vergabe und Farbtausch (US-PG-03, Spezifikation 3.3).
- **Erste Abnahme (07./08.10.2026):** Die erste Fassung (Formular, Palette aus D-1) hat der Product Owner nicht abgenommen. In drei Runden Designvorschlägen (`groups-preview.html`) und mehreren Farbrunden (`color-preview.html`) sind entschieden worden:
  - **Catan ausschließen** bei globalen Gruppen (FA-PG-04, E-27, US-PG-02 AK-7).
  - **Gruppenfarben nach E-28** in dieser Reihenfolge der automatischen Vergabe: Rot, Blau, Gelb, Moosgrün, Indigo (hell), Orange, Petrol, Magenta, Kaffee, Rosé, Steingrau, Weiß (`GROUP_COLOR_KEYS` in `core/model/colors.ts`; Catan: Rot, Blau, Weiß, Orange); Kontrastregel nach Architektur 13.4.
  - **Gruppenseite als „Spielraum“** (Variante F6): Alle Gruppen erscheinen als Tische im Raster (Mini-Tisch mit Farbpunkten, Name, Bindung und Anzahl), erste Karte „+ Neuer Tisch“. Eine Lupe neben der Überschrift öffnet eine Suche nach Gruppenname und Mitgliedern („Anna sitzt hier“). „+ Neuer Tisch“ öffnet den Editor, auf dem Handy bildschirmfüllend mit Zurück-Pfeil, auf Tablet und PC als großes Fenster über dem Raum.
  - **Editor:** Bank „Wer spielt mit?“, runder Tisch mit farbigen Plätzen (Catan-Farbe als eckiges Zeichen), daneben die Palette der gewählten Person (Gruppenfarbe rund, Catan-Farbe eckig, Anfangsbuchstabe zeigt, wer eine Farbe hat, Antippen tauscht), darunter Gruppenname und „Was wird gespielt?“ mit dem Schalter „Catan ausschließen“.
  - **Bank:** auf dem Handy eine wischbare Zeile mit festem Knopf „Alle ‹n› ▾“, auf Tablet und PC ein Feld mit zwei Zeilen zum Scrollen nach unten mit „Alle ‹n› anzeigen ▾“; aufgeklappt mit Suchfeld „Person suchen“. Nirgends sichtbare Scrollleisten, stattdessen ein weich auslaufender Rand.
  - **„Was wird gespielt?“** (Variante C aus `binding-preview.html`): immer eine Zeile „Alle Spiele | Nur Catan | Anderes Spiel ▾“. Der dritte Knopf klappt die eigenen Spiele als Liste auf, die nach etwa vier Einträgen scrollt, ab sechs eigenen Spielen mit Suchfeld „Spiel suchen“. Ein gewähltes eigenes Spiel steht danach im dritten Knopf („Nur Uno ▾“).
- **Hinweis:** Das nachträgliche Ändern von Farben und Bindung einer gespeicherten Gruppe gehört zu US-VW-02 (I1-F); I1-C vergibt und tauscht Farben beim Anlegen.
- **Pakete:** keine; `zustand` war nicht nötig, der Formularzustand bleibt lokal (Architektur 13.2). Aufklappen und Einblenden zunächst ohne Animation; Motion (Architektur 13.6) kommt mit dem ersten Bündel, das Animationen braucht.
- **Abnahme durch den Product Owner:** Gruppen mit 2, 4, 5 und 12 Mitgliedern anlegen; Catan bei 5 Mitgliedern gesperrt; Catan ausschließen bei 3 Mitgliedern; Farbtausch; Suche nach Gruppe und Person; Bank auf- und zuklappen und durchsuchen; Hoch- und Querformat auf S26 und iPad.

### I1-E Personen und Gruppen im Überblick

- **Reihenfolge:** nach I1-C und D-3, vor I1-D. Die ID ist neu vergeben, weil IDs nie umnummeriert werden (Richtlinien 11.1).
- **Inhalt:** Personenliste mit den Gruppen jeder Person; Detailansicht einer Person (`#/verwaltung/personen/‹id›`); Gruppenliste und Detailansicht einer Gruppe mit Bindung, Mitgliedern und Farben (`#/verwaltung/gruppen/‹id›`); gegenseitige Verweise (US-VW-05). Die Detailansichten sind die Grundlage, an die US-VW-02, -06 und -07 (Bearbeiten, I1-F), US-ER-04 (Ergebnisse einer Gruppe, I3) sowie US-VW-01, -03 und -04 (Archivieren, Löschen, I5) anknüpfen. *(geändert in 0.8)*
- **Hinweis (0.8):** Die Gruppenliste ist seit I1-C der „Spielraum“; I1-E ergänzt die Detailansicht eines Tisches und die Personenseite. Für beide zuerst Designvorschläge im Stil des Spielraums (Richtlinien 2.5).
- **Warum hier:** Erst mit I1-C gibt es Gruppen; ohne Übersicht lassen sich angelegte Gruppen und Farben nicht nachsehen, was spätestens am ersten Spieleabend mit I2 fehlt.
- **Pakete:** keine.
- **Abnahme durch den Product Owner:** Personen und Gruppen anlegen, Gruppen in der Personenliste sehen, zwischen Person und Gruppe hin- und herspringen, Zurück-Taste auf dem S26.

### I1-F Bearbeiten *(neu in 0.8)*

- **Reihenfolge:** nach I1-E (die Detailansichten sind der Ort zum Bearbeiten) und vor I1-D.
- **Inhalt:** Person umbenennen mit Prüfung gleichnamiger Mitglieder in ihren Gruppen (US-VW-06); Gruppe bearbeiten: Name, Farben, Bindung einschließlich „Catan ausschließen“, Mitglieder unveränderlich (US-VW-02); eigenes Spiel umbenennen mit eindeutigem Namen, Catan nicht umbenennbar (US-VW-07).
- **Warum vorgezogen:** Wunsch des Product Owners (Spezifikation 0.8). Tippfehler oder eine falsche Bindung sollen vor dem ersten Spieleabend mit I2 korrigierbar sein. Archivieren und Löschen bleiben in I5, weil sie Partien (I3) und Sicherungspunkte (I4) brauchen.
- **Hinweis:** US-VW-02 AK-3 (bestehende Partien) wird mit I3 nachgewiesen, AK-5 (laufende Partie) mit I2; US-VW-06 AK-1 für Ergebnisse und Statistiken mit I3.
- **Pakete:** keine.
- **Abnahme durch den Product Owner:** Person, Gruppe und eigenes Spiel umbenennen; Farbe und Bindung einer Gruppe ändern, Catan ausschließen und wieder zulassen; Konflikte (gleichnamige Person in einer Gruppe, doppelter Spielname, 5 Mitglieder an Catan) werden verhindert.

### I1-D Brett und Installation

- **Inhalt:** Brettmodell in `core/board` mit 19 Feldern, Kreuzungen, Kanten und Nachbarschaften (Architektur 5.2) als Grundlage für die Platzierung in I2; Darstellung des Bretts (US-PL-01); Manifest und minimaler Service Worker mit `vite-plugin-pwa` (`injectManifest`), damit die Installation unter Brave für Android früh geprüft wird (Architektur 11, 12.1, 18.1, 19); `docs/Abnahme-Checkliste.md` anlegen (Architektur 14.6).
- **Hinweis (0.11):** Die App-Symbole für Manifest und Startbildschirm entstehen aus dem Logo von D-3 (`src/ui/components/Logo.tsx`, `public/favicon.svg`).
- **Pakete:** `vite-plugin-pwa`.
- **Abnahme durch den Product Owner:** Brett auf dem S26 im Hochformat, auf iPad und PC in beiden Ausrichtungen (E-29); App unter Brave (S26) und Safari (iPad) zum Startbildschirm hinzufügen und starten; Start im Flugmodus.

### D-1 Farbwerte (OP-11)

- **Auftrag:** „Erledige Design D-1 aus docs/Umsetzungsplan.md.“ (Opus, medium)
- **Inhalt:** Claude Code schlägt Catan-Farben, Gruppenfarben-Palette und Akzentfarben mit Kontrastwerten für den Dunkelmodus vor und zeigt sie als Vorschau; der Product Owner wählt. Ergebnis in `tokens.css`; OP-11 wird in Anforderungsdokumentation und Architektur als geklärt vermerkt (Haltepunkt: Änderung der Anforderungsdokumentation, durch den Auftrag freigegeben).
- **Branch:** `chore/op-11-color-values`.
- **Ergebnis (#14):** Standarddesign „Holz“ mit Akzent Bernstein, kräftige Catan-Farben, gedeckte Gruppenfarben, 6 Akzentfarben; zusätzlich die Designs „Tiefsee“, „Wald“ und „Glas“ als Werte in `tokens.css` (Anforderungsdokumentation E-26, NFA-GB-03). Die Umschaltung über `data-theme` und `data-accent` kommt mit US-GB-01 „Design und Akzentfarbe wählen“ in I6; dabei „Glas“ auf älteren Geräten auf flüssige Darstellung prüfen.

### D-3 Startansicht und Navigation *(neu in 0.10)*

- **Auftrag:** „Erledige Design D-3 aus docs/Umsetzungsplan.md.“ (Opus, medium)
- **Reihenfolge:** nach I1-C und vor I1-E, damit die Detailansichten aus I1-E gleich in den neuen Rahmen kommen.
- **Inhalt:** Startansicht, Kopfzeile mit Hauptnavigation (`AppLayout`, Architektur 13.1) und Verwaltungsübersicht im Stil des Spielraums neu gestalten, für Handy, Tablet und PC in Hoch- und Querformat. Zuerst Designvorschläge als klickbare HTML-Datei (Richtlinien 2.5); sie zeigen auch, wo später „Neue Partie“ (I2), „Ergebnis eintragen“ (I3) und die Banner (I4, I5) ihren Platz finden. Gebaut wird nur, was es schon gibt; die Navigation nennt weiter nur vorhandene Bereiche (Architektur 13.1).
- **Nicht enthalten:** Funktionen späterer Inkremente, Umschalten von Design und Akzentfarbe (US-GB-01, I6), Animationen (Motion kommt mit dem ersten Bündel, das sie braucht).
- **Branch:** `feat/d-3-start-and-navigation`.
- **Pakete:** keine.
- **Abnahme durch den Product Owner:** Designvorschlag wählen; danach Startansicht, Kopfzeile und Verwaltung auf S26 (hochkant, quer nur Hinweis), iPad und PC; alle Bereiche erreichbar, Zurück-Taste auf dem S26.
- **Ergebnis:** In zwei Runden Designvorschlägen (`start-preview-v1.html`, `start-preview-v2.html`, Logos in `logo-preview-v1.html`) gewählt: Konzept E „Kartenhand“ – Hauptnavigation als Spielkarten am unteren Rand, Start mit Personen, Tische, Spiele als Kartenfächer direkt über der Hand und ohne Scrollen, Verwaltung als Kartenraster; „Neue Partie“ (I2) später als Nachziehstapel mit klassischem Kartenrücken über den Karten; Logo „Eine Kontur“ (Gehirn, linke Hälfte Schachbrett); Zurück führt zur vorherigen Seite; Smartphones nur im Hochformat (E-29); Texte ohne „Eure …“. Verbindliche Referenz ist `docs/design/d3-start-navigation-final-preview.html` (im Repository); Start und Verwaltung stimmen auf Handy, Tablet hoch und quer und PC pixelgenau mit ihr überein. Gebaut ist nur der Umfang „Jetzt in D-3 gebaut“; der Umfang „Mit späteren Funktionen“ zeigt, wo die Funktionen der weiteren Inkremente andocken (Kapitel 7).

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
| I4 Daten und Updates | Import mit Konflikten, Sicherungspunkte, Service Worker und Updates, Speicherschutz; Paket `valibot` (aus I1-B zurückgestellt) |
| I5 Erlebnis und Ausbau | Glücksrad mit Motion (nach D-2), Startrohstoffe (Zufall) |
| I6 Feinschliff | keine |

**Design-Referenz für Start und Navigation (D-3):** `docs/design/d3-start-navigation-final-preview.html`, Umfang „Mit späteren Funktionen“. Platz und Aussehen der folgenden Elemente sind dort festgelegt; das jeweilige Bündel baut sie genau so ein (Richtlinien 2.5):

| Inkrement | Element aus der Referenz |
|---|---|
| I2 | Nachziehstapel mit klassischem Kartenrücken und der Beschriftung „Partie“ direkt über den Karten, ohne Untertitel; Antippen führt in I2 direkt zur neuen Partie. Hinweis „‹Gruppe› spielt gerade – Weiter“ oben auf dem Start |
| I3 | Karte „Statistik“ in der Kartenhand. „Ergebnis eintragen“ vom Start (US-ER-01 AK-1): Antippen von „Partie“ dunkelt den Start ab und zeigt zwei Spielkarten – links vorne und in der Akzentfarbe „Ergebnis eintragen“ als Hauptaktion, rechts „Neue Partie“ (Variante K2 aus fünf Vorschlagsrunden, `result-entry-preview-v1.html` bis `result-entry-preview.html`; Begründung: viele werden die App ohne Catan nutzen) |
| I4 | Banner (Sicherung, Update, Speicher) oben auf dem Start, ohne die Karten zu verschieben; Karte „Daten“ in der Kartenhand |
| I5 | Vierte Karte „Archiv“ in der Verwaltung |
| I6 | Karte „Einstellungen“ mit Zahnrad in der Kartenhand; ab sechs Karten wird die Hand schmaler (`src/ui/components/cardHand.ts`). Mit der geplanten Einstellung „Ich hasse Catan!“ zeigt der Start statt „Partie“ nur die Zeile „Ergebnis eintragen“ (Anforderung folgt in einem eigenen Pull Request) |
