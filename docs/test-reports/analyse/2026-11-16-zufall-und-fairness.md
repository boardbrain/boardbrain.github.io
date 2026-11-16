# Prüfung von Zufall und Fairness 16.11.2026

| | |
|---|---|
| Datum | 16.11.2026 |
| Commit-Stand | `63e502c` auf `docs/code-and-randomness-analysis` (= `develop` `994fdc9` plus Bericht der Code-Prüfung), Arbeitsordner sauber |
| Modell | Claude Fable 5.2 (`claude-fable-5-2`) |
| Umfang | alles, was Zufall erzeugt oder verwendet: `infra/random`, `core/random`, `core/draws`, `games/catan` (Platzierung, Sackgassen, Reihenfolge, Startrohstoffe), Inszenierung in `src/ui`, `tests/statistical` |
| Maßstab | Anforderungsdokumentation 5.4 bis 5.7, 6.2 bis 6.4, 7.1 (FA-LS, FA-PL, FA-SR, FA-IN, NFA-ZF), Spezifikation 3.2 und die Stories LS, PL, SR, IN |
| Vorgänger | `2026-11-16-code-pruefung.md`; dort genannte Funde werden hier nicht wiederholt, die Verdachtsfälle aus deren Kapitel 6 sind in Kapitel 6 dieses Berichts beantwortet |
| Status | abgeschlossen |

## 1. Kurzfassung

- **Kein kritischer, hoher oder mittlerer Fund.** Ich habe keine Stelle gefunden, an der eine Ziehung in relevanter Größe verzerrt ist, und keine, an der die Inszenierung vor der Landung etwas verrät.
- **Zufallsquelle und Umrechnung sind exakt fair.** Die Umrechnung verwirft überzählige Werte, statt sie mit Modulo umzurechnen; das ist durch vollständiges Durchzählen bewiesen (`uniform.test.ts:28-54`).
- **Person, Reihenfolge, Straße, Startrohstoffe: fair**, bei 2 und 3 Personen auch jedes Gebäude exakt.
- **Gebäude bei 4 Personen: fair mit Einschränkung.** Die Sackgassenquote lässt sich exakt ausrechnen: genau **1/4096 = 0,0244 %**. Es gibt nur eine einzige Sackgassen-Stellung (die sechs Kreuzungen aus Anforderung 6.2.4). Das verdeckte Neulosen verschiebt die Wahrscheinlichkeit des ersten Gebäudes um höchstens 0,073 % (relativ). In 1 von 1.365 Vierer-Platzierungen kann beim sechsten Gebäude eine gültige Kreuzung nicht gelost werden, wird beim Aufblinken aber als möglich gezeigt (Funde G-1, G-2). Die Sätze „jede einzelne Ziehung bleibt (exakt) gleichverteilt“ in Anforderungen, Spezifikation, Architektur und `sackgassen.md` stimmen damit nicht ganz.
- **„Zufällig“ heißt fachlich: jede im Moment gültige Kreuzung gleich wahrscheinlich.** Es heißt nicht, dass jedes fertige Brett gleich wahrscheinlich ist: Bei 4 Personen ist das wahrscheinlichste Endbild 28-mal so wahrscheinlich wie das unwahrscheinlichste, und äußere Kreuzungen werden häufiger belegt als innere (Kapitel 4.2). Das entspricht der Anforderung 6.2.3, sollte dem Product Owner aber bewusst sein.
- **Inszenierung verrät nichts.** Bei gleichem Startwert und anderem Ergebnis sind Lauflicht, Zeiten und Kartenbewegungen bis zur Landung in allen geprüften Fällen identisch (20.000 bzw. 5.000 Startwerte). Die vorhandenen Tests würden aber genau die früher gefundene Lücke („Station vor der Landung“) nur teilweise bemerken (G-4).
- **Statistische Suite: taugt für grobe Fehler, nicht für feine.** Sie findet Abweichungen ab etwa 1,5 % (2 Optionen) bis 10 % (24 Optionen) je Option sicher; eine Modulo-Verzerrung mit 32-Bit-Werten (Größe 10⁻⁹) kann kein statistischer Test finden, dafür gibt es den exakten Nachweis. Fehlalarm: In 2,5 % der Läufe braucht ein Test die Wiederholung (in meinem ersten Lauf passiert), in 0,0025 % der Läufe scheitert die Suite zu Unrecht. Lücken: Der Planer und der ganze Ablauf werden nicht statistisch geprüft, die Sackgassen-Messung prüft nichts (G-3).
- **Regeln eingehalten:** kein `Math.random`, `crypto.getRandomValues` nur in `infra/random`, echter Zufall in Tests nur in `tests/statistical`.
- **7 Funde gering**, 2 Beobachtungen, dazu weitere Auffälligkeiten (Kapitel 9).

**Was „Verdacht“ heißt:** am Code begründet, aber nicht im laufenden Programm nachgestellt. Alles andere ist am Code belegt und, wo Zahlen stehen, gerechnet oder simuliert.

## 2. Was geprüft wurde und wie

| Bereich | Tiefe |
|---|---|
| `src/infra/random`, `src/core/random`, `src/core/draws` | vollständig gelesen, Tests gelesen |
| `src/games/catan/placement` (Regeln, Planer, Straße, Schlangenreihenfolge, Plätze), `startingResources.ts`, `generation/definition.ts`, `steps.ts` | vollständig gelesen |
| `src/core/generation/flow.ts`, `types.ts`, `src/app/services/sessionService.ts` | vollständig gelesen (Wiederholen, erst speichern, dann zeigen) |
| Inszenierung: `highlightPlan.ts`, `playHighlight.ts`, `PlacementHighlight.tsx`, `tensionMode.ts`, `stagePlan.ts`, `StagedCards.tsx`, `DrawScene.tsx`, `OrderScene.tsx` (Teil), `MatchView.tsx` (Teil), `PlacementStep.tsx` (Teil) | gelesen; `playStage.ts`, `ResourcesScene.tsx`, CSS nicht |
| `tests/statistical`, `tests/support` (Chi-Quadrat, Testquellen), `tests/e2e/seededRandom.ts`, `highlightPlan.test.ts`, `uniform.test.ts` (Teil) | gelesen; übrige Tests nur nach Namen |
| Regeln | Suche über `src`, `tests`, `scripts`, Konfiguration; `eslint.config.js` nur die Regeln zu Zufall |

**Eigene Experimente** (alle in einem Wegwerfordner außerhalb des Repositorys, mit dem echten Code des Repositorys gebündelt; am Projekt wurde nichts geändert):

1. **Exakte Rechnung der Platzierung.** Alle Belegungen des Bretts, die ein Durchlauf erreichen kann, werden durchgezählt (bei 8 Gebäuden rund 50.000 Zustände). Daraus folgen ohne Zufall: Sackgassenquote, Wahrscheinlichkeit jedes gezeigten Gebäudes, Abweichung von der Gleichverteilung, ungünstigster Fall für die Obergrenze des Planers. Das Brettmodell der Rechnung wurde an 3.000 Zuständen gegen `validVertices` abgeglichen.
2. **Ganze Generierungen** durch den echten Ablauf (`drawNextStep`, `confirmStep`, `repeatStep` mit `CATAN_GENERATION`) und `CryptoRandomSource`: je 200.000 Partien mit 4 und mit 3 Personen, danach in jeder Partie ein zufälliges Gebäude wiederholt.
3. **Inszenierung:** je 600.000 Pläne für Lauflicht und Spannungsmodus mit `CryptoRandomSource`; dazu 20.000 Startwerte mit `SeededRandomSource`, jeweils für zwei verschiedene Ergebnisse geplant und verglichen.
4. **Trennschärfe der Suite:** gerechnet mit der nichtzentralen Chi-Quadrat-Verteilung; kritische Werte der Tabelle nachgerechnet.
5. **Fehlalarme:** sieben Tests der Suite je 1.000-mal wiederholt (je 100 Millionen Ziehungen), zwei davon noch einmal mit 300 Millionen; die Suite selbst sechsmal ausgeführt.

## 3. Lauf der statistischen Suite

`npm run test:stat`, sechs Läufe am 16.11.2026:

| Lauf | Ergebnis | Dauer | Sackgassen Basisspiel / Städte & Ritter (je 100.000) |
|---|---|---|---|
| 1 | 27 von 27 bestanden; „US-PL-03 AK-1: each of the three edges …“ erst in der Wiederholung (`retry x1`) | 10,8 s | 31 / 20 |
| 2 | 27 von 27, keine Wiederholung | 10,3 s | 18 / 20 |
| 3 | 27 von 27, keine Wiederholung | 10,6 s | 22 / 30 |
| 4 | 27 von 27, keine Wiederholung | 10,4 s | 24 / 28 |
| 5 | 27 von 27, keine Wiederholung | 10,3 s | 25 / 29 |
| 6 | 27 von 27, keine Wiederholung | 10,4 s | 24 / 31 |

- Sackgassen zusammen: 302 in 1,2 Millionen Platzierungen, also 25,2 je 100.000. Der exakte Wert ist 24,4 je 100.000 (Kapitel 4.1.4). Passt.
- Die Wiederholung in Lauf 1 ist ein gewöhnlicher Fehlalarm: Bei 25 Tests mit α = 0,001 erwartet man in 2,5 % der Läufe mindestens eine. Zur Sicherheit habe ich genau diesen Straßentest 1.000-mal wiederholt: 1 Fehlschlag (erwartet 1,0), und über alle 100 Millionen Ziehungen weicht keine Kante um mehr als 0,017 % ab (Kapitel 4.4.3).

## 4. Antworten auf die Fragen

### 4.1 Ist jede Ziehung wirklich gleichverteilt?

#### 4.1.1 Zufallsquelle

`src/infra/random/cryptoRandomSource.ts:10-24`: holt 256 Werte zu 32 Bit auf einmal aus `crypto.getRandomValues` und gibt sie der Reihe nach aus. Kein Wert wird doppelt verwendet oder umgerechnet. Einzige Produktiv-Instanz in `src/main.tsx:81`, für Losen und Dekoration gemeinsam (NFA-ZF-01, NFA-ZF-03). **Fair.**

Anmerkung ohne Fund: Die 256 vorab geholten Werte liegen bis zu ihrer Verwendung im Arbeitsspeicher. Das ist für die Fairness ohne Belang, die Werte sind unabhängig.

#### 4.1.2 Umrechnung (Modulo-Verzerrung)

`src/core/random/uniform.ts:14-26`: Werte ab dem größten Vielfachen von n werden verworfen und neu gezogen, erst dann wird `% n` gerechnet. Das ist das richtige Verfahren. Belege:

- Exakter Nachweis mit 10-Bit-Werten für jedes n von 1 bis 1.024: Jedes Ergebnis wird von gleich vielen Eingabewerten getroffen (`uniform.test.ts:28-40`), verworfen wird genau ab der Grenze (`:42-54`). Die 32-Bit-Fassung ist dieselbe Funktion mit anderer Breite (`uniform.ts:32-34`).
- Grenzfälle n = 1 und n = 2³² sind getestet (`uniform.test.ts:103-113`), ebenso die Grenze bei n = 3 (`:87-101`). Die Rechnung `2 ** 32 % n` ist in JavaScript-Zahlen exakt.
- `pick` (`uniform.ts:40-49`) wählt über den gezogenen Index, ohne weitere Rechnung.

**Fair, exakt bewiesen.** Der Verdacht 7 der Code-Prüfung ist damit erledigt.

#### 4.1.3 Person, Reihenfolge, Straße, Startrohstoffe

| Baustein | Fundstelle | Verfahren | Urteil |
|---|---|---|---|
| Person losen | `core/draws/drawPerson.ts:11-13` | ein `pick` über alle Personen, ohne Zustand | fair, Ziehungen unabhängig (FA-LS-06) |
| Reihenfolge | `core/draws/placementOrder.ts:32-36`, `:58-64` | n − 1 Ziehungen, jede gleichverteilt über die Verbleibenden | fair; das ergibt jede der n! Reihenfolgen mit 1/n! (kein Mischverfahren mit Tauschfehler) |
| Straße | `games/catan/placement/road.ts:12-16` | ein `pick` über die 3 Kanten der Kreuzung | fair |
| Startrohstoffe | `games/catan/startingResources.ts:45-54` | mit Zurücklegen: jede Ziehung über alle 5; ohne: über die für diese Person verbleibenden | fair |
| Mischen der Dekoration | `ui/.../highlightPlan.ts:139-151` | Fisher–Yates, richtig herum (`uniformInt(index + 1)`) | fair (betrifft nur die Darstellung) |

Simulation ganzer Generierungen (je 200.000 Partien mit 4 und 3 Personen, 94 Einzelprüfungen): kleinster p-Wert 0,021, kein einziger unter 0,01; unter 0,05 liegen 3, erwartet wären etwa 5. Auszug für 4 Personen:

| Prüfung | Stichprobe | p-Wert |
|---|---|---|
| Personenlos Landschaften / Häfen / Zahlenchips | je 200.000 | 0,44 / 0,39 / 0,97 |
| Paare Landschaften × Häfen (Unabhängigkeit) | 200.000 | 0,12 |
| alle 24 Reihenfolgen | 200.000 | 0,80 |
| Straße: welche der 3 Kanten | 1.600.000 | 0,69 |
| Startrohstoffe, 2 ohne Zurücklegen, 20 Paare | 800.000 | 0,96 |

Ein p-Wert nahe 0 würde auf eine Verzerrung hindeuten; Werte irgendwo zwischen 0 und 1 sind bei fairem Zufall normal (Begriffe in Kapitel 10).

#### 4.1.4 Gebäude und Sackgassen: exakte Rechnung

Einzelne Ziehung: `games/catan/placement/rules.ts:68-76` ist ein `pick` über die gültigen Kreuzungen in fester Brettreihenfolge. Für sich **fair**.

Der Planer `RetryOnDeadEnd` (`planner.ts:59-72`) lost einen ganzen Durchlauf und verwirft ihn, wenn er in einer Sackgasse endet. Die exakte Rechnung ergibt:

**a) Sackgassenquote.** Die 24 Inlandkreuzungen zerfallen in drei Arten:

| Art | Anzahl | Lage |
|---|---|---|
| A | 6 | Ecken des Mittelfelds |
| B | 6 | eine Kante von einer Ecke des Mittelfelds nach außen |
| C | 12 | die übrigen, außen an den sechs umliegenden Feldern |

- Bei 4 und 6 Gebäuden (2 und 3 Personen): Wahrscheinlichkeit einer Sackgasse **exakt 0**. Jede gezeigte Ziehung ist exakt gleichverteilt.
- Bei 8 Gebäuden (4 Personen): Ein Durchlauf endet mit Wahrscheinlichkeit **exakt 1/4096 = 0,0244 %** in einer Sackgasse. Die einzige Sackgasse ist, dass die ersten sechs Gebäude genau die sechs B-Kreuzungen sind: (6·5·4·3·2·1) / (24·20·16·12·8·4) = 1/4096. Mit sieben Gebäuden gibt es keine weitere.
- Gemessen (Kapitel 3 und `sackgassen.md`): 18 bis 31 je 100.000, erwartet 24,4. `sackgassen.md` schreibt „etwa 1 von 4.000“; genau ist es 1 von 4.096.

**b) Was das Neulosen an den gezeigten Ziehungen ändert (4 Personen).** Gezeigt wird nur ein Durchlauf ohne Sackgasse. Dadurch ist die gezeigte Ziehung nicht mehr exakt gleichverteilt:

| Gebäude | Anteil der Partien, in denen die gezeigte Ziehung nicht exakt gleichverteilt ist | größte Abweichung einer Kreuzung von „gleich“ |
|---|---|---|
| 1 | 100 % (immer, aber winzig) | B: −0,073 %, A und C: +0,024 % (4,1636 % bzw. 4,1677 % statt 4,1667 %) |
| 2 | 25 % | −0,29 % bis +0,10 % |
| 3 | 6,2 % | −1,2 % bis +0,4 % |
| 4 | 1,5 % | −4,8 % bis +1,6 % |
| 5 | 0,37 % | −20 % bis +6,7 % |
| 6 | 0,073 % (1 von 1.365) | −100 % bis +33 % |
| 7, 8 | 0 % | exakt gleichverteilt |

Lesehilfe: Je näher die Platzierung der Sackgasse kommt (immer mehr B-Kreuzungen belegt), desto stärker wird die letzte freie B-Kreuzung benachteiligt, aber desto seltener ist dieser Stand. Im Mittel über alle Partien ist die Abweichung bei jedem Gebäude gleich klein (mittlerer Abstand zur Gleichverteilung 0,018 %).

Der äußerste Fall: Die ersten fünf Gebäude stehen auf fünf B-Kreuzungen. Dann sind noch vier Kreuzungen gültig: die sechste B-Kreuzung und ihre drei Nachbarn. Die sechste B-Kreuzung würde die Sackgasse auslösen und wird deshalb **nie** gezeigt; die drei anderen kommen mit je 1/3 statt 1/4. Dieser Stand tritt in 0,073 % der Vierer-Platzierungen auf.

**c) Wiederholen eines Gebäudes.** Nach „Gebäude k wiederholen“ wird ab k neu geplant, die Gebäude davor bleiben (`definition.ts:318-323`, `:219-234`). Das ergibt exakt dieselbe Verteilung, wie wenn man den ursprünglichen Plan auf die schon gezeigten Gebäude bedingt; es entsteht keine zusätzliche Verschiebung. Simulation: In 200.000 von 200.000 Fällen blieben die Gebäude davor unverändert und die Platzierung vollständig und regelkonform; die Position des neu gelosten Gebäudes unter den gültigen Kreuzungen ist für jede Anzahl gültiger Kreuzungen unauffällig (kleinster p-Wert 0,021 bei 21 Prüfungen). „Straße wiederholen“ lässt den Plan unberührt, das ist richtig, weil Straßen die Gebäude nicht beeinflussen.

**d) Obergrenze des Planers** (`planner.ts:39`, `:71`; Verdacht 6 der Code-Prüfung). Der ungünstigste erreichbare Stand ist der aus b): Ein Durchlauf gelingt dann mit 3/4. Die Wahrscheinlichkeit für 10.000 Fehlversuche in Folge ist (1/4)^10000, also etwa 10⁻⁶⁰²¹; zu Beginn der Platzierung (1/4096)^10000. Der Fehlerbildschirm kann daraus praktisch nicht entstehen, nur aus einem Programmierfehler oder beschädigten Daten.

**e) Abgleich mit dem echten Code.** Anteil belegter Kreuzungen je Art in 200.000 simulierten Vierer-Partien: A 30,84 %, B 28,79 %, C 36,85 %; exakt gerechnet 30,87 %, 28,76 %, 36,85 % (p = 0,65). Die Rechnung beschreibt also, was der Code tut.

**Urteil:** Bei 2 und 3 Personen **fair**. Bei 4 Personen **fair mit Einschränkung**: Die Abweichung ist für das Spiel bedeutungslos klein, aber die Zusage „jede gültige Kreuzung exakt dieselbe Wahrscheinlichkeit“ (Anforderung 6.2.3, US-PL-02 AK-3) gilt für gezeigte Gebäude nicht exakt (Fund G-1).

### 4.2 Entspricht die Fairness-Definition den Anforderungen?

Die Anforderungen legen fest, was „zufällig“ heißt, und der Code hält sich daran:

| Stelle | Definition der Anforderung | Code | Was das fachlich bedeutet |
|---|---|---|---|
| FA-LS-01/03/04, FA-LS-06 | unabhängige Ziehungen, dieselbe Person mehrfach möglich | ja | Bei 4 Personen bekommt in 1 von 16 Partien dieselbe Person alle drei Aufgaben. |
| FA-LS-02 | nacheinander aus den Verbleibenden | ja | jede Reihenfolge gleich wahrscheinlich |
| 6.2.3 | jede gültige Kreuzung **bei jeder einzelnen Ziehung** gleich | ja, bis auf 4.1.4 b) | siehe unten |
| 6.3.1 | jede Kante am Gebäude gleich, ohne weitere Regeln | ja | Straßen können zur Küste oder in eine Richtung ohne Bauplatz zeigen. Zwei Straßen landen nie auf derselben Kante, weil zwei Gebäude nie benachbart sind. |
| FA-SR-02/03 | jede der 5 Arten gleich; ohne Zurücklegen je Person verschieden | ja | „Ohne Zurücklegen“ gilt je Person, nicht über alle Personen. |

**Wo „zufällig“ etwas anderes bedeutet, als man vermuten könnte:**

1. **Gleich je Ziehung ist nicht gleich je Endbild.** Weil jede Ziehung über die gerade gültigen Kreuzungen gleichverteilt ist, sind die fertigen Bretter nicht gleich wahrscheinlich:

   | Personen | mögliche Endbilder (belegte Kreuzungen, ohne Reihenfolge) | wahrscheinlichstes zu unwahrscheinlichstem |
   |---|---|---|
   | 2 | 5.001 | 1,6 : 1 |
   | 3 | 16.663 | 7,0 : 1 |
   | 4 | 8.853 | 27,8 : 1 |

2. **Äußere Kreuzungen werden häufiger belegt.** Wahrscheinlichkeit, dass eine bestimmte Kreuzung am Ende ein Gebäude trägt:

   | Personen | A (Mittelfeld) | B | C (außen) | wäre „alle gleich“ |
   |---|---|---|---|---|
   | 2 | 16,0 % | 16,0 % | 17,3 % | 16,7 % |
   | 3 | 23,5 % | 23,0 % | 26,8 % | 25,0 % |
   | 4 | 30,9 % | 28,8 % | 36,9 % | 33,3 % |

   Grund: Eine C-Kreuzung hat nur zwei Inland-Nachbarn und wird seltener blockiert. Das letzte Gebäude einer Vierer-Partie steht je Kreuzung mit 5,1 % auf C, aber nur mit 2,7 % auf B.

   Das ist **kein Fehler**, sondern die Folge der Regel 6.2.3, und in Version 1 ohne Landschaften und Zahlen (FA-PL-08) hat keine Kreuzung einen Wert. Sobald Feldinhalte dazukommen (PP-04), wird die Frage wichtig, ob „jede Kreuzung je Ziehung gleich“ weiter die gewünschte Definition ist.

3. **Wiederholen ist frei und spurlos** (FA-AB-04, US-AB-03 AK-7). Wer das Gerät bedient, kann jeden Schritt so oft wiederholen, bis ihm das Ergebnis gefällt; die App hält das nicht fest. Jede einzelne Ziehung bleibt fair, die Fairness des Abends hängt aber daran, dass alle zusehen. Das ist so gewollt; ich nenne es, weil es die größte tatsächliche Stellschraube ist.

### 4.3 Verrät die Inszenierung etwas vor der Landung?

**Ergebnis: nein.** Geprüft nach Dauer, Weg, Reihenfolge und Abbruchpunkten.

**Lauflicht** (`highlightPlan.ts:160-209`): Der Weg ist ein Zufallsweg über alle gültigen Plätze, der das Ergebnis nicht kennt; erst der letzte Sprung ist die Landung. Die Zeiten hängen nur von der Zahl der Sprünge ab.

- Gleicher Startwert, Ergebnis „a“ gegen Ergebnis „e“: Weg und alle Zeiten vor der Landung identisch in 20.000 von 20.000 Fällen.
- 600.000 Pläne, 6 Plätze: Jede Station 0 bis 12 ist mit 16,6 % bis 16,8 % das Ergebnis (erwartet 16,67 %; p-Werte 0,09 bis 0,91). Die Station **direkt vor der Landung** ist es mit 16,69 %, auch getrennt nach Weglänge 8 bis 13 (p ≥ 0,04 bei 6 Prüfungen). Straße mit 3 Kanten: 33,28 %.
- Wer die Dauer des ersten Sprungs misst, kann die Zahl der Sprünge ausrechnen (die Sprünge werden um den Faktor 1,3 länger, die Gesamtdauer ist fest). Das verrät, **wann** die Landung kommt, nicht **wo**.

**Spannungsmodus** (`highlightPlan.ts:217-333`): Es erlöschen alle bis auf das Ergebnis und einen rein zufälligen Gegner; das Duell beginnt mit gleicher Wahrscheinlichkeit auf einem der beiden und dauert 5 bis 8 Wechsel.

- Gegner: jeder andere Platz mit 19,9 % bis 20,1 % (p = 0,07); erstes Erlöschen ebenso (p = 0,03).
- Duell: Jede Station ist mit 49,8 % bis 50,2 % das Ergebnis, die Station vor der Landung mit 49,99 %, auch getrennt nach 5 bis 8 Wechseln.
- Kleinster p-Wert aller 44 Prüfungen der Inszenierung: 0,014 (Duell, Station 6). Bei 44 fairen Prüfungen liegt der kleinste Wert in fast der Hälfte der Fälle so tief; unauffällig.
- Art und Zeitpunkt aller Schritte, Dauer und Zahl der Wechsel sind bei gleichem Startwert für zwei verschiedene Ergebnisse identisch (20.000 von 20.000).

**Karten** (`stagePlan.ts:250-298`, `:330-396`, `:437-562`): Die Karten sind während der Bewegung namenlos; welche Karte gezogen wird, entscheidet das dekorative Mischen, und erst beim Umdrehen bekommt sie ihre Vorderseite. Bewegung ohne die Vorderseiten bei gleichem Startwert und anderem Ergebnis identisch: Personenlos 5.000 von 5.000, erster Platz der Reihenfolge 5.000 von 5.000. Bei den Startrohstoffen wird nichts aufgedeckt (FA-SR-05).

**Übrige Oberfläche während einer Bewegung** (`MatchView.tsx:590-598`, `PlacementStep.tsx:145-162`): Das Brett zeigt den Stand vor dem Stein, das Band nennt nur, wer was setzt, „Zurück“, „Wiederholen“ und der Vorwärts-Knopf sind gesperrt. Die Elemente des Ergebnisses liegen schon im Dokument, sind aber unsichtbar, bis der Plan sie zeigt (`playHighlight.ts:125-127`).

**Einschränkungen** (alle ohne Folgen für die Fairness, weil das Ergebnis vor der Bewegung gespeichert ist, ADR-014):

- Im seltenen Stand aus 4.1.4 b) leuchtet ein Platz, der nicht gelost werden kann (Fund G-2).
- Wird eine Bewegung neu abgespielt, entsteht ein neuer Plan (Beobachtung B-1).
- Für Screenreader steht der Name der gelosten Person sofort im Dokument (Kapitel 9, W-3).

### 4.4 Taugt `tests/statistical`?

#### 4.4.1 Aufbau

25 Chi-Quadrat-Tests gegen die Gleichverteilung mit je 100.000 Ziehungen und α = 0,001, dazu zwei Messungen der Sackgassen. Ein gescheiterter Test wird einmal wiederholt (`vitest.config.ts:41`). Die 18 kritischen Werte in `tests/support/chiSquare.ts:7-26` habe ich nachgerechnet: Alle ergeben eine Überschreitungswahrscheinlichkeit von 0,00100.

#### 4.4.2 Trennschärfe: Wie groß muss eine Verzerrung sein?

Angenommen, **eine** Option ist um den Anteil ε bevorzugt (statt 1/k kommt sie mit (1 + ε)/k). So groß muss ε sein, damit der Test sie mit 90 % Wahrscheinlichkeit findet:

| Test | Optionen | ε für 90 % in einem Versuch | ε für 90 % mit der Wiederholungsregel | in Prozentpunkten |
|---|---|---|---|---|
| Person n = 2, Reihenfolge n = 2 | 2 | 1,5 % | 1,6 % | 50,0 → 50,7 |
| Person n = 3, Straße | 3 | 2,2 % | 2,3 % | 33,3 → 34,1 |
| Person n = 4 | 4 | 2,8 % | 3,0 % | 25,0 → 25,7 |
| Rohstoff, 1 Karte | 5 | 3,3 % | 3,6 % | 20,0 → 20,7 |
| Person n = 6, Reihenfolge n = 3 | 6 | 3,8 % | 4,1 % | 16,7 → 17,3 |
| Person n = 12 | 12 | 6,3 % | 6,7 % | 8,3 → 8,9 |
| Rohstoffe, 20 Paare | 20 | 9,0 % | 9,5 % | 5,0 → 5,5 |
| Kreuzung leeres Brett, Reihenfolge n = 4 | 24 | 10,2 % | 10,8 % | 4,2 → 4,6 |
| Rohstoffe, 120 Reihenfolgen | 120 | 32 % | 33 % | 0,83 → 1,1 |
| Bytes der Plattform | 256 | 54 % | 57 % | 0,39 → 0,6 |

Einordnung:

- **Grobe Fehler werden sicher gefunden:** eine Option, die nie kommt; ein falscher Vorrat; ein fehlerhaftes Mischverfahren. Beispiel: Ein naives Mischen für 3 Personen (Wahrscheinlichkeiten 4/27 und 5/27 statt 1/6) fände die Suite mit praktisch 100 %.
- **Feine Fehler werden nicht gefunden:** Eine Modulo-Verzerrung mit 32-Bit-Werten liegt bei 10⁻⁹; die Suite fände sie mit 0,1 %, also gar nicht. Selbst mit nur 16 Zufallsbits: nicht. Mit 8 Bits: bei 24 Optionen sicher, bei 3 Optionen nur in 4 % der Versuche. Dafür ist der exakte Nachweis da, und der ist vorhanden.
- **Die Verschiebung durch das Neulosen (4.1.4 b)** ist für die Suite unsichtbar: Um die −0,073 % beim ersten Gebäude zu sehen, bräuchte es rund 250 Millionen Ziehungen. Die Suite prüft den Planer ohnehin nicht.
- Die Tests mit 120 und 256 Kategorien erkennen eine einzelne bevorzugte Kategorie erst ab etwa einem Drittel bzw. der Hälfte; sie taugen als Prüfung „alles kommt vor, nichts ist grob schief“.

Was ist „relevante Größe“? Für einen Spieleabend merkt niemand eine Verzerrung unter einigen Prozent. In diesem Sinn reicht die Suite für die Bausteine. Für das Versprechen „exakt gleich“ (NFA-ZF-02) reicht keine Statistik; das trägt der exakte Nachweis.

#### 4.4.3 Fehlalarme

| Größe | Wert |
|---|---|
| Ein bestimmter Test scheitert im ersten Versuch, obwohl alles stimmt | 0,1 % |
| Mindestens ein Test braucht in einem Lauf die Wiederholung | 2,5 % (1 von 40 Läufen) |
| Ein bestimmter Test scheitert zweimal | 0,0001 % |
| Die Suite scheitert zu Unrecht | 0,0025 % (1 von 40.000 Läufen) |
| Bei 50 Läufen im Jahr: mindestens eine Wiederholung gesehen | 71 % |
| Bei 50 Läufen im Jahr: mindestens ein falscher Fehlschlag | 0,12 % |

Empirisch (je 1.000 Wiederholungen eines Tests, zusammen 100 Millionen Ziehungen je Zeile):

| Test | gescheitert bei α = 0,001 (erwartet 1,0) | p-Werte gleichmäßig? | alle Ziehungen zusammen: p-Wert | größte Abweichung einer Option |
|---|---|---|---|---|
| Straße, 3 Kanten | 1 | ja (0,76) | 0,47 | 0,017 % |
| Person n = 2 | 1 | ja (0,41) | 0,47 | 0,007 % |
| Person n = 4 | 2 | ja (0,84) | 0,92 | 0,012 % |
| Person n = 12 | 2 | ja (0,18) | 0,019 | 0,10 % |
| `uniformInt` n = 24 | 0 | ja (0,11) | 0,11 | 0,10 % |
| Reihenfolge n = 3 | 0 | ja (0,07) | 0,45 | 0,034 % |
| Rohstoffe, 20 Paare | 2 | ja (0,85) | 0,020 | 0,16 % |

Zwei der sieben Sammelwerte liegen bei 0,02 (Person n = 12, Rohstoffpaare). Dass von sieben fairen Prüfungen zwei so klein ausfallen, kommt nur in knapp 1 % der Fälle vor. Ich habe deshalb genau diese beiden mit frischen Ziehungen und dreifacher Menge wiederholt, statt es als Zufall abzutun:

| Wiederholung, je 300 Millionen Ziehungen | gescheitert bei α = 0,001 (erwartet 3,0) | alle Ziehungen zusammen: p-Wert | größte Abweichung einer Option |
|---|---|---|---|
| Person n = 12 | 3 | 0,82 | 0,028 % |
| Rohstoffe, 20 Paare | 3 | 0,96 | 0,037 % |

Eine echte Abweichung von 0,1 % wäre bei dreifacher Menge deutlicher geworden; sie ist verschwunden. Es war Zufall. Über alles gilt: Keine Option weicht bei 300 Millionen Ziehungen um mehr als 0,04 % ab.

**Die Wiederholungsregel ist vernünftig.** Sie senkt den Fehlalarm je Test von 10⁻³ auf 10⁻⁶ und kostet wenig Trennschärfe (Tabelle in 4.4.2: 1,5 % → 1,6 %). Ein einzelner Test mit α = 10⁻⁶ ohne Wiederholung wäre bei gleicher Zahl von Ziehungen schwächer (überschlagen für 2 Optionen: Er bräuchte eine um ein Viertel größere Verzerrung). Nachteil: Eine Wiederholung steht nur in der ausführlichen Ausgabe und wird nirgends gezählt. Eine echte kleine Verzerrung würde sich zuerst als **gehäufte Wiederholungen** zeigen, und das bemerkt heute niemand (Vorschlag S-5).

#### 4.4.4 Lücken

1. **Nur Bausteine, nicht der Ablauf.** Die Suite ruft `drawPerson`, `drawPlacementOrder`, `drawBuilding`, `drawRoad`, `drawCatanStartingResources` direkt auf. Weder der Planer (welches Gebäude zeigt er zuerst?) noch `CATAN_GENERATION.nextStep` noch „Wiederholen“ werden mit echtem Zufall geprüft. Die Logik ist durch Unit-Tests abgedeckt; eine Verteilungsprüfung des Ganzen fehlt.
2. **Die Sackgassen-Messung prüft nichts** (`placement.stat.test.ts:84-127`): Sie gibt Zahlen aus und verlangt nur `total === 8`. Ein Fehler, der die Quote verzehnfacht, bliebe grün.
3. **Die vier Kreuzungs-Tests und der Straßentest** (`placement.stat.test.ts:47-78`) prüfen im Kern viermal bzw. einmal `pick` mit anderer Listenlänge; der Straßentest nur an einer Kreuzung.
4. **Geprüft wird der Generator von Node**, nicht der der Geräte. Für die Geräte gibt es den Würfeltest der Diagnose (K-9).

### 4.5 Halten sich alle Stellen an die Regeln?

| Regel | Ergebnis |
|---|---|
| Kein `Math.random` | kein Treffer in `src`, `tests`, `scripts`, Konfiguration; einziger Treffer ist der Verbotstext in `eslint.config.js:55` |
| `crypto.getRandomValues` nur in `infra/random` | einziger Aufruf im Produktivcode: `cryptoRandomSource.ts:16`. Die Diagnose prüft nur, ob es die Funktion gibt (`infra/platform/diagnostics.ts:188-189`) |
| `crypto.randomUUID` nur in `infra` | einziger Aufruf: `infra/random/uuidGenerator.ts:8` |
| Tests nur mit `SeededRandomSource`/`ScriptedRandomSource` | `CryptoRandomSource` wird nur in `src/main.tsx`, im eigenen Test (mit ersetztem Generator, `cryptoRandomSource.test.ts:10`) und in `tests/statistical` verwendet |
| E2E | `tests/e2e/seededRandom.ts:10-34` ersetzt `crypto.getRandomValues` nur in der Testseite; im Produktivcode gibt es keinen Schalter und keinen Startwert (Verdacht 10 der Code-Prüfung bestätigt) |
| Dekorativer Zufall aus derselben Quelle (NFA-ZF-01) | ja: `highlightPlan.ts` und `stagePlan.ts` bekommen `rng` aus `AppDependencies` |
| Absicherung | ESLint sperrt `Math.random` und `crypto` außerhalb der erlaubten Ordner (`eslint.config.js:31-65`, `:180-205`) |

**Eingehalten.**

## 5. Funde nach Schwere

Größe: klein = bis etwa eine Stunde, mittel = ein halber Tag, groß = eigenes Bündel.

### 5.1 Kritisch, hoch, mittel

Keine.

### 5.2 Gering

#### G-1 „Jede einzelne Ziehung bleibt gleichverteilt“ stimmt bei 4 Personen nicht exakt

- **Fundstelle:** `docs/BoardBrain_Anforderungsdokumentation.md:347` (6.2.6, erster Satz) gegenüber `:344` (6.2.3 „exakt dieselbe Auswahlwahrscheinlichkeit“); `docs/BoardBrain_Spezifikation.md:230` und `:688` (US-PL-02 AK-3); `docs/BoardBrain_Architektur.md:428`; `docs/test-reports/sackgassen.md:44` („Jede einzelne Ziehung bleibt exakt gleichverteilt“); Kommentar `src/games/catan/placement/planner.ts:43-44`.
- **Ist:** Innerhalb eines Durchlaufs ist jede Ziehung gleichverteilt. Gezeigt wird aber nur ein Durchlauf ohne Sackgasse, und dadurch sind die **gezeigten** Ziehungen leicht verschoben (Zahlen in 4.1.4 b): erstes Gebäude bis −0,073 %, beim sechsten Gebäude in 1 von 1.365 Partien eine gültige Kreuzung mit Wahrscheinlichkeit 0.
- **Schaden:** Keiner am Spieltisch. Die App wirbt aber mit Fairness, und die Dokumente sagen „exakt“.
- **Vorschlag:** Die vier Dokumente und den Kommentar berichtigen: „Innerhalb eines Durchlaufs ist jede Ziehung gleichverteilt; durch das Verwerfen ist die gezeigte Ziehung bei 4 Personen um höchstens … verschoben“, mit den exakten Zahlen und 1/4096 statt „etwa 1 von 4.000“. Ändert die Anforderungsdokumentation, also Entscheidung des Product Owners.
- **Größe:** klein (Doku).

#### G-2 Aufblinken zeigt im seltenen Stand einen Platz, der nicht kommen kann

- **Fundstelle:** `src/games/catan/placement/spots.ts:29-36` (gültige Plätze allein nach Abstandsregel), `src/ui/views/match/placement/highlightPlan.ts:9-13`; US-IN-02 AK-3 (`docs/BoardBrain_Spezifikation.md:743`: „jeder noch leuchtende Platz ist bis zur Landung gleich wahrscheinlich das Ergebnis“).
- **Ist:** Stehen bei 4 Personen die ersten fünf Gebäude auf fünf B-Kreuzungen (0,073 % der Partien), leuchten beim sechsten vier Plätze, von denen einer nie das Ergebnis ist. Wer die Regel kennt, kann ihn ausschließen. In allen anderen Ständen sind die leuchtenden Plätze höchstens um die Werte aus 4.1.4 b) ungleich.
- **Vorschlag, zwei Wege:**
  - **A, mit G-1 dokumentieren** und hinnehmen. Größe: klein.
  - **B, vorausschauende Gültigkeit (PP-14) umsetzen.** Seit der exakten Rechnung ist klar, dass es genau eine Sackgassen-Stellung gibt; eine Kreuzung ist dann nur gültig, wenn danach alle restlichen Gebäude noch Platz finden. Damit wäre jede gezeigte Ziehung exakt gleichverteilt über genau die Plätze, die leuchten; das Neulosen, die Obergrenze 10.000 und der gespeicherte Plan (G-6) entfielen. Ändert E-09 und ADR-010. Größe: mittel.
- **Empfehlung:** A jetzt; B erwägen, wenn `games/catan/placement` ohnehin angefasst wird. Der Gewinn an Fairness ist rechnerisch, nicht spürbar; der Gewinn an Einfachheit (kein verdeckter Plan) ist echt.

#### G-3 Statistische Suite prüft Planer und Ablauf nicht; die Sackgassen-Messung verlangt nichts

- **Fundstelle:** `tests/statistical/placement.stat.test.ts:84-127` (einzige Erwartung: `expect(total).toBe(8)`), Kapitel 4.4.4.
- **Fehlerfall:** Eine Änderung am Planer oder an den Regeln, die die Sackgassenquote oder die Verteilung der Gebäude verschiebt, lässt `test:stat` grün.
- **Vorschlag:** S-1 bis S-3 in Kapitel 8 (exakter Test der Quote 1/4096, Grenzen für die Messung, Verteilungsprüfung ganzer Generierungen).
- **Größe:** klein bis mittel.

#### G-4 Tests des Aufblinkens prüfen die Station vor der Landung nur teilweise

- **Fundstelle:** `src/ui/views/match/placement/highlightPlan.test.ts:123-135` (Stationen 0 bis 7 des Lauflichts) und `:194-211` (Stationen 0 bis 4 des Duells).
- **Ist:** Der Weg hat 8 bis 13 Stationen, das Duell 5 bis 8. Die letzte Station vor der Landung liegt deshalb nur in 1/6 bzw. 1/4 der Pläne im geprüften Bereich. Genau dort lag die am 11.11.2026 gefundene Lücke („vorletzter Sprung nie das Ergebnis“). Käme sie zurück, läge der Anteil an Station 7 bei 13,9 % statt 16,7 %; der Test mit 6.000 Plänen und festem Startwert fände das nicht sicher.
- **Stand heute:** Kein Leck (Simulation in 4.3).
- **Vorschlag:** (1) Eigene Prüfungen für `hops.at(-2)` und `turns.at(-2)`. (2) Statt Statistik ein **Strukturtest**: gleicher Startwert, zwei verschiedene Ergebnisse, erwartet werden identischer Weg und identische Zeiten vor der Landung. Das ist ein Beweis je Startwert statt einer Schätzung, und es gibt ihn für die Karten schon (`stagePlan.test.ts:75`, `:224`).
- **Größe:** klein.

#### G-5 Feste Startwerte mit statistischer Schwelle

- **Fundstelle:** `src/ui/views/match/placement/highlightPlan.test.ts:30-32` und alle Aufrufe von `isUniform` (37 Prüfungen mit α = 0,001 bei festem Startwert).
- **Ist:** Mit festem Startwert ist das Ergebnis immer dasselbe, die Tests wackeln also nicht. Ändert aber jemand zu Recht, wie viele Zufallswerte die Planung verbraucht, verschieben sich alle Folgen; mit 3,6 % Wahrscheinlichkeit wird dann eine der 37 Prüfungen rot, obwohl nichts falsch ist.
- **Vorschlag:** Im Kopf der Testdatei festhalten, was dann zu tun ist (anderen Startwert prüfen, nicht die Schwelle lockern); mit dem Strukturtest aus G-4 können die meisten dieser Prüfungen entfallen.
- **Größe:** klein.

#### G-6 Verdeckter Plan in der Datenbank ist nicht nötig

- **Fundstelle:** `src/games/catan/generation/definition.ts:25-38` (`hiddenPlan`), `:219-234`, `:318-327`, `:378-382`; ADR-010 („der Plan wird mit der Sitzung gespeichert“). In der Code-Prüfung als Verdacht 4 genannt.
- **Bewertung des Lecks:** Die nächsten Gebäude stehen lesbar in IndexedDB. Auf Handy und Tablet kommt man ohne angeschlossenen Rechner nicht heran; am PC genügen die Entwicklerwerkzeuge. Wer das Gerät bedient, könnte nachsehen und ein Gebäude gezielt wiederholen. Für einen Spieleabend unter Freunden gering, aber vermeidbar.
- **Vorschlag:** Den Plan nicht speichern, sondern bei **jedem** Gebäude ab den schon gezeigten neu planen und nur das erste Gebäude des Durchlaufs nehmen. Die Verteilung ist exakt dieselbe (Begründung wie in 4.1.4 c: Der Plan, bedingt auf die gezeigten Gebäude, ist genau die Verteilung des Neuplanens). Es entfallen `hiddenPlan`, sein Zurücksetzen an drei Stellen und die Frage, ob ein gespeicherter Plan noch zum Brett passt. Kosten: je Gebäude ein paar Zufallswerte mehr. Mit Weg B aus G-2 entfiele der Plan ebenfalls.
- **Betroffen:** ADR-010, Spezifikation 3.2, Sitzungsschema (neue Version, siehe M-3 der Code-Prüfung). Haltepunkt: Architektur.
- **Größe:** mittel.

#### G-7 Kandidaten der Reihenfolge doppelt berechnet

- **Fundstelle:** `src/games/catan/generation/definition.ts:214` (eigener Filter) neben `:215` (`drawOrderSpin`, das intern `remainingForOrder` aus `core/draws/placementOrder.ts:22-24` nutzt). In der Code-Prüfung als Verdacht 3 genannt.
- **Ist:** Beide Ausdrücke sind heute gleich; die gespeicherten `candidates` sind die Menge, aus der gelost wurde. Tests prüfen Anzahl und „Ergebnis ist dabei“ (`definition.test.ts:178-180`), nicht die Gleichheit.
- **Vorschlag:** In Zeile 214 `remainingForOrder(setup.participants, drawn)` verwenden (ist schon exportiert).
- **Größe:** klein.

### 5.3 Beobachtungen ohne Handlungsbedarf

#### B-1 Verdacht: Erneutes Abspielen im Spannungsmodus engt das Ergebnis ein

- **Fundstelle:** `src/ui/views/match/placement/PlacementHighlight.tsx:182-186` (der Plan entsteht bei jedem Einhängen der Ebene neu), `tensionMode.ts:6` (der Modus lebt im Arbeitsspeicher und bleibt beim Verlassen der Seite innerhalb der App an).
- **Weg (nicht nachgestellt):** Während das Aufblinken läuft, mit der Zurück-Taste des Browsers die Seite verlassen und zurückkehren. Die Bewegung beginnt mit neuer Dekoration: Das Ergebnis erlischt nie, der Gegner ist jedes Mal ein anderer. Nach zwei Durchgängen ist der gemeinsame der beiden „letzten zwei“ Plätze fast sicher das Ergebnis. Nach einem Neustart der App ist der Spannungsmodus aus (FA-IN-08), dann läuft das Lauflicht, das nichts einengt.
- **Einordnung:** Keine Frage der Fairness: Das Ergebnis ist gespeichert und nicht mehr zu ändern, und „Animation überspringen“ zeigt es ohnehin sofort. Es nimmt nur dem, der es darauf anlegt, die Spannung.

#### B-2 Würfeltest der Diagnose: Trennschärfe

- **Fundstelle:** `src/core/random/diceTest.ts:7-8` („enough that a real bias of about 2 % would stand out“).
- **Ist:** Sind drei Seiten um 2 % häufiger und drei um 2 % seltener, schlägt der Test mit 79 % an; bei 1 % mit 7 %, bei 3 % mit 99,9 %. Ist nur **eine** Seite bevorzugt, braucht es 4,9 % für 90 %. Der Kommentar stimmt also für den günstigen Fall.
- **Laufzeit und Fehlalarm:** 2.000 Würfeltests auf dem Entwicklungs-PC: 1,7 ms je Test (60.000 Würfe), 4 davon „auffällig“ (erwartet 2,0). Selbst ein fünfzigmal langsameres Handy bleibt unter 0,1 s; ein Auslagern vom Hauptfaden ist nicht nötig. Der Hinweis „Schlägt bei 1 von 1000 Tests auch ohne Fehler an“ steht in der Oberfläche (`src/i18n/de.ts:447`); Verdacht 9 der Code-Prüfung ist damit erledigt.
- **Vorschlag:** Kommentar genauer fassen. Größe: klein.

## 6. Verdachtsfälle aus der Code-Prüfung (dort Kapitel 6)

| Nr. | Verdacht | Ergebnis |
|---|---|---|
| 1 | Bewegungen kennen das Ergebnis | Bestätigt, dass sie es bekommen, aber bis zur Landung hängt nichts davon ab (4.3). Die Tests belegen 1/n nicht an allen Stationen: Fund G-4. |
| 2 | Eine Zufallsquelle für Losen und Dekoration | Für die Fairness unkritisch: Jeder Wert ist unabhängig, die Reihenfolge der Entnahme spielt keine Rolle. Unit-Tests geben jedem Aufruf eine eigene Testquelle. Die E2E-Tests laufen alle mit Startwert 7; ihre Losergebnisse hängen damit auch davon ab, wie viele Werte die Dekoration verbraucht (Kapitel 9, W-5). |
| 3 | Kandidaten doppelt berechnet | Heute gleich; Fund G-7. |
| 4 | Verdeckter Plan lesbar in der Datenbank | Bewertet in Fund G-6, mit einem Weg, ihn ganz zu vermeiden. |
| 5 | Wiederholen und Plan | Verteilung exakt wie erwartet, keine zusätzliche Verschiebung (4.1.4 c). |
| 6 | Abbruch des Planers | Praktisch unmöglich: höchstens (1/4)^10000 (4.1.4 d). |
| 7 | Verzerrungsfreie Umrechnung, Grenzfälle | Richtig und getestet (4.1.2). |
| 8 | Wiederholung in der statistischen Suite | Vernünftig; Zahlen in 4.4.2 und 4.4.3. Kleine echte Verzerrungen findet die Suite mit oder ohne Wiederholung nicht. |
| 9 | Würfeltest der Diagnose | Hinweis auf 1 von 1.000 steht in der Oberfläche; Laufzeit und Trennschärfe in B-2. |
| 10 | E2E-Zufall | Bestätigt: kein Schalter im Produktivcode (4.5). |

## 7. Urteil je Baustein

| Baustein | Urteil | Begründung |
|---|---|---|
| Zufallsquelle `CryptoRandomSource` | **fair** | reicht die Werte der Plattform unverändert durch |
| Umrechnung `uniformInt`, `pick` | **fair** | Verwerfungsverfahren, exakt bewiesen |
| Person losen (LS-01, 03, 04) | **fair** | ein `pick`, unabhängig |
| Platzierungsreihenfolge (LS-02) | **fair** | jede der n! Reihenfolgen gleich |
| Straße | **fair** | ein `pick` über 3 Kanten |
| Startrohstoffe | **fair** | mit und ohne Zurücklegen wie gefordert |
| Gebäude, 2 und 3 Personen | **fair** | keine Sackgasse möglich, jede Ziehung exakt gleich |
| Gebäude, 4 Personen (Planer, Sackgassen) | **fair mit Einschränkungen** | gezeigte Ziehung um höchstens 0,073 % (erstes Gebäude) verschoben; in 1 von 1.365 Partien eine gültige Kreuzung ausgeschlossen; von den Anforderungen dem Grundsatz nach in Kauf genommen, aber ungenau beschrieben (G-1) |
| Wiederholen | **fair mit Einschränkungen** | Verteilung stimmt; frei und spurlos, also nur fair, wenn alle zusehen (so gefordert) |
| Inszenierung Karten | **fair** | Bewegung unabhängig vom Ergebnis |
| Inszenierung Lauflicht und Spannungsmodus | **fair mit Einschränkungen** | verrät nichts; im seltenen Stand leuchtet ein unmöglicher Platz (G-2); Tests decken die kritische Station nicht ganz ab (G-4) |
| Würfeltest der Diagnose | **fair** (als Prüfwerkzeug brauchbar) | findet Abweichungen ab etwa 2 bis 5 % |
| Statistische Suite | taugt für grobe Fehler | Lücken bei Planer und Ablauf (G-3) |

## 8. Vorschläge zur statistischen Suite

| Nr. | Vorschlag | Nutzen | Größe |
|---|---|---|---|
| S-1 | **Exakter Test der Sackgassen** als Unit-Test in `planner.test.ts`: alle Belegungen durchzählen und prüfen, dass die Quote bei 8 Gebäuden genau 1/4096 ist, bei 4 und 6 Gebäuden 0, und dass die einzige Sackgasse die sechs B-Kreuzungen sind. Läuft in unter einer Sekunde und braucht keinen Zufall. | Ersetzt eine Schätzung durch einen Beweis, wie bei der Umrechnung (Architektur 14.3). | klein |
| S-2 | **Der Messung Grenzen geben:** In `placement.stat.test.ts` erwarten, dass die Zahl der Sackgassen je 100.000 zwischen 10 und 43 liegt (erwartet 24,4; außerhalb liegt ein fairer Lauf in 0,055 % der Fälle, also seltener als die übrigen Tests mit α = 0,001). | Die Messung wird zum Test. | klein |
| S-3 | **Ganze Generierungen prüfen:** 100.000 Partien mit 4 Personen durch `CATAN_GENERATION` (über `runCatanGeneration` aus `tests/support`), dann Chi-Quadrat für: erstes Gebäude über 24 Kreuzungen, belegte Kreuzungen je Art A/B/C gegen die exakten Werte (30,87 % / 28,76 % / 36,85 %), 24 Reihenfolgen, Kante der Straße. In meinem Versuch dauerten 200.000 Partien einschließlich Wiederholen rund dreieinhalb Minuten; 50.000 Partien ohne Wiederholen schätze ich auf eine halbe Minute (nicht gemessen). | Schließt die Lücke zwischen Bausteinen und Ablauf. | mittel |
| S-4 | **Straße an allen drei Arten von Kreuzungen** prüfen (A, B, C) statt nur an einer; die vier Kreuzungs-Tests auf zwei kürzen. | Gleiche Laufzeit, mehr Abdeckung. | klein |
| S-5 | **Wiederholungen sichtbar machen:** In CI die Zeilen mit `retry` aus der Ausgabe zählen und als Hinweis im Lauf ausgeben. Faustregel in Architektur 14.4 ergänzen: Braucht derselbe Test in zwei aufeinanderfolgenden Läufen die Wiederholung (Zufall: 1 zu einer Million), ist das zu untersuchen. | Eine kleine echte Verzerrung fällt als Häufung auf. | klein |
| S-6 | **In Architektur 14.4 festhalten, was die Suite nicht kann:** Trennschärfe-Tabelle aus 4.4.2 und der Satz, dass Modulo-Verzerrung nur der exakte Nachweis findet. | Verhindert falsche Sicherheit. | klein (Doku) |
| S-7 | Optional: einmal je Release einen **langen Lauf** (10 Millionen Ziehungen je Baustein, von Hand gestartet). Senkt die Nachweisgrenze auf ein Zehntel. | Nur wenn gewünscht; der exakte Nachweis macht ihn nicht nötig. | klein |

Nicht empfohlen: α ändern oder die Wiederholung abschaffen. Beides ist stimmig gewählt (4.4.3).

**Vorschlag für den Umsetzungsplan** (Nummern nach den Vorschlägen K-10 bis K-13 der Code-Prüfung):

| Aufgabe | Funde | Modell, Aufwand |
|---|---|---|
| **K-14** Doku zur Fairness der Platzierung berichtigen (exakte Zahlen, 1/4096), Kommentar im Würfeltest | G-1, G-2 Weg A, B-2, S-6 | Sonnet, low; reiner Doku-PR, vorher Zustimmung zur Änderung der Anforderungsdokumentation |
| **K-15** Tests schärfen: exakter Sackgassen-Test, Grenzen der Messung, Strukturtest und Station vor der Landung, Kandidaten über `remainingForOrder`, Straße an drei Arten, Wiederholungen zählen | G-3, G-4, G-5, G-7, S-1, S-2, S-4, S-5 | Opus, high (Zufall und Platzierung gelten als kritisch) |
| **K-16** Verteilungsprüfung ganzer Generierungen | G-3, S-3 | Opus, high |
| Entscheidung des Product Owners: verdeckten Plan abschaffen (G-6) oder vorausschauende Gültigkeit (G-2 Weg B) | G-2, G-6 | erst entscheiden; Umsetzung Opus, high, mit neuer ADR |

## 9. Weitere Auffälligkeiten

Nicht vertieft. Was in der Code-Prüfung steht, ist hier nicht wiederholt.

| Nr. | Fundstelle | Einschätzung |
|---|---|---|
| W-1 | `src/ui/views/match/placement/highlightPlan.ts:229-240` | Spannungsmodus mit genau zwei gültigen Kreuzungen: Nichts erlischt, trotzdem vergehen 0,42 s + 55 % von 7 s (zusammen rund 4,3 s), bevor „Zwei übrig“ erscheint. Mit genau einer gültigen Kreuzung leuchtet ein einzelner Punkt rund 6,4 s. Bei 4 Personen haben 0,7 % der Gebäude genau zwei und 0,2 % genau einen gültigen Platz (Simulation); das trifft grob jede 20. bzw. 60. Vierer-Partie. Wirkt wie ein Hänger; die Dauer könnte von der Zahl der erlöschenden Plätze abhängen. |
| W-2 | `src/ui/views/match/placement/highlightPlan.ts:348` | Fehlt das Ergebnis unter den gültigen Plätzen, wird es stillschweigend ergänzt. Das kann nur bei einem Fehler oder beschädigten Daten vorkommen und würde ihn verdecken; ein Eintrag im Fehlerprotokoll wäre ehrlicher. |
| W-3 | `src/ui/views/match/cards/DrawScene.tsx:110-115` | Während der Kartenbewegung stehen „Wer?“ und der Name der gelosten Person zugleich im Dokument, beide ohne `aria-hidden`. Ein Screenreader liest das Ergebnis sofort und doppelt. Barrierefreiheit, mit G-10 der Code-Prüfung zusammen ansehen. |
| W-4 | `tests/statistical/placement.stat.test.ts:80-82` | Kommentar nennt 5 bis 6 Sekunden für die Messung; gemessen 4,5 s. Unkritisch, die Grenze liegt bei 60 s. |
| W-5 | `tests/e2e/seededRandom.ts`, alle E2E-Dateien mit `useSeededRandom(page, 7)` | Losergebnisse in E2E-Tests hängen am Startwert **und** am Verbrauch der Dekoration. Wird eine Bewegung geändert, ändern sich alle späteren Ergebnisse. Tests sollten deshalb nie ein bestimmtes Losergebnis erwarten; ob das überall so ist, habe ich nicht geprüft. |
| W-6 | `vitest.config.ts:41` | Die Wiederholung gilt für jede Erwartung der Suite, auch für nicht statistische wie `expect(counts.size).toBe(3)` und für die Messungen. Harmlos, aber ein echter Fehler dort würde erst im zweiten Versuch gemeldet. |
| W-7 | `docs/BoardBrain_Architektur.md:430` und `:437` | Einmal `MAX_ATTEMPTS`, einmal `MAX_PLAN_ATTEMPTS`; der Code kennt nur den zweiten Namen. |
| W-8 | `docs/test-reports/sackgassen.md:42` und `:44` | „etwa 1 von 4.000“ und „exakt gleichverteilt“: mit G-1 berichtigen und die exakte Quote ergänzen (neue Version des Berichts). |
| W-9 | `src/games/catan/generation/definition.ts:221-234` | Ein gespeicherter Plan wird ohne Prüfung gegen die Regeln übernommen. Heute kann er nicht veralten (alle drei Wege setzen ihn zurück); eine Prüfung „nächstes Gebäude ist gültig“ kostete eine Zeile. Entfällt mit G-6. |
| W-10 | `docs/BoardBrain_Anforderungsdokumentation.md:345` | Regel 6.2.4 nennt die sechs B-Kreuzungen als „Beispiel“ einer Sackgasse. Die Rechnung zeigt: Es ist die einzige. Das könnte dort stehen. |

## 10. Begriffe kurz erklärt

- **Gleichverteilung:** Jede Möglichkeit ist gleich wahrscheinlich, wie bei einem fairen Würfel.
- **Modulo-Verzerrung:** Der Zufallsgenerator liefert Zahlen von 0 bis 4.294.967.295. Teilt man einfach durch 3 und nimmt den Rest, kommt der Rest 0 einmal öfter vor als die anderen, weil die Anzahl nicht durch 3 teilbar ist. Die App wirft stattdessen die überzähligen Zahlen weg und zieht neu (**Verwerfungsverfahren**). Dann ist es exakt.
- **Bedingte Verteilung:** Wahrscheinlichkeiten, nachdem man weiß, dass etwas Bestimmtes (nicht) passiert ist. Die Platzierung zeigt nur Durchläufe ohne Sackgasse; alles, was zur Sackgasse geführt hätte, fehlt, und der Rest wird entsprechend etwas wahrscheinlicher.
- **Chi-Quadrat-Test:** Man zählt, wie oft jede Möglichkeit kam, und rechnet aus, wie weit die Zählung von „alle gleich oft“ entfernt ist. Eine einzige Zahl (χ²) fasst das zusammen; ist sie größer als ein Grenzwert, gilt der Test als gescheitert.
- **Freiheitsgrade:** Zahl der Möglichkeiten minus 1. Sie bestimmt den Grenzwert.
- **p-Wert:** Wie wahrscheinlich eine mindestens so große Abweichung wäre, wenn alles fair ist. Bei fairem Zufall ist der p-Wert selbst zufällig irgendwo zwischen 0 und 1; nur sehr kleine Werte sind verdächtig.
- **Signifikanzniveau α:** Die Schwelle für „verdächtig“. α = 0,001 heißt: Ein fairer Zufall scheitert in 1 von 1.000 Tests trotzdem. Das ist der **Fehlalarm**.
- **Mehrfaches Testen:** Wer 25 Tests macht, hat 25 Gelegenheiten für einen Fehlalarm. Deshalb scheitert in 2,5 % der Läufe irgendein Test im ersten Versuch, und deshalb gibt es die Wiederholung.
- **Trennschärfe (Power):** Wie wahrscheinlich ein Test eine tatsächlich vorhandene Verzerrung findet. Sie hängt von der Größe der Verzerrung und der Zahl der Ziehungen ab: Für eine halb so große Verzerrung braucht man viermal so viele Ziehungen.
- **Exakter Nachweis:** Statt zu würfeln und zu zählen, werden alle Fälle vollständig durchgerechnet. Das Ergebnis ist kein „sehr wahrscheinlich“, sondern ein Beweis. Geht nur, wo die Zahl der Fälle klein genug ist (10-Bit-Werte, Belegungen des Bretts).
