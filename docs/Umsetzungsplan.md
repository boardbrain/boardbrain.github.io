# BoardBrain – Umsetzungsplan

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Reihenfolge, Zuschnitt der Story-Bündel, Modellwahl und Ablauf der Sitzungen mit Claude Code |
| Version | 0.20 |
| Stand | 29.10.2026 |
| Grundlage | BoardBrain_Spezifikation.md v0.12 (2.2, 2.3, 2.5), Entwicklungsrichtlinien.md v0.5 (2, 14), BoardBrain_Anforderungsdokumentation.md v0.18 (9.3, 13, E-32), BoardBrain_Architektur.md v0.19 (19) |
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
| 0.12 | 09.10.2026 | Einstellung „Ich hasse Catan!“ (US-SP-05, Spezifikation 0.10) in I6 eingeplant (7) |
| 0.13 | 25.10.2026 | I1-E umgesetzt (#19): Personenliste als Spielkarten, Personenseite „Karte und Steckbrief“, Tischseite „Großer Tisch“; Design-Referenz `docs/design/i1e-persons-tables-final-preview.html`; Catan-Farben nur im Editor (5) |
| 0.14 | 26.10.2026 | I1-F umgesetzt (#20): Umbenennen an Ort und Stelle, Spielseite, Tisch bearbeiten wie „Neuer Tisch“ ohne Bank, kleine Pillen als Aktionen, Rückfrage bei ungespeicherten Änderungen; Design-Referenz `docs/design/i1f-edit-final-preview.html`; Personen- und Tischnamen app-weit eindeutig (E-31); US-VW-02 AK-7 mit I6 (2, 5) |
| 0.15 | 27.10.2026 | I1-D umgesetzt (#21), Inkrement I1 damit vollständig: Brett H1 unter `#/brett`, Gebäude G1 und Straßen R1 für I2 festgelegt, App-Symbol D8, Manifest und minimaler Service Worker, `docs/Abnahme-Checkliste.md`; Design-Referenz `docs/design/i1d-board-final-preview.html` (2, 5, 7) |
| 0.16 | 28.10.2026 | K-3 umgesetzt (#23): Kartenhand auf dem Handy nur auf dem Start aufgefächert, sonst eingefahren (Variante E2, Stil D5, 30 px); auf Tablet und PC unverändert; Design-Referenz `docs/design/k3-card-hand-final-preview.html`; Motion 14.2.0; offener Punkt „Einstellung für die Kartenhand“ bei I6 (7); neue Aufgabe K-4 „Berührungsverhalten app-weit“ als Nächstes vor I2 (2, 6) |
| 0.17 | 28.10.2026 | K-4 umgesetzt (#25): Druckzustand für alle Knöpfe und Links (Knöpfe K, Karten K1), kein Browsermenü, keine Linkvorschau und kein Markieren beim langen Drücken; Design-Referenz `docs/design/k4-touch-final-preview.html`; offener Punkt „Druckzustand weicher machen und Hover am PC“ bei I6 (2, 6, 7) |
| 0.18 | 29.10.2026 | Zuschnitt von I2 (E-32, Spezifikation 0.12): I2 als ganzer Block „Generierung“ mit Inszenierung, Startrohstoffen, abweichenden Farben und Überspringen der Platzierung; Bündel I2-A bis I2-F und Design D-2 (neu 8); I3 bis I6 grob nach Blöcken zugeschnitten, D-2 von vor I5 nach I2 (2, 7); Verweise auf die Kapitel der Bündel, reine Doku-Änderungen ohne lokale Prüfungen (4.1, 4.3; Entwicklungsrichtlinien 3.6) |
| 0.19 | 29.10.2026 | Bündel I2-A umgesetzt; Inhalt von I2-A und I2-B nach ADR-028 präzisiert: Brett, Platzierung, Rohstoffe und Schrittarten im Catan-Modul (8) (#27) |
| 0.20 | 29.10.2026 | Bündel I2-B umgesetzt: Ablaufsteuerung, Catan-Ablauf, gespeicherte Partie, `SessionService` und Sperre der Spielbindung; nach Wiederholung eines Drehs der Reihenfolge beginnt eine übersprungene Platzierung wieder (Entscheidung des Product Owners) (2, 8) (#28) |

## 1. Zweck

Dieses Dokument legt fest, **was als Nächstes kommt und wie**. Jede neue Sitzung mit Claude Code beginnt mit einem Auftrag, der auf diesen Plan verweist. Claude Code pflegt den Status im selben Pull Request, mit dem ein Bündel oder eine Aufgabe umgesetzt wird. Den Zuschnitt eines neuen Inkrements legt Claude Code dem Product Owner zu Beginn des Inkrements zur Freigabe vor (Spezifikation 2.3) und trägt ihn hier nach.

Rangfolge bei Widerspruch bleibt: Anforderungen > Spezifikation > Architektur > Richtlinien > dieser Plan.

## 2. Reihenfolge

| # | Schritt | Wann | Status |
|---|---|---|---|
| 0 | Kleine Aufgabe K-1: Dependabot-PR #3 (`@babel/core` 8) prüfen | als Erstes | erledigt: Empfehlung „mergen“ |
| 1 | Inkrement I1 Fundament: Bündel I1-A, I1-B, I1-C, I1-E, I1-F, I1-D (Kapitel 5) | danach, in dieser Reihenfolge | umgesetzt: I1-A (#11), I1-B (#12), I1-C (#15), I1-E (#19), I1-F (#20), I1-D (#21) |
| 2 | Design D-1: Farbwerte (OP-11) | parallel zu I1, spätestens vor der Abnahme von I1-C | erledigt (#14) |
| 2a | Design D-3: Startansicht und Navigation | nach I1-C, vor I1-E | umgesetzt (#17) |
| 2b | Kleine Aufgabe K-3: Kartenhand einfahren | nach I1, vor I2 | umgesetzt (#23) |
| 2c | Kleine Aufgabe K-4: Berührungsverhalten app-weit | direkt nach K-3, vor I2 | umgesetzt (#25) |
| 3 | Inkrement I2 Generierung: Bündel I2-A, I2-B, I2-C, I2-D, Design D-2, Bündel I2-E, I2-F (Kapitel 8) | nach I1, in dieser Reihenfolge | in Arbeit: I2-A (#27), I2-B (#28) |
| 4 | Entscheidung über Vorabversionen (OP-13) | nach I2 | offen |
| 5 | Inkrement I3 Ergebnisse und Statistik | nach I2 | offen |
| 6 | Inkrement I4 Daten und Updates | nach I3 | offen |
| 7 | Inkrement I5 Verwaltung und Archiv | nach I4 | offen |
| 8 | Inkrement I6 Einstellungen und Feinschliff | nach I5 | offen |
| 9 | Release 1.0 nach Richtlinien 3.8 mit manueller Abnahme (`docs/Abnahme-Checkliste.md`) | nach I6 | offen |

**Blöcke statt Stufen (E-32, seit 0.18):** Jedes Inkrement schließt einen fachlichen Block ganz ab, mit allen Must-, Should- und Could-Stories, die dazugehören (Spezifikation 2.2). Bis 0.17 kamen alle Should-Stories gesammelt in I5 und alle Could-Stories in I6; dann wäre zum Beispiel die Inszenierung erst nach Ergebnissen und Datensicherung gefolgt.

**Warum das Design nicht ganz vorn steht:** Der Code arbeitet mit Farbkennungen (etwa „rot“), die Farbwerte stehen nur in `src/ui/styles/tokens.css` und lassen sich jederzeit austauschen. OP-11 blockiert daher nichts. Das Design der Inszenierung (D-2, OP-06) folgt in I2, sobald der Ablauf einer Partie in der App läuft, damit Glücksrad und Aufblinken am echten Ablauf beurteilt werden können.

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

1. **Product Owner:** neue Sitzung in VS Code beginnen (bzw. `/clear`), Modell und Aufwand nach dem Kapitel des Inkrements (I1: 5, I2: 8) bzw. Kapitel 6 (kleine Aufgaben) einstellen, Auftrag senden:
   > Setze Bündel ‹ID› aus docs/Umsetzungsplan.md um.
2. **Claude Code:** liest diesen Plan, die genannten Stories und Kapitel. Antwortet mit einem **kurzen Umsetzungsplan**: Schritte, Tests je Abnahmekriterium, neue Pakete mit Version, Fragen zu Haltepunkten. Beginnt erst nach „los“.
   **Bei neuen oder geänderten Oberflächen** zeigt Claude Code danach zuerst Designvorschläge als lokale, klickbare HTML-Datei (Richtlinien 2.5) und baut erst nach der Wahl des Product Owners. *(neu in 0.8)*
3. **Claude Code:** Branch von aktuellem `develop` mit dem Namen aus dem Kapitel des Inkrements; umsetzen, testen, in Schritten committen; `npm run check`, `npm run test:e2e`, bei Zufall zusätzlich `npm run test:stat` (bei reinen Doku-Änderungen entfallen sie, Entwicklungsrichtlinien 3.6); Status in Kapitel 2 und im Kapitel des Inkrements auf „umgesetzt (#PR)“ setzen; Pull Request nach `develop` nach Vorlage.
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
| I1-E Personen und Gruppen im Überblick | US-VW-05 | Sonnet, medium | `feat/us-vw-05-persons-and-groups-overview` | umgesetzt (#19) |
| I1-F Bearbeiten | US-VW-06, US-VW-02, US-VW-07 | Sonnet, medium | `feat/us-vw-06-edit-master-data` | umgesetzt (#20) |
| I1-D Brett und Installation | US-PL-01 | Opus, high | `feat/us-pl-01-board-and-install` | umgesetzt (#21) |

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
- **Ergebnis (0.13):** In drei Runden Designvorschlägen (`persons-groups-preview-v1.html`, `persons-preview-v2.html`, `persons-preview.html`) gewählt:
  - **Personenliste L1 „Spielkarten“:** jede Person als Spielkarte mit Anzahl der Tische in den Ecken, Anfangsbuchstabe, ihren Farben an den Tischen als Punkte und den Tischnamen (US-VW-05 AK-1); erste Karte „+ Neue Person“, Lupe für die Suche nach Namen, „+“ öffnet das Formular.
  - **Personenseite D9 „Karte und Steckbrief“:** kleine Spielkarte, daneben Name, „dabei seit“ (Anlegedatum), Anzahl Tische und Mitspieler; darunter ihre Tische mit ihrer Farbe, ab 7 Tischen eingeklappt.
  - **Tischseite T7 „Großer Tisch“:** der runde Tisch aus dem Editor mit antippbaren Plätzen, Spielbindung, Anzahl, „angelegt am“ und die Mitglieder mit ihren Farben. Die Reiter „Ergebnisse“ und „Statistik“ kommen mit I3; bis dahin steht dort nur die Überschrift „Am Tisch“.
  - **Catan-Farben** erscheinen nur noch im Editor, nicht auf Personen- und Tischseiten (Entscheidung des Product Owners).
  - Verbindliche Referenz ist `docs/design/i1e-persons-tables-final-preview.html`; der Umfang „Mit späteren Funktionen“ zeigt, wo Bearbeiten (I1-F), Ergebnisse und Statistik (I3) sowie Archivieren und Löschen (I5) andocken.

### I1-F Bearbeiten *(neu in 0.8)*

- **Reihenfolge:** nach I1-E (die Detailansichten sind der Ort zum Bearbeiten) und vor I1-D.
- **Inhalt:** Person umbenennen mit Prüfung gleichnamiger Mitglieder in ihren Gruppen (US-VW-06); Gruppe bearbeiten: Name, Farben, Bindung einschließlich „Catan ausschließen“, Mitglieder unveränderlich (US-VW-02); eigenes Spiel umbenennen mit eindeutigem Namen, Catan nicht umbenennbar (US-VW-07).
- **Warum vorgezogen:** Wunsch des Product Owners (Spezifikation 0.8). Tippfehler oder eine falsche Bindung sollen vor dem ersten Spieleabend mit I2 korrigierbar sein. Archivieren und Löschen bleiben in I5, weil sie Partien (I3) und Sicherungspunkte (I4) brauchen.
- **Hinweis:** US-VW-02 AK-3 (bestehende Partien) wird mit I3 nachgewiesen, AK-5 (laufende Partie) mit I2; US-VW-06 AK-1 für Ergebnisse und Statistiken mit I3. US-VW-02 AK-7 („Ich hasse Catan!“) wird mit US-SP-05 in I6 nachgewiesen, weil es die Einstellung erst dann gibt. *(ergänzt in 0.14)*
- **Pakete:** keine.
- **Abnahme durch den Product Owner:** Person, Gruppe und eigenes Spiel umbenennen; Farbe und Bindung einer Gruppe ändern, Catan ausschließen und wieder zulassen; Konflikte (gleichnamige Person in einer Gruppe, doppelter Spielname, 5 Mitglieder an Catan) werden verhindert.
- **Ergebnis der Designrunden (0.14):**
  - **Aktionen:** auf Personen-, Tisch- und Spielseite gleich als kleine Pillen unter den Angaben („✎ Umbenennen“, „✎ Bearbeiten“); Archivieren und Löschen kommen in I5 als Pillen daneben.
  - **Umbenennen** von Person und eigenem Spiel an Ort und Stelle: Feld und „Abbrechen | Speichern“ ersetzen das Profil neben der Karte, darunter verschiebt sich nichts. Geprüft wird schon beim Tippen, bei Person, Spiel und Tisch gleich: Fehler erscheinen sofort und sperren „Speichern“. Personen- und Tischnamen sind app-weit eindeutig, auch beim Anlegen (E-31, Anforderungsdokumentation 0.17, Spezifikation 0.11; Entscheidungen des Product Owners).
  - **Spielseite** `#/verwaltung/spiele/‹id›` für eigene Spiele; Catan ist „fest eingebaut“ und hat keine.
  - **Tisch bearbeiten** wie „Neuer Tisch“, ohne Bank, unter einer eigenen Adresse.
  - **Rückfrage** „Änderungen verwerfen?“ beim Verlassen mit ungespeicherten Änderungen.
  - Verbindliche Referenz ist `docs/design/i1f-edit-final-preview.html`.

### I1-D Brett und Installation

- **Inhalt:** Brettmodell in `core/board` mit 19 Feldern, Kreuzungen, Kanten und Nachbarschaften (Architektur 5.2) als Grundlage für die Platzierung in I2; Darstellung des Bretts (US-PL-01); Manifest und minimaler Service Worker mit `vite-plugin-pwa` (`injectManifest`), damit die Installation unter Brave für Android früh geprüft wird (Architektur 11, 12.1, 18.1, 19); `docs/Abnahme-Checkliste.md` anlegen (Architektur 14.6).
- **Hinweis (0.11):** Die App-Symbole für Manifest und Startbildschirm entstehen aus dem Logo von D-3 (`src/ui/components/Logo.tsx`, `public/favicon.svg`).
- **Pakete:** `vite-plugin-pwa` 2.0.0 (nur Entwicklung; bringt `workbox-build` für den Build mit, nichts davon landet in der App). Die App-Symbole erzeugt ein eigenes Skript mit dem vorhandenen Playwright (`npm run icons`), kein weiteres Paket.
- **Abnahme durch den Product Owner:** Brett auf dem S26 im Hochformat, auf iPad und PC in beiden Ausrichtungen (E-29); App unter Brave (S26) und Safari (iPad) zum Startbildschirm hinzufügen und starten; Start im Flugmodus. Genau: Punkte K-1 bis K-6 aus `docs/Abnahme-Checkliste.md` über `npm run preview` (der Entwicklungsserver hat keinen Service Worker).
- **Ergebnis (0.15):** In fünf Runden Designvorschlägen für das Brett (`board-preview-v1.html` bis `board-preview.html`) und zwei für das Symbol (`icon-preview-v1.html`, `icon-preview.html`) gewählt:
  - **Brett H1:** sechseckiges Meer ohne Holzrahmen und ohne Kasten, Holzfelder mit weichem Schatten, Sandküste und flaches Wasser, Wellenmuster; eigene Grafik ohne Landschaften und Zahlen (AK-2, NFA-GB-06). Die Seite `#/brett` ist nur über die Adresse und den Verweis „Brett ansehen“ in der Diagnose erreichbar und entfällt, sobald I2 das Brett in der Platzierung zeigt.
  - **Gebäude G1 und Straßen R1** mit dunkler Kontur für I2 (US-PL-04): Siedlung als Haus, Stadt als Haus mit Turm, Straße als abgerundeter Balken; geprüft auch mit Gebäuden direkt am Ufer für den geparkten Modus PP-01.
  - **App-Symbol D8 „Zwei Karten“:** zwei gefächerte Karten, vorne eine Karte der App mit Logo; für Android in die sichere Mitte gerückt.
  - **Service Worker** zunächst nur zum Speichern und Ausliefern ohne Netz; eine neue Version wird wie üblich aktiv, wenn alle Fenster der App geschlossen waren. Der kontrollierte Wechsel mit Bestätigung (ADR-015) folgt mit I4 (Entscheidung des Product Owners).
  - **Diagnose in der installierten App:** Weil installierte Apps keine Adressleiste haben, führt ein unauffälliger Verweis „Diagnose“ unten rechts in der Verwaltung zur Diagnose, ohne die Karten zu verschieben; ab I6 über zehnmaliges Tippen auf die Versionsnummer in den Einstellungen (Kapitel 7, Entscheidung des Product Owners).
  - **Rahmen aus der Abnahme auf Geräten:** Höhe ohne `100dvh` (die Seite war nach dem Herunterziehen verschiebbar, Herunterziehen zum Aktualisieren entfällt), volle Bildschirmhöhe in der installierten App unter iPadOS, Kartenhand ohne harten Schnitt über dem Inhalt (Variante N1 aus `nav-preview.html`) und Wellen ohne Nähte (Architektur 13.1). Ein einfahrender Kartenstapel auf Unterseiten ist als eigener PR vorgemerkt (umgesetzt als K-3, Kapitel 6).
  - Verbindliche Referenz ist `docs/design/i1d-board-final-preview.html`.

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
| K-3 | Kartenhand einfahren: Auf dem Handy fährt die Hand auf allen Seiten außer dem Start in einen flachen Bogen ein und zeigt nur die Symbole; auf Tablet und PC (ab 600 px Breite) bleibt sie überall aufgefächert (Entscheidung des Product Owners nach der Abnahme in der installierten App); Antippen führt direkt in den Bereich, langes Drücken fächert sie mit Namen auf. In fünf Runden Designvorschlägen (`hand-stack-preview.html`) gewählt: E2 „nur Start groß“, Stil D5 „Halten zeigt Namen“, flacher Bogen aus D2, 30 px, sofort eingefahren. Erstes Bündel mit Motion (14.2.0). Verbindliche Referenz `docs/design/k3-card-hand-final-preview.html`; Abnahme auf Geräten mit Punkt K-15 der Abnahme-Checkliste | Opus, medium | umgesetzt (#23), vom Product Owner in der installierten App abgenommen |
| K-4 | Berührungsverhalten app-weit (Wunsch des Product Owners bei der Abnahme von K-3): keine blaue Tipp-Markierung, kein Browsermenü, keine Linkvorschau und kein Markieren beim langen Drücken, außer in Textfeldern; der Rechtsklick am PC bleibt. Als Ersatz ein eigener Druckzustand für alle Knöpfe und Links (NFA-GB-04) über die neuen Bausteine `PressableButton` und `PressableLink`. In drei Runden Designvorschlägen (`touch-preview.html`, Varianten A bis K4) gewählt: Knöpfe, Pillen und Zeilen schimmern schnell in ihrer Textfarbe (K), Karten und Plätze am Tisch heben sich weich und werden dunkler (K1), ohne Verzögerung; der Seitenwechsel bleibt sofort. Verbindliche Referenz `docs/design/k4-touch-final-preview.html`; Abnahme auf Geräten mit Punkt K-16 der Abnahme-Checkliste | Opus, medium | umgesetzt (#25), vom Product Owner in der installierten App abgenommen |

Dependabot öffnet monatlich weitere Pull Requests nach `develop`. Für jeden gilt der Auftrag „Prüfe Dependabot-PR #‹Nummer›“ (Sonnet, medium); Hauptversionssprünge prüft Claude Code wie K-1.

## 7. Weitere Inkremente

Die Stories je Inkrement stehen in Spezifikation 2.5. Die Inkremente sind nach fachlichen Blöcken grob zugeschnitten (E-32, seit 0.18); den genauen Zuschnitt in Bündel legt Claude Code zu Beginn des jeweiligen Inkrements vor (4.3). I2 steht in Kapitel 8. Vorgaben schon jetzt:

| Inkrement | Block | Stories | Kritische Teile (Opus, high) |
|---|---|---|---|
| I2 Generierung | gesamter Ablauf einer Partie mit Inszenierung | siehe Kapitel 8 | Platzierung und Sackgassen (Architektur 5.3, 5.4), Ablauf und Wiederaufnahme der laufenden Partie, Glücksrad mit Motion, Startrohstoffe (Zufall) |
| I3 Ergebnisse und Statistik | Ergebnisse erfassen und ansehen, Statistik | US-ER-01, -04, -05, US-ST-01, -02 (M); US-ER-02, US-ST-03, -04 (S); US-ER-03 (C) | keine; Kennzahlen mit Eigenschaftstests |
| I4 Daten und Updates | Export, Import, Sicherungspunkte, Updates, Installation, Speicherschutz | US-EI-01, -03 bis -06, US-DS-01, -02, US-UP-01, -02, US-IS-01, -03 (M); US-EI-02, -07, US-DS-04, US-IS-02 (S); US-DS-03 (C) | Import mit Konflikten, Sicherungspunkte, Service Worker und Updates, Speicherschutz; Paket `valibot` (aus I1-B zurückgestellt) |
| I5 Verwaltung und Archiv | Archivieren, Wiederbeleben, Löschen; Spieleliste getrennt | US-VW-01, -03, -04, US-SP-03 (S) | Löschen mit Sicherungspunkt „Vor Löschen“ (Datenbank) |
| I6 Einstellungen und Feinschliff | Einstellungen, offene Punkte aus K-3 und K-4 | US-SP-05 (M); US-GB-01 (C) | keine |

Archivieren und Löschen (I5) brauchen Partien (I3) und Sicherungspunkte (I4); „Ich hasse Catan!“ (I6) blendet Catan in allen Ansichten aus und kommt deshalb, wenn alle Ansichten stehen.

**Design-Referenz für Start und Navigation (D-3):** `docs/design/d3-start-navigation-final-preview.html`, Umfang „Mit späteren Funktionen“. Platz und Aussehen der folgenden Elemente sind dort festgelegt; das jeweilige Bündel baut sie genau so ein (Richtlinien 2.5):

| Inkrement | Element aus der Referenz |
|---|---|
| I2 | Nachziehstapel mit klassischem Kartenrücken und der Beschriftung „Partie“ direkt über den Karten, ohne Untertitel; Antippen führt in I2 direkt zur neuen Partie. Hinweis „‹Gruppe› spielt gerade – Weiter“ oben auf dem Start. Karte „Einstellungen“ mit Zahnrad in der Kartenhand, mit I2-F zunächst nur mit dem Tonschalter (US-IN-03 AK-2) *(ergänzt in 0.18)* |
| I3 | Karte „Statistik“ in der Kartenhand. „Ergebnis eintragen“ vom Start (US-ER-01 AK-1): Antippen von „Partie“ dunkelt den Start ab und zeigt zwei Spielkarten – links vorne und in der Akzentfarbe „Ergebnis eintragen“ als Hauptaktion, rechts „Neue Partie“ (Variante K2 aus fünf Vorschlagsrunden, `result-entry-preview-v1.html` bis `result-entry-preview.html`; Begründung: viele werden die App ohne Catan nutzen) |
| I4 | Banner (Sicherung, Update, Speicher) oben auf dem Start, ohne die Karten zu verschieben; Karte „Daten“ in der Kartenhand |
| I5 | Vierte Karte „Archiv“ in der Verwaltung |
| I6 | Die Einstellungen (Karte seit I2-F) erhalten Design, Akzentfarbe und „Ich hasse Catan!“ *(geändert in 0.18)*; zehnmaliges schnelles Tippen auf die Versionsnummer in den Einstellungen öffnet die Diagnose, der Verweis „Diagnose“ unten in der Verwaltung (seit I1-D) entfällt dann *(ergänzt in 0.15)*; ab sechs Karten wird die Hand schmaler (`src/ui/components/cardHand.ts`). **Offener Punkt aus K-4 (mit dem Product Owner abstimmen):** Druckzustand weicher machen, wenn alle Seiten stehen: Fassungen K1 bis K4 und die Verzögerung des Druckzustands (0 bis 120 ms) aus `touch-preview.html`, dazu ein Übergang beim Seitenwechsel statt einer künstlichen Verzögerung; zusammen mit dem Hover-Effekt am PC (NFA-GB-04, „Could“). Der Seitenwechsel bleibt sofort. Einstellung „Ich hasse Catan!“ (US-SP-05, Must): Einschalten mit Warnung und Bestätigung; danach zeigt der Start statt „Partie“ nur die Zeile „Ergebnis eintragen“ (Referenz, Schalter „Einstellung“), und alle übrigen bis dahin gebauten Ansichten blenden Catan aus. **Offener Punkt aus K-3 (vor der Umsetzung mit dem Product Owner klären):** Soll es eine Einstellung für die Kartenhand geben (Variante E4 aus `hand-stack-preview.html`), etwa „auf Start und Verwaltung groß“ gegenüber „überall klein“? Eine solche Einstellung wäre eine neue Anforderung und ändert Anforderungsdokumentation und Spezifikation (Haltepunkt) |

**Design-Referenz für Brett, Gebäude und Straßen (I1-D):** `docs/design/i1d-board-final-preview.html`, Umfang „Mit späteren Funktionen“. I2 zeigt die Platzierung auf dem Brett H1 mit Gebäuden G1 und Straßen R1 in den Catan-Farben mit dunkler Kontur, genau wie dort; die Prüfseite `#/brett` und ihr Verweis in der Diagnose entfallen dann. Der Aufbau der Platzierungsseite (Kopfzeile, Schrittanzeige, „Weiter“) ist dort nur angedeutet und wird in I2 gestaltet. *(neu in 0.15)*

## 8. Inkrement I2 Generierung *(neu in 0.18)*

Ergebnis: Die Generierung ist vollständig, wie sie in Version 1 sein soll, und am Spieleabend nutzbar (Spezifikation 2.3). Als ganzer Block nach E-32 umfasst I2 alle Stories zum Ablauf einer Partie, auch Inszenierung, Startrohstoffe, abweichende Farben einer Partie und das Überspringen der Platzierung. Neue Pakete sind nur die hier genannten; ihre genaue Version prüft Claude Code zu Beginn des Bündels und nennt sie im Umsetzungsplan. Jedes andere Paket ist ein Haltepunkt.

| Bündel | Stories | Modell, Aufwand | Branch | Status |
|---|---|---|---|---|
| I2-A Platzierung, Reihenfolge, Startrohstoffe | US-PL-02, US-PL-03, US-LS-03, US-SR-01 (Fachlogik) | Opus, high | `feat/us-pl-02-placement-and-dead-ends` | umgesetzt (#27) |
| I2-B Generierung und gespeicherte Partie | US-AB-03, US-AB-05, US-AB-06, US-LS-02, US-PG-04, US-PL-05 (Fachlogik und Dienst), US-VW-02 AK-5 | Opus, high | `feat/us-ab-03-generation-session` | umgesetzt (#28) |
| I2-C Neue Partie vorbereiten und durchlaufen | US-SP-01, US-SP-04, US-AB-01, US-AB-02, US-LS-02, US-LS-03, US-PL-04, US-PG-04, US-SR-01, US-PL-05 (Oberfläche) | Sonnet, medium | `feat/us-ab-01-new-match` | offen |
| I2-D Laufende Partie: wiederholen, einsehen, fortsetzen | US-AB-03, US-AB-04, US-AB-05, US-AB-06 (Oberfläche) | Opus, high | `feat/us-ab-04-running-match` | offen |
| D-2 Design der Inszenierung (OP-06) | Glücksrad, Aufblinken, Tempo, Klänge | Opus, medium | `chore/op-06-staging-design` | offen |
| I2-E Glücksrad und Überspringen | US-IN-01, US-IN-04 | Opus, high | `feat/us-in-01-wheel` | offen |
| I2-F Aufblinken und Klänge | US-IN-02, US-IN-03 | Sonnet, medium | `feat/us-in-02-highlight-and-sound` | offen |

**Warum diese Reihenfolge:** Erst die Fachlogik ohne Oberfläche (A, B), weil dort die strengsten Prüfkriterien gelten (Zufall, Sackgassen, erst speichern, dann zeigen). Dann der Ablauf in der App (C, D), sodass am Spieleabend schon gespielt werden kann. D-2 folgt, wenn der Ablauf läuft, damit Rad und Aufblinken am echten Ablauf beurteilt werden. Die Inszenierung (E, F) ersetzt dann nur Bausteine der Oberfläche; Fachlogik und Datenbank bleiben unverändert, weil jede Animation ihr Ergebnis fertig erhält (Architektur 13.6).

### I2-A Platzierung, Reihenfolge, Startrohstoffe

- **Inhalt:** im Catan-Modul (ADR-028): Platzierungsregeln als Bausteine (Inlandkreuzung, Abstandsregel; Architektur 5.3); Strategie „bei Sackgasse verdeckt neu losen“ (`RetryOnDeadEnd`, 5.4, ADR-010); Straße gleichverteilt aus den an das neue Gebäude angrenzenden Kanten; Startrohstoffe mit und ohne Zurücklegen (5.6). In `core/draws` die Platzierungsreihenfolge in n−1 Drehs, weil sie Personen betrifft. *(präzisiert in 0.19)*
- **Nicht enthalten:** Oberfläche.
- **Nachweis:** Eigenschaftstests mit festem Startwert; exaktes Durchzählen je Ziehung (Architektur 14.3); statistische Suite: alle n! Reihenfolgen für n = 2 bis 4 gleich häufig, Gleichverteilung je Gebäude-, Straßen- und Rohstoffziehung; die Zahl der Versuche bei 4 Personen wird gemessen und dokumentiert (NFA-EW-08).
- **Pakete:** keine.
- **Abnahme durch den Product Owner:** Pull Request lesen (Tabelle Abnahmekriterium → Test), Prüfung `stat` bzw. lokale Ausgabe von `npm run test:stat` ansehen.

### I2-B Generierung und gespeicherte Partie

- **Inhalt:** Schritte und spielunabhängige Ablaufsteuerung in `core/generation` (Architektur 5.5), die Catan-Schrittarten im Catan-Modul (ADR-028, *ergänzt in 0.19*); der Catan-Ablauf aus Spezifikation 3.1 im Catan-Modul mit Spielversionen, Modus, `nextStep`, `invalidatedBy` und `summary`, einschließlich Startrohstoffen und übersprungener Platzierung; Farben der Partie mit Tausch (US-PG-04). `SessionService`: vorbereiten, starten, Schritt ausführen, bestätigen, wiederholen, beenden ohne Ergebnis; erst speichern, dann zeigen (ADR-014, 10.1). Die Sitzung liegt in der vorhandenen Tabelle `session`, eine Migration ist nicht nötig. Der `MasterDataService` sperrt die Spielbindung der beteiligten Gruppe (US-VW-02 AK-5, 10.4).
- **Nicht enthalten:** Oberfläche.
- **Nachweis:** Unit-Tests je Zeile der Abhängigkeitstabelle in Spezifikation 3.1 und für die Zahl der Schritte (Beispiel mit 26 Schritten); Dienst-Tests gegen die Testdatenbank: Neustart nach „aufgedeckt“ und nach „bestätigt“ ergibt denselben Stand, die Sperre greift im Dienst.
- **Pakete:** keine.
- **Abnahme durch den Product Owner:** Pull Request lesen (Tabelle Abnahmekriterium → Test).

### I2-C Neue Partie vorbereiten und durchlaufen

- **Design zuerst:** eine Runde Designvorschläge für alle Ansichten einer Partie, damit sie zusammenpassen: Nachziehstapel „Partie“ auf dem Start (Referenz D-3), Spielauswahl, Vorbereitung (Gruppe, Spielversion, Losschritte, Startrohstoffe, Farben der Partie), Losschritt als Satz, Reihenfolge mit Startperson, Platzierung auf dem Brett H1 mit Gebäuden G1 und Straßen R1, „Platzierung überspringen“, Startrohstoffe mit Symbol und Namen, „Weiter“ und „Wiederholen“, Warnung beim Wiederholen, Übersicht der laufenden Partie. Verbindliche Referenz wird `docs/design/i2-match-final-preview.html`; I2-D baut danach ohne weitere Runde. Glücksrad und Aufblinken sind dort nur Platzhalter, sie gestaltet D-2.
- **Inhalt:** Spielauswahl (nur Catan, US-SP-01), Vorbereitung (US-AB-01, US-SP-04, US-PG-04), alle Schritte nacheinander mit „Weiter“ (US-AB-02) und schlichtem Einblenden über Motion, Darstellung von Gebäuden und Straßen (US-PL-04), „Partie beenden ohne Ergebnis“, damit eine Testpartie nicht hängen bleibt.
- **Nachweis:** Ende-zu-Ende-Test einer vollständigen Generierung mit 2, 3 und 4 Personen in beiden Spielversionen, mit Startrohstoffen und mit übersprungener Platzierung.
- **Pakete:** `zustand` (Architektur 3.1) für die Vorbereitung, falls sie über mehrere Adressen geht.
- **Abnahme durch den Product Owner:** Designvorschlag wählen; danach Partien mit 3 und 4 Personen auf S26, iPad und PC durchlaufen; Punkt K-7 der Abnahme-Checkliste.

### I2-D Laufende Partie: wiederholen, einsehen, fortsetzen

- **Inhalt:** jeden Schritt wiederholen, mit Warnung, die die verworfenen Schritte nennt (US-AB-03); Übersicht der laufenden Partie (US-AB-04); Hinweis „‹Gruppe› spielt gerade – Weiter“ auf dem Start und Rückkehr mit einem Tipp; Rückfrage, wenn trotz laufender Partie eine neue beginnen soll (US-AB-05 AK-2); nach einem Neustart während einer Animation wird sie erneut abgespielt (AK-3); Meldung bei gesperrter Spielbindung mit dem Angebot, die Partie zu beenden (Spezifikation 3.5). Die Prüfseite `#/brett` und ihr Verweis in der Diagnose entfallen.
- **Nachweis:** Ende-zu-Ende-Tests mit Wiederholungen und mit Neuladen während und nach einem Schritt (Architektur 14.5).
- **Pakete:** keine.
- **Abnahme durch den Product Owner:** Losschritt, Dreh der Reihenfolge, Gebäude und Straße wiederholen; App während eines Schritts schließen und wieder öffnen; Punkte K-7 und K-8.

### D-2 Design der Inszenierung (OP-06)

- **Auftrag:** „Erledige Design D-2 aus docs/Umsetzungsplan.md.“ (Opus, medium)
- **Inhalt:** Vorschläge für Glücksrad (Segmente mit Name und Catan-Farbe, Drehen und Anhalten), Aufblinken von Kreuzungen und Kanten, Tempo und Klänge als klickbare Vorschau im Stil der Referenz aus I2-C. Ergebnis ist die Referenz `docs/design/d2-staging-final-preview.html`; OP-06 wird in Anforderungsdokumentation und Architektur als geklärt vermerkt. Zu klären ist dabei, woher die Klänge kommen (im Browser über Web Audio erzeugt oder als Dateien); fremde Klangdateien oder eine Bibliothek wären ein Haltepunkt.
- **Pakete:** keine.

### I2-E Glücksrad und Überspringen

- **Inhalt:** Glücksrad für LS-01, LS-03, LS-04 und jeden Dreh der Reihenfolge mit Motion (Architektur 13.6); der Zielwinkel ergibt sich aus dem gelosten und gespeicherten Ergebnis (US-IN-01 AK-2); Knopf „Animation überspringen“ (US-IN-04).
- **Nachweis:** Unit-Tests für die Winkelberechnung; Ende-zu-Ende-Tests: Das Rad hält bei der gelosten Person, Überspringen zeigt sofort das Ergebnis, Tippen daneben ändert nichts.
- **Pakete:** keine.
- **Abnahme durch den Product Owner:** Rad auf S26, iPad und PC; flüssig, auch beim Neustart während des Drehens.

### I2-F Aufblinken und Klänge

- **Inhalt:** Aufblinken gültiger Kreuzungen und angrenzender Kanten vor der Festlegung, dekorativ gelost über dieselbe `RandomSource` (Architektur 13.6); Klänge über Web Audio mit Audio-Session „ambient“ (12.3, ADR-017); Tonschalter in einer ersten Einstellungsseite mit der Karte „Einstellungen“ (`SettingsService`, Kapitel 7); keine Vibration.
- **Nachweis:** Unit-Tests, dass nur gültige Kreuzungen bzw. angrenzende Kanten aufblinken; Ende-zu-Ende-Test für den Tonschalter (bleibt nach Neuladen erhalten).
- **Pakete:** keine.
- **Abnahme durch den Product Owner:** Aufblinken bei einer ganzen Platzierung; Punkt K-13 der Abnahme-Checkliste.

### Hinweise

- **„Ergebnis eintragen“** aus der Übersicht (US-AB-06 AK-1 und AK-2) wird mit US-ER-01 in I3 nachgewiesen, weil das Ergebnisformular zum Block „Ergebnisse“ gehört. In I2 endet eine Partie mit „Partie beenden ohne Ergebnis“, und der Stapel „Partie“ führt direkt zur neuen Partie; die Wahl zwischen „Ergebnis eintragen“ und „Neue Partie“ (Variante K2, Kapitel 7) kommt mit I3.
- **US-VW-02 AK-5** aus I1-F wird hier nachgewiesen: im Dienst mit I2-B, die Meldung in der Oberfläche mit I2-D.
- **Animationen bis I2-E:** In I2-C und I2-D erscheinen Ergebnisse mit schlichtem Einblenden; damit sind US-AB-02 AK-2 (eigene Animation je Schritt) und US-AB-05 AK-3 (erneutes Abspielen) schon nachweisbar. I2-E und I2-F ersetzen das Einblenden durch Rad und Aufblinken.
