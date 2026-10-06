# BoardBrain – Spezifikation

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Spezifikation (User Stories, Abnahmekriterien, Priorisierung) |
| Version | 0.5 |
| Status | Final – freigegeben für die Durchführung des Setups und die Umsetzung |
| Stand | 06.10.2026 |
| Grundlage | BoardBrain_Anforderungsdokumentation.md, Version 0.8; technische Umsetzung in BoardBrain_Architektur.md, Version 0.2; Arbeitsregeln in Entwicklungsrichtlinien.md |
| Sprache | Deutsch |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 05.10.2026 | Erstfassung nach Klärung der offenen Punkte OP-03 bis OP-08 und OP-10 |
| 0.2 | 05.10.2026 | Abnahme durch den Product Owner: Annahmen bestätigt; Personennamen innerhalb einer Gruppe eindeutig; freie Auswahl einzelner Partien beim Export, auch gruppenübergreifend; Zuordnungen beim Import werden vorgeschlagen und jedes Mal bestätigt |
| 0.3 | 05.10.2026 | Zuordnungen beim Import stets manuell, ohne Vorbelegung und ohne Speicherung; Auswahl einzelner Partien beim Export auf eine Gruppe beschränkt (gruppenübergreifend geparkt als PP-19) |
| 0.4 | 06.10.2026 | Ergebnisse der Architekturphase: „Alle Daten“ wird zur Vollsicherung mit Einstellungen (US-EI-01, US-EI-02, US-EI-03, US-EI-07, 3.9, 3.11); Sicherungspunkt erst unmittelbar vor der Übernahme eines Imports (US-EI-03 AK-1); Konfliktregeln präzisiert (US-EI-04, US-EI-05, 3.9); Sperren während einer laufenden Partie (3.5, US-VW-02, US-VW-03, US-EI-03, US-DS-02); unterbrochene Animation wird erneut abgespielt (US-AB-05); Sicherungspunkte vor Updates, Tagesregel und Umfang (3.10, US-DS-01, US-DS-02); Update nur nach Bestätigung und Sicherungsdialog (neu 3.12, US-UP-01, neu US-UP-02); Installation und Speicherschutz (neu 3.13, neu US-IS-01 bis US-IS-03, US-DS-04); Ton respektiert die Stummschaltung (US-IN-03); Prüfkriterien und Abnahmeplattformen präzisiert (Kapitel 5); Kapitel 8 auf das Ergebnis der Architekturphase umgestellt |
| 0.5 | 06.10.2026 | Ergebnisse der Setup-Planung: Bezug auf Anforderungsdokumentation v0.8; Umsetzung in Story-Bündeln und Platzhalter-Release 0.1.0 vor 1.0 (2.3); Hinweis zur Barrierefreiheit (Kapitel 5, E-24); Kapitel 8 um die Ergebnisse der Setup-Planung ergänzt (OP-12 geklärt, OP-13 neu) |

## Inhaltsverzeichnis

1. Einleitung
2. Umfang von Version 1 und Priorisierung
3. Fachliche Festlegungen
4. User Stories
5. Nicht-funktionale Anforderungen: Prüfkriterien
6. Rückverfolgbarkeit
7. Bestätigte Annahmen
8. Ergebnis der Architekturphase und Übergabe an die Setup-Phase

---

## 1. Einleitung

### 1.1 Zweck

Diese Spezifikation übersetzt die Anforderungsdokumentation in umsetzbare und prüfbare User Stories. Sie ist die Grundlage für Architektur, Umsetzung und Abnahme. Die Anforderungsdokumentation bleibt die verbindliche Quelle für das *Was*; diese Spezifikation legt fest, *woran* die Erfüllung erkannt wird. Widersprüche zwischen beiden Dokumenten werden in beiden bereinigt.

### 1.2 Konventionen

| Element | Konvention |
|---|---|
| User Story | „Als ‹Rolle› möchte ich ‹Ziel›, damit ‹Nutzen›.“ |
| Rollen | *Bedienende Person* (bedient das Gerät am Tisch), *Nutzer* (verwaltet Daten), *Spielende* (nehmen an Partien teil) |
| Story-ID | `US-‹Bereich›-‹Nr›`, Bereiche wie in der Anforderungsdokumentation (SP, PG, VW, AB, LS, PL, SR, IN, ER, ST, EI, DS, UP, IS, GB) |
| Abnahmekriterien | `AK-n` je Story, Form: **Gegeben** ‹Ausgangslage›, **wenn** ‹Handlung›, **dann** ‹erwartetes Ergebnis› |
| Bezug | Anforderungs-IDs aus der Anforderungsdokumentation v0.8 |
| Priorität | M = Must, S = Should, C = Could (Bedeutung siehe 2.2) |
| Verweise | „→ 3.x“ verweist auf eine fachliche Festlegung in Kapitel 3 |

---

## 2. Umfang von Version 1 und Priorisierung

### 2.1 Releasekriterium

Version 1.0 wird erst veröffentlicht, wenn **alle** User Stories dieser Spezifikation (Must, Should und Could) umgesetzt und abgenommen sind und alle Prüfkriterien aus Kapitel 5 erfüllt sind (Entscheidung E-10).

### 2.2 Bedeutung der MoSCoW-Stufen

Da es keinen festen Termin gibt (RB-06) und Version 1 erst mit dem vollen Umfang erscheint, steuert MoSCoW in diesem Projekt die **Reihenfolge der Umsetzung**, nicht den Umfang.

| Stufe | Bedeutung |
|---|---|
| Must | Kern. Ohne ihn ist die App am Spieleabend nicht sinnvoll nutzbar. Wird zuerst umgesetzt. |
| Should | Wichtig für das vorgesehene Erlebnis und den Alltag. Wird nach allen Must-Stories umgesetzt. |
| Could | Komfort und Feinschliff. Wird zuletzt umgesetzt. |
| Won't (V1) | Nicht Teil von Version 1. Entspricht dem Parkplatz (Anforderungsdokumentation, Kapitel 12). |

### 2.3 Umsetzungsinkremente

| Inkrement | Inhalt | Ergebnis |
|---|---|---|
| I1 Fundament | Personen, Gruppen, Farben, eigene Spiele, Brettdarstellung, Losbaustein | Stammdaten anlegbar, Brett sichtbar |
| I2 Generierung | Ablauf, Losschritte, Platzierung | Vollständige Generierung ohne Inszenierung, am Spieleabend testbar |
| I3 Ergebnisse und Statistik | Ergebniserfassung, Ergebnisliste, Kennzahlen, Rangliste | Langzeitstatistik nutzbar |
| I4 Daten und Updates | Vollsicherung und Export, Import mit Konflikten und Zuordnung, Sicherungspunkte, Update mit Sicherungsdialog, Installation unter iOS, Speicherschutz | Daten sicher und teilbar |
| I5 Erlebnis und Ausbau | Alle Should-Stories | Vorgesehenes Spielerlebnis |
| I6 Feinschliff | Alle Could-Stories | Kandidat für Release 1.0 |

Jedes Inkrement wird gemäß EP-03 bis EP-06 und EP-10 in Arbeitsbranches entwickelt, die jeweils ein Bündel zusammengehöriger User Stories enthalten (etwa zwei bis vier Bündel je Inkrement; der Zuschnitt wird zu Beginn eines Inkrements festgelegt), und vom Product Owner im Pull Request abgenommen (EP-11). Nach `main` gelangt vor Release 1.0 nur der Platzhalter aus der Setup-Phase (Release 0.1.0, EP-02); danach erst der abgenommene Stand von Release 1.0. Über Vorabversionen wird nach I2 entschieden (OP-13). *(präzisiert in 0.5)*

### 2.4 Abgrenzung: nicht in Version 1

Nicht Teil von Version 1 sind alle Punkte des Parkplatzes (Anforderungsdokumentation, PP-01 bis PP-19), insbesondere: weitere Catan-Modi und die vorausschauende Gültigkeit bei der Platzierung, Landschaften und Zahlenchips in der App, weitere Spiele mit Generierung, Synchronisation, gruppenübergreifende Statistik, Statistik nach Farbe, Spieldauer, Hellmodus, Englisch, kooperative Spiele, ein Protokoll der Ziehungen sowie die gruppenübergreifende Auswahl einzelner Partien beim Export. Ein Austausch per QR-Code ist nicht vorgesehen, auch nicht in späteren Versionen.

### 2.5 Übersicht aller User Stories

| ID | Titel | Prio | Inkrement |
|---|---|---|---|
| US-SP-01 | Spiel für die Generierung wählen | M | I2 |
| US-SP-02 | Eigenes Spiel anlegen | M | I1 |
| US-SP-03 | Unterstützte und eigene Spiele unterscheiden | S | I5 |
| US-SP-04 | Spielversion und Modus wählen | M | I2 |
| US-PG-01 | Person anlegen | M | I1 |
| US-PG-02 | Gruppe anlegen | M | I1 |
| US-PG-03 | Farben einer Gruppe festlegen | M | I1 |
| US-PG-04 | Catan-Farbe für eine Partie abweichend wählen | S | I5 |
| US-VW-01 | Person bearbeiten, archivieren und löschen | S | I5 |
| US-VW-02 | Gruppe bearbeiten | S | I5 |
| US-VW-03 | Gruppe archivieren, wiederbeleben und löschen | S | I5 |
| US-VW-04 | Eigenes Spiel bearbeiten, archivieren und löschen | S | I5 |
| US-AB-01 | Partie vorbereiten | M | I2 |
| US-AB-02 | Schritte einzeln bestätigen | M | I2 |
| US-AB-03 | Schritt wiederholen | M | I2 |
| US-AB-04 | Laufende Partie einsehen | M | I2 |
| US-AB-05 | Laufende Partie übersteht einen Neustart | M | I2 |
| US-AB-06 | Partie beenden | M | I2 |
| US-LS-01 | Person losen (wiederverwendbarer Baustein) | M | I1 |
| US-LS-02 | Landschaften, Häfen und Zahlenchips verlosen | M | I2 |
| US-LS-03 | Platzierungsreihenfolge losen | M | I2 |
| US-PL-01 | Brett darstellen | M | I1 |
| US-PL-02 | Gebäude zufällig platzieren | M | I2 |
| US-PL-03 | Straßen zufällig platzieren | M | I2 |
| US-PL-04 | Gebäude und Straßen erkennbar darstellen | M | I2 |
| US-PL-05 | Platzierung überspringen | C | I6 |
| US-SR-01 | Startrohstoffe ziehen | S | I5 |
| US-IN-01 | Glücksrad | S | I5 |
| US-IN-02 | Aufblinken bei der Platzierung | S | I5 |
| US-IN-03 | Soundeffekte und Tonschalter | S | I5 |
| US-IN-04 | Animation überspringen | S | I5 |
| US-ER-01 | Ergebnis erfassen | M | I3 |
| US-ER-02 | Siegpunkte erfassen | S | I5 |
| US-ER-03 | Catan-Farben im Ergebnis | C | I6 |
| US-ER-04 | Ergebnisse einer Gruppe ansehen | M | I3 |
| US-ER-05 | Ergebnis bearbeiten und löschen | M | I3 |
| US-ST-01 | Kennzahlen je Person | M | I3 |
| US-ST-02 | Rangliste | M | I3 |
| US-ST-03 | Statistik filtern | S | I5 |
| US-ST-04 | Diagramme | S | I5 |
| US-EI-01 | Vollsicherung exportieren | M | I4 |
| US-EI-02 | Teilumfang exportieren | S | I5 |
| US-EI-03 | Daten importieren | M | I4 |
| US-EI-04 | Konflikte beim Import im Einzelfall lösen | M | I4 |
| US-EI-05 | Importierte Daten vorhandenen Daten zuordnen | M | I4 |
| US-EI-06 | Import rückgängig machen | M | I4 |
| US-EI-07 | Export-Erinnerung | S | I5 |
| US-DS-01 | Automatische Sicherungspunkte | M | I4 |
| US-DS-02 | Sicherungspunkt wiederherstellen | M | I4 |
| US-DS-03 | Manuellen Sicherungspunkt anlegen | C | I6 |
| US-DS-04 | Hinweis zum Schutz vor Datenverlust | S | I5 |
| US-UP-01 | Update-Hinweis und selbstbestimmtes Update | M | I4 |
| US-UP-02 | Sicherung vor dem Update | M | I4 |
| US-IS-01 | Nutzung unter iOS nur als installierte App | M | I4 |
| US-IS-02 | Installationshinweis unter Android und Windows | S | I5 |
| US-IS-03 | Persistenten Speicher sicherstellen | M | I4 |
| US-GB-01 | Akzentfarbe wählen | C | I6 |

Summe: 57 User Stories (35 Must, 18 Should, 4 Could).

---

## 3. Fachliche Festlegungen

Dieses Kapitel bündelt die in der Spezifikationsphase geklärten fachlichen Regeln. Die Abnahmekriterien in Kapitel 4 verweisen darauf.

### 3.1 Ablauf der Generierung und Definition eines Schritts

**Ablauf (Catan, Modus „Standard“):**

| Nr. | Phase | Aktiv |
|---|---|---|
| 1 | Auswahl von Spiel und Gruppe | immer |
| 2 | Optionen: Spielversion, Modus, Losschritte, Startrohstoffe | immer |
| 3 | Farben der Partie prüfen und ggf. abweichend wählen | immer |
| 4 | LS-01: Wer legt die Landschaftsfelder aus? | abschaltbar, Standard an |
| 5 | LS-03: Wer legt die Häfen aus? | abschaltbar, Standard an |
| 6 | LS-04: Wer legt die Zahlenchips aus? | abschaltbar, Standard an |
| 7 | LS-02: Platzierungsreihenfolge | immer |
| 8 | Platzierung von Gebäuden und Straßen | immer, kann zu Beginn übersprungen werden |
| 9 | Startrohstoffe | abschaltbar, Standard aus |
| 10 | Abschluss: Übersicht der laufenden Partie | immer |

**Ein Schritt** ist die kleinste Einheit, die einzeln animiert, bestätigt und wiederholt wird:

- ein Dreh des Glücksrads (LS-01, LS-03 und LS-04 je ein Dreh; LS-02 besteht aus n−1 Drehs, der letzte Platz ergibt sich automatisch),
- ein Gebäude (Siedlung oder Stadt),
- eine Straße,
- die Startrohstoffe einer Person.

Beispiel: 4 Personen, Städte & Ritter, alle Optionen aktiv: 3 Losschritte + 3 Drehs für die Reihenfolge + 8 Gebäude + 8 Straßen + 4 Startrohstoff-Schritte = 26 Schritte.

**Abhängigkeiten bei Wiederholung:**

| Wiederholter Schritt | Verworfene Folgeschritte |
|---|---|
| LS-01, LS-03 oder LS-04 | keine |
| ein Dreh von LS-02 | die gesamte Reihenfolge wird neu gelost; die gesamte Platzierung wird verworfen |
| Gebäude k | Straße k sowie alle später platzierten Gebäude und Straßen |
| Straße k | keine |
| Startrohstoffe einer Person | keine |

Verworfene Schritte werden anschließend wieder Schritt für Schritt durchlaufen. Wiederholungen sind möglich, solange die Partie läuft (→ 3.5).

### 3.2 Platzierung und Sackgassen

Es gelten die Regeln aus Kapitel 6 der Anforderungsdokumentation. Ergänzend:

- **Sackgasse:** Bei 4 Personen kann die Platzierung einen Stand erreichen, in dem für ein weiteres Gebäude keine gültige Inlandkreuzung mehr existiert (Beispiel siehe Anforderungsdokumentation 6.2). Bei 2 und 3 Personen ist das ausgeschlossen.
- **Behandlung (Variante B, E-09):** Ein Durchlauf, der in eine Sackgasse führt, wird verworfen und neu gelost – ab Beginn der Platzierung bzw. ab dem wiederholten Gebäude. Bereits angezeigte und bestätigte Gebäude werden dabei nie zurückgenommen. Für Nutzer ist eine Sackgasse nie sichtbar.
- **Fairness:** Jede einzelne Ziehung ist gleichverteilt über alle gültigen Kreuzungen bzw. Kanten. Durch das Verwerfen von Sackgassen ist die Gesamtverteilung auf erfolgreiche Durchläufe bedingt; das wird bewusst in Kauf genommen. Die vorausschauende Gültigkeit (Variante A) ist als PP-14 geparkt.
- **Umsetzung:** Zu Beginn der Platzierung bzw. ab einem wiederholten Gebäude werden alle verbleibenden Gebäude verdeckt vorausberechnet und erst Schritt für Schritt angezeigt (Architektur, ADR-010).

### 3.3 Farbmodell

| Farbart | Palette | Gilt für | Eindeutigkeit |
|---|---|---|---|
| Catan-Farbe (Spielfarbe) | Rot, Blau, Weiß, Orange | Personen in Gruppen, die Catan spielen können (→ 3.4) | je Gruppe eindeutig |
| Gruppenfarbe | moderne, spielunabhängige Palette mit 12 Farben, enthält Töne für Rot, Blau, Weiß und Orange | Personen in allen Gruppen außer an Catan gebundenen | je Gruppe eindeutig |

Regeln:

1. Farben gelten ausschließlich innerhalb einer Gruppe. Eine Person kann in verschiedenen Gruppen verschiedene Farben haben.
2. In globalen Gruppen mit 2 bis 4 Personen hat jede Person eine Gruppenfarbe und eine Catan-Farbe. Beide dürfen derselbe Farbton sein.
3. In an Catan gebundenen Gruppen ist die Catan-Farbe zugleich die Gruppenfarbe.
4. In globalen Gruppen mit mehr als 4 Personen und in Gruppen, die an ein eigenes Spiel gebunden sind, gibt es nur die Gruppenfarbe.
5. Beim Anlegen einer Gruppe werden die Farben automatisch der Reihe nach mit freien Farben der Palette belegt und sind änderbar. Farben aus anderen Gruppen werden nicht übernommen oder vorgeschlagen.
6. Wählt man für eine Person eine Farbe, die in der Gruppe bzw. Partie bereits belegt ist, tauschen die beiden Personen ihre Farben.
7. Die Catan-Farbe kann für eine einzelne Partie abweichend gewählt werden; die Standardfarbe bleibt unverändert.
8. Verwendung: Catan-Farben auf dem Brett, im Glücksrad der Catan-Generierung und im Catan-Ergebnis; Gruppenfarben in Ergebnislisten, Rangliste und Diagrammen.
9. Konkrete Farbwerte werden in der Designphase festgelegt (OP-11).

### 3.4 Gruppen und Spiele: Verträglichkeit

| Gruppentyp | Erlaubte Spiele | Mitglieder |
|---|---|---|
| Global | alle Spiele; Catan nur bei 2 bis 4 Mitgliedern | 2 bis 12 |
| An Catan gebunden | nur Catan | 2 bis 4 |
| An ein eigenes Spiel gebunden | nur dieses Spiel | 2 bis 12 |

Die Mitglieder einer Gruppe sind nach dem Anlegen unveränderlich. Innerhalb einer Gruppe sind die Personennamen eindeutig (ohne Beachtung von Groß- und Kleinschreibung sowie von Leerzeichen am Anfang und Ende), damit Personen beim Import eindeutig zugeordnet werden können.

### 3.5 Lebenszyklus einer laufenden Partie

| Zustand | Beschreibung | Übergang |
|---|---|---|
| Keine | Es läuft keine Partie. | „Neue Partie“ startet die Vorbereitung. |
| Vorbereitung | Spiel, Gruppe, Optionen und Farben werden gewählt. | „Generierung starten“ |
| Generierung | Schritte werden nacheinander durchlaufen. | Letzter Schritt bestätigt |
| Laufend | Die Generierung ist abgeschlossen, die Übersicht bleibt einsehbar. | Ergebnis speichern oder „Beenden ohne Ergebnis“ |
| Beendet | Die Generierung wird verworfen, nur ein ggf. gespeichertes Ergebnis bleibt. | – |

- Es gibt höchstens eine Partie in den Zuständen Vorbereitung, Generierung oder Laufend.
- Generierung und Laufend überstehen das Schließen und Neustarten der App. Die Vorbereitung wird nicht gespeichert.
- Das Ergebnis eines Schritts wird gespeichert, bevor seine Animation beginnt. Wird die App während einer Animation beendet, wird diese nach dem Neustart mit demselben Ergebnis erneut abgespielt; danach wartet die App auf die Bestätigung.
- „Beenden ohne Ergebnis“ ist ab Beginn der Generierung jederzeit möglich.
- **Sperren:** Solange eine Partie in Generierung oder laufend ist, sind Import, Wiederherstellung eines Sicherungspunkts sowie Archivieren, Löschen und Ändern der Spielbindung der beteiligten Gruppe gesperrt. Die App nennt den Grund und bietet an, die Partie vorher zu beenden.

### 3.6 Ergebnis

| Feld | Pflicht | Regel |
|---|---|---|
| Datum | ja | Standard: heute |
| Uhrzeit | nein | Mit „Jetzt“ auf die aktuelle Uhrzeit setzbar |
| Gruppe | ja | Nur aktive Gruppen (nicht archiviert) |
| Spiel | ja | Nur mit der Gruppe verträgliche, aktive Spiele (→ 3.4) |
| Spielversion | bei Catan ja | Basisspiel oder Städte & Ritter |
| Modus | nein | Nur bei Catan; Standard „Standard“ |
| Sieger | ja | Mindestens eine Person; zwei oder mehr Personen bedeuten Unentschieden zwischen diesen |
| Catan-Farben | – | Nur bei Catan; vorbelegt aus der Partie bzw. den Standardfarben |
| Siegpunkte | nein | Nur bei Catan; für alle Beteiligten oder für keinen; ganze Zahlen ab 0 |
| Notizen | nein | Freitext |

Plausibilitätswarnungen (Speichern nach Bestätigung möglich): Ein Sieger hat nicht die höchste Punktzahl; bei Unentschieden haben die Sieger unterschiedliche Punktzahlen. Abgebrochene Partien ohne Sieger werden nicht erfasst.

### 3.7 Reihenfolge von Partien

Partien werden sortiert nach (1) Datum, (2) innerhalb eines Tages nach Uhrzeit, (3) Partien ohne Uhrzeit nach denen mit Uhrzeit, untereinander nach dem Zeitpunkt der Erfassung. Diese Reihenfolge bestimmt Ergebnislisten, Siegesserien und den Verlauf in Diagrammen.

### 3.8 Statistik-Kennzahlen

Alle Kennzahlen beziehen sich auf eine Gruppe und den aktuell gewählten Filter (→ US-ST-03).

| Kennzahl | Definition |
|---|---|
| Partien | Anzahl der Partien im Filter. Da stets alle Mitglieder beteiligt sind, ist sie für alle Personen gleich. |
| Siege | Anzahl der Partien, in denen die Person alleiniger Sieger ist |
| Siegquote | Siege ÷ Partien, in Prozent |
| Unentschieden | Anzahl der Partien, in denen die Person zu mehreren Siegern gehört |
| Aktuelle Siegesserie | Anzahl aufeinanderfolgender Siege bis einschließlich der letzten Partie |
| Längste Siegesserie | Größte Anzahl aufeinanderfolgender Siege |
| Durchschnittssiegpunkte | Mittelwert der Siegpunkte über alle Partien mit erfassten Siegpunkten; nur bei Catan; ohne Daten „–“ |

Niederlagen und Unentschieden beenden eine Siegesserie.

**Rangliste:** Das Sortierkriterium ist manuell wählbar: Siege (Standard), Unentschieden, Durchschnittssiegpunkte (nur bei Catan-Filter), aktuelle Siegesserie, längste Siegesserie. Bei Gleichstand im gewählten Kriterium entscheiden nacheinander Siege, Unentschieden und Durchschnittssiegpunkte. Bei vollständigem Gleichstand teilen sich Personen einen Rang. Siegquote und Siege ergeben in einer Gruppe stets dieselbe Reihenfolge und sind deshalb kein eigenes Kriterium.

### 3.9 Kennungen, Export und Import

**Kennungen:** Jeder Datensatz (Person, Gruppe, Spiel, Partie) erhält bei seiner Anlage eine zufällig erzeugte, weltweit eindeutige Kennung. Zwei unabhängig angelegte Datensätze haben daher nie dieselbe Kennung – auch nicht, wenn zwei Personen auf ihren Geräten Partien desselben Abends erfassen. Dieselbe Kennung auf zwei Geräten entsteht nur, wenn ein Datensatz per Export und Import übertragen wurde. Catan hat eine fest eingebaute Kennung, die auf allen Geräten gleich ist.

**Exportumfang:** Vollsicherung; eine oder mehrere Gruppen (mit allen ihren Partien); ein oder mehrere Spiele (mit allen Partien dieser Spiele über alle Gruppen); frei ausgewählte einzelne Partien einer Gruppe (z. B. fünf bestimmte Partien), über eine nach Spiel filterbare Liste der Partien dieser Gruppe. Benötigte Personen, Gruppen und Spiele werden automatisch mit exportiert.

**Vollsicherung:** Enthält alle Personen, Gruppen, eigenen Spiele, Partien und Ergebnisse sowie die Einstellungen (Ton, Akzentfarbe) und den Stand von Hinweisen und Erinnerungen. Nicht enthalten sind Sicherungspunkte und eine laufende Partie. Teilexporte enthalten keine Einstellungen.

**Austausch:** Das Format ist JSON. Exportdateien werden über das Teilen-Menü des Systems weitergegeben oder, wo dieses fehlt, heruntergeladen; der Dateiname nennt Datum und Umfang. Importiert wird über die Dateiauswahl. Einen Austausch per QR-Code gibt es nicht.

**Konfliktfälle beim Import:**

| Fall | Situation | Typisches Beispiel | Optionen |
|---|---|---|---|
| K1 | Gleiche Kennung, gleicher Inhalt | Dieselbe Partie wird erneut importiert | Kein Konflikt, wird übersprungen |
| K2 | Gleiche Kennung, anderer Inhalt (ohne Archivstatus, nach Anwendung der Zuordnungen) | Ein übertragenes Ergebnis wurde auf einem Gerät nachträglich korrigiert | „Meine behalten“ oder „Importierte übernehmen“; die Unterschiede werden angezeigt |
| K3 | Unbekannte Kennung bei Gruppe, Person oder eigenem Spiel | Freunde haben dieselbe Gruppe auf ihrem Gerät selbst angelegt | „Vorhandenem zuordnen“ (manuelle Auswahl ohne Vorbelegung) oder „Neu anlegen“ |
| K4 | Unbekannte Kennung bei einer Partie, aber gleiche Gruppe, gleiches Spiel, gleiches Datum und gleiche Sieger | Zwei Personen haben dieselbe Partie unabhängig erfasst | „Beide behalten“ oder „Importierte überspringen“ |

Regeln:

1. Jeder Konflikt wird einzeln entschieden; eine Sammelentscheidung wird nicht angeboten.
2. Bei K3 für eine Gruppe ist eine Zuordnung nur zu einer Gruppe mit gleicher Mitgliederzahl und verträglicher Spielbindung möglich. Anschließend wird jede importierte Person genau einem Mitglied der Zielgruppe zugeordnet.
3. Zuordnungen werden bei jedem Import manuell getroffen. Die App belegt keine Auswahl vor, weder aus früheren Importen noch aufgrund gleicher Namen, und speichert keine Zuordnungen. Eine fehlerhafte Zuordnung wird behoben, indem der Import rückgängig gemacht wird (Sicherungspunkt vor dem Import).
4. Ein Import fügt nur hinzu oder aktualisiert. Er löscht nie lokale Daten.
5. Wird der Import vor Abschluss abgebrochen, bleibt der Datenbestand unverändert.
6. Das Exportformat ist versioniert. Exporte älterer Formatversionen werden übernommen; Exporte neuerer Formatversionen werden mit dem Hinweis abgelehnt, die App zu aktualisieren. Eine fehlerhafte oder unvollständige Datei wird vollständig abgelehnt.
7. Der Archivstatus zählt beim Vergleich nicht zum Inhalt. Bei vorhandenen Datensätzen bleibt der lokale Archivstatus erhalten; neu angelegte Datensätze übernehmen den Status aus der Datei.
8. Importierte Partien behalten ihre Kennung. Bei einem erneuten Import werden sie nach Anwendung der neu getroffenen Zuordnungen verglichen; bei gleicher Zuordnung ergibt sich K1, bei abweichender K2.
9. Würde eine Option eine Regel verletzen (z. B. doppelte Personennamen in einer Gruppe, eine Spielbindung, die nicht zu den Partien passt, oder die Zuordnung zweier importierter Personen zu gleichnamigen Personen), wird sie deaktiviert und mit Begründung angezeigt. Mindestens eine zulässige Option („Meine behalten“ bzw. „Neu anlegen“) bleibt stets verfügbar.
10. Enthält die Datei Einstellungen, fragt die App einmal, ob sie übernommen werden sollen. In einen leeren Datenbestand werden alle Datensätze ohne Rückfrage mit ihren Kennungen übernommen.
11. Der Sicherungspunkt „Vor Import“ wird unmittelbar vor der Übernahme angelegt, nachdem alle Entscheidungen getroffen sind. Ein abgebrochener Import erzeugt keinen Sicherungspunkt und erscheint nicht in der Liste der letzten Importe.
12. Während einer laufenden Partie ist der Import gesperrt (→ 3.5).

**Rückgängig:** Ein Import wird rückgängig gemacht, indem der vor ihm angelegte Sicherungspunkt wiederhergestellt wird. Möglich für die letzten 3 Importe. Alle Änderungen nach dem Import gehen dabei verloren; darauf wird vorher gewarnt.

### 3.10 Sicherungspunkte

| Auslöser | Anlass im Verlauf |
|---|---|
| Vor jedem Import | „Vor Import“ |
| Vor jeder Wiederherstellung eines Sicherungspunkts | „Vor Wiederherstellung“ |
| Vor jedem Löschen von Person, Gruppe, Spiel oder Ergebnis | „Vor Löschen“ |
| Vor jedem Update, unmittelbar vor dem Wechsel auf die neue Version | „Vor Update“ |
| Beim ersten Start oder der ersten Rückkehr der App in den Vordergrund an einem Kalendertag, sofern sich seit dem letzten Sicherungspunkt etwas geändert hat | „Täglich“ |
| Manuell durch den Nutzer | „Manuell“ |

Es werden höchstens 15 Sicherungspunkte aufbewahrt. Bei Überschreitung wird der älteste entfernt; ausgenommen sind die Sicherungspunkte der letzten 3 Importe. Sicherungspunkte liegen auf dem Gerät und schützen nicht vor Deinstallation, Gerätewechsel oder Defekt.

Sicherungspunkte umfassen Personen, Gruppen, eigene Spiele, Partien und Ergebnisse, aber keine Einstellungen und keine laufende Partie. Eine Wiederherstellung lässt die Einstellungen unverändert. Während einer laufenden Partie ist die Wiederherstellung gesperrt (→ 3.5). Die Liste der letzten 3 Importe (US-EI-06) ergibt sich aus den Sicherungspunkten „Vor Import“.

### 3.11 Export-Erinnerung

Die Erinnerung erscheint, wenn seit der letzten Vollsicherung Daten geändert wurden **und** entweder die letzte Vollsicherung (bzw. die erste Datenanlage) mehr als 30 Tage zurückliegt oder seitdem mindestens 10 neue Ergebnisse erfasst wurden. Sie erscheint als kleines Banner auf dem Startbildschirm mit „Jetzt sichern“ und „Später“. „Später“ blendet sie für 7 Tage aus. Nur eine Vollsicherung setzt die Erinnerung zurück, Teilexporte nicht.

### 3.12 Updates

| Nr. | Ablauf |
|---|---|
| 1 | Die App prüft beim Start und bei der Rückkehr in den Vordergrund, ob eine neue Version verfügbar ist (nur mit Internetverbindung). Die neue Version wird im Hintergrund geladen, aber nicht aktiv. |
| 2 | Ist keine Partie in Vorbereitung, Generierung oder laufend, zeigt die App einen unaufdringlichen Hinweis mit „Jetzt aktualisieren“. |
| 3 | „Jetzt aktualisieren“ öffnet immer den Sicherungsdialog mit dem Datum der letzten Vollsicherung und der Anzahl der seitdem erfassten Ergebnisse bzw. dem Hinweis, dass es keine Änderungen gab. Optionen: „Sichern und aktualisieren“, „Ohne Sicherung aktualisieren“, „Abbrechen“. |
| 4 | Vor dem Wechsel legt die App den Sicherungspunkt „Vor Update“ an. Anschließend wird die neue Version aktiv, und notwendige Datenmigrationen laufen beim ersten Start. |

Eine neue Version wird nie ohne diese Bestätigung aktiv, auch nicht nach einem vollständigen Neustart der App.

### 3.13 Installation und Speicherschutz

| Plattform | Nutzung im Browser-Tab | Installierte App |
|---|---|---|
| iOS und iPadOS | Nicht möglich. In Safari erscheint ausschließlich eine bebilderte Installationsanleitung („Teilen“ → „Zum Home-Bildschirm“), in anderen Browsern der Hinweis, die Seite in Safari zu öffnen. | Volle Nutzung |
| Android, Windows | Volle Nutzung mit wegklickbarem Installationshinweis; Browser-Tab und installierte App teilen dieselben Daten. | Volle Nutzung |

Die App fordert beim Start persistenten Speicher an. Der Status erscheint im Bereich „Sicherung“. Ist er nicht gewährt, erscheint eine deutliche Warnung mit möglichen Ursachen, etwa einer Browsereinstellung, die Websitedaten beim Schließen löscht.

---

## 4. User Stories

### 4.1 Spiele (SP)

#### US-SP-01 Spiel für die Generierung wählen · M
Als bedienende Person möchte ich zu Beginn einer Partie das Spiel auswählen, damit die passende Generierung startet.
Bezug: FA-SP-01, FA-AB-01

- **AK-1:** Gegeben die Startansicht, wenn ich „Neue Partie“ wähle, dann zeigt die App alle unterstützten Spiele zur Auswahl; in Version 1 ist das Catan.
- **AK-2:** Gegeben die Spielauswahl für eine neue Partie, dann erscheinen eigene Spiele dort nicht.

#### US-SP-02 Eigenes Spiel anlegen · M
Als Nutzer möchte ich eigene Spiele wie Uno anlegen, damit ich auch deren Ergebnisse erfassen kann.
Bezug: FA-SP-02, FA-SP-05

- **AK-1:** Gegeben die Spieleverwaltung, wenn ich einen Namen eingebe und speichere, dann erscheint das Spiel im Bereich „Eigene Spiele“.
- **AK-2:** Gegeben ein Spiel mit gleichem Namen existiert bereits (ohne Beachtung der Groß- und Kleinschreibung, einschließlich Catan), wenn ich speichere, dann weist die App darauf hin und speichert nicht.
- **AK-3:** Gegeben ein eigenes Spiel, wenn ich dafür ein Ergebnis erfasse, dann gibt es keine Felder für Spielversion, Modus, Farben oder Siegpunkte.

#### US-SP-03 Unterstützte und eigene Spiele unterscheiden · S
Als Nutzer möchte ich unterstützte und eigene Spiele klar getrennt sehen, damit ich weiß, wofür die App eine Generierung anbietet.
Bezug: FA-SP-03

- **AK-1:** Gegeben die Spieleliste, dann sind die Bereiche „Unterstützte Spiele“ und „Eigene Spiele“ getrennt dargestellt und beschriftet.

#### US-SP-04 Spielversion und Modus wählen · M
Als bedienende Person möchte ich Spielversion und Modus festlegen, damit die Generierung den passenden Regeln folgt.
Bezug: FA-SP-04, FA-AB-02

- **AK-1:** Gegeben die Optionen einer Catan-Partie, dann kann ich zwischen „Basisspiel“ (vorausgewählt) und „Städte & Ritter“ wählen.
- **AK-2:** Gegeben die Optionen einer Catan-Partie, dann ist der Modus „Standard“ vorausgewählt und in Version 1 die einzige Option.

### 4.2 Personen und Gruppen (PG)

#### US-PG-01 Person anlegen · M
Als Nutzer möchte ich Personen anlegen, damit ich sie Gruppen zuordnen kann.
Bezug: FA-PG-01

- **AK-1:** Gegeben die Personenverwaltung, wenn ich einen Namen eingebe und speichere, dann erscheint die Person in der Personenliste.
- **AK-2:** Gegeben ein leerer Name, wenn ich speichern will, dann ist das nicht möglich.
- **AK-3:** Gegeben eine Person mit gleichem Namen existiert bereits, wenn ich speichere, dann weist die App darauf hin und lässt das Speichern nach Bestätigung zu. In eine gemeinsame Gruppe können gleichnamige Personen nicht aufgenommen werden (→ 3.4).

#### US-PG-02 Gruppe anlegen · M
Als Nutzer möchte ich Gruppen mit fester Zusammensetzung anlegen, damit Statistiken vergleichbar bleiben.
Bezug: FA-PG-02, FA-PG-03, FA-PG-04, FA-PG-09, FA-PG-10 → 3.4

- **AK-1:** Gegeben mindestens zwei Personen, wenn ich 2 bis 12 Mitglieder auswähle, eine Bindung (global oder genau ein Spiel) festlege und speichere, dann ist die Gruppe angelegt.
- **AK-2:** Gegeben ich habe Mitglieder ausgewählt, dann schlägt die App einen Gruppennamen aus den Vornamen der Mitglieder vor, den ich ändern kann. Der Name ist Pflicht.
- **AK-3:** Gegeben weniger als 2 oder mehr als 12 Mitglieder, wenn ich speichern will, dann ist das nicht möglich.
- **AK-4:** Gegeben mehr als 4 Mitglieder, dann ist die Bindung an Catan nicht wählbar und die App nennt den Grund.
- **AK-5:** Gegeben eine Person gehört bereits einer Gruppe an, wenn ich sie einer weiteren Gruppe hinzufüge, dann ist das zulässig.
- **AK-6:** Gegeben zwei ausgewählte Personen haben denselben Namen (ohne Beachtung von Groß- und Kleinschreibung), wenn ich speichern will, dann verhindert die App das und nennt die betroffenen Personen.

#### US-PG-03 Farben einer Gruppe festlegen · M
Als Nutzer möchte ich jeder Person in einer Gruppe Farben zuweisen, damit sie auf dem Brett und in Statistiken erkennbar ist.
Bezug: FA-PG-05, FA-PG-07, FA-PG-08, FA-SP-05 → 3.3

- **AK-1:** Gegeben ich lege eine Gruppe an, dann sind die Farben automatisch der Reihe nach mit freien Farben belegt, ohne Übernahme aus anderen Gruppen.
- **AK-2:** Gegeben eine globale Gruppe mit 2 bis 4 Mitgliedern, dann hat jede Person eine Gruppenfarbe und eine Catan-Farbe, und beide dürfen derselbe Farbton sein.
- **AK-3:** Gegeben eine an Catan gebundene Gruppe, dann hat jede Person nur eine Catan-Farbe, die zugleich als Gruppenfarbe dient.
- **AK-4:** Gegeben eine an ein eigenes Spiel gebundene Gruppe oder eine globale Gruppe mit mehr als 4 Mitgliedern, dann hat jede Person nur eine Gruppenfarbe.
- **AK-5:** Gegeben Person A hat Rot, wenn ich Person B Rot zuweise, dann erhält A die bisherige Farbe von B.

#### US-PG-04 Catan-Farbe für eine Partie abweichend wählen · S
Als bedienende Person möchte ich für eine einzelne Partie andere Farben vergeben, damit die App zu den heute tatsächlich genutzten Spielfiguren passt.
Bezug: FA-PG-06

- **AK-1:** Gegeben die Vorbereitung einer Catan-Partie, wenn ich die Catan-Farbe einer Person ändere, dann gilt sie nur für diese Partie und die Standardfarbe in der Gruppe bleibt unverändert.
- **AK-2:** Gegeben die gewählte Farbe ist in der Partie bereits belegt, dann tauschen die beiden Personen für diese Partie ihre Farben.

### 4.3 Verwaltung (VW)

#### US-VW-01 Person bearbeiten, archivieren und löschen · S
Als Nutzer möchte ich Personen umbenennen, archivieren und löschen, damit meine Personenliste aktuell bleibt.
Bezug: FA-VW-01, FA-VW-05, FA-PG-09

- **AK-1:** Gegeben eine Person, wenn ich sie umbenenne, dann erscheint der neue Name überall, auch in bestehenden Ergebnissen und Statistiken.
- **AK-2:** Gegeben eine Person ist Mitglied mindestens einer Gruppe (auch einer archivierten), wenn ich sie löschen will, dann verhindert die App das und nennt die betroffenen Gruppen.
- **AK-3:** Gegeben eine Person ohne Gruppenzugehörigkeit, wenn ich sie lösche und die Warnung bestätige, dann wird zuvor ein Sicherungspunkt angelegt und die Person entfernt.
- **AK-4:** Gegeben eine Person, wenn ich sie archiviere, dann erscheint sie nicht mehr in der Auswahl für neue Gruppen; bestehende Gruppen, Ergebnisse und Statistiken bleiben unverändert. Ich kann sie jederzeit reaktivieren.
- **AK-5:** Gegeben der neue Name gleicht dem Namen eines anderen Mitglieds einer ihrer Gruppen, wenn ich umbenenne, dann verhindert die App das und nennt die betroffene Gruppe.

#### US-VW-02 Gruppe bearbeiten · S
Als Nutzer möchte ich Name, Farben und Spielbindung einer Gruppe ändern können, damit sie zur Realität passt.
Bezug: FA-VW-02 → 3.3, 3.4

- **AK-1:** Gegeben eine Gruppe, dann kann ich Namen und Farben ändern.
- **AK-2:** Gegeben eine Gruppe, dann bietet die App keine Möglichkeit, Mitglieder hinzuzufügen oder zu entfernen.
- **AK-3:** Gegeben ich ändere die Spielbindung, wenn alle bestehenden Partien und die Mitgliederzahl zur neuen Bindung passen, dann wird die Änderung übernommen; andernfalls verhindert die App sie und nennt den Grund.
- **AK-4:** Gegeben die neue Bindung erfordert zusätzliche Farben, dann werden diese gemäß 3.3 automatisch belegt und sind änderbar.
- **AK-5:** Gegeben die Gruppe ist an einer Partie in Generierung oder laufend beteiligt, dann ist die Änderung der Spielbindung gesperrt (→ 3.5).

#### US-VW-03 Gruppe archivieren, wiederbeleben und löschen · S
Als Nutzer möchte ich nicht mehr aktive Gruppen archivieren und bei Bedarf wiederbeleben oder endgültig löschen, damit die Übersicht aufgeräumt bleibt, ohne Statistik zu verlieren.
Bezug: FA-VW-03, FA-VW-05

- **AK-1:** Gegeben eine aktive Gruppe, wenn ich sie archiviere, dann erscheint sie nicht mehr in der Auswahl für neue Partien und Ergebnisse; ihre Partien und Statistik bleiben im Bereich „Archiv“ einsehbar.
- **AK-2:** Gegeben eine archivierte Gruppe, wenn ich sie wiederbelebe, dann ist sie wieder normal nutzbar.
- **AK-3:** Gegeben eine aktive oder archivierte Gruppe, wenn ich „Löschen“ wähle, dann erscheint eine deutliche Warnung mit der Anzahl der betroffenen Partien.
- **AK-4:** Gegeben ich bestätige das Löschen, dann wird zuvor ein Sicherungspunkt angelegt, und die Gruppe wird mit allen ihren Partien entfernt; die Personen bleiben erhalten.
- **AK-5:** Gegeben die Gruppe ist an einer Partie in Generierung oder laufend beteiligt, dann sind Archivieren und Löschen gesperrt (→ 3.5).

#### US-VW-04 Eigenes Spiel bearbeiten, archivieren und löschen · S
Als Nutzer möchte ich eigene Spiele umbenennen, archivieren und löschen können, damit die Spieleliste übersichtlich bleibt.
Bezug: FA-VW-04, FA-VW-05

- **AK-1:** Gegeben ein eigenes Spiel, dann kann ich es umbenennen (eindeutiger Name wie in US-SP-02).
- **AK-2:** Gegeben ein eigenes Spiel ohne Ergebnisse, wenn ich es lösche und bestätige, dann wird zuvor ein Sicherungspunkt angelegt und das Spiel entfernt.
- **AK-3:** Gegeben ein eigenes Spiel mit Ergebnissen, wenn ich es löschen will, dann verhindert die App das und bietet stattdessen das Archivieren an.
- **AK-4:** Gegeben ein archiviertes Spiel, dann erscheint es nicht in der Auswahl für neue Ergebnisse oder Gruppen; bestehende Daten und Statistiken bleiben erhalten, und ich kann es reaktivieren.
- **AK-5:** Gegeben Catan, dann gibt es weder Umbenennen noch Archivieren noch Löschen.

### 4.4 Ablauf einer Partie (AB)

#### US-AB-01 Partie vorbereiten · M
Als bedienende Person möchte ich Gruppe und Optionen festlegen, bevor die Generierung beginnt, damit sie zu unserem Abend passt.
Bezug: FA-AB-01, FA-AB-02, FA-PG-10 → 3.1, 3.4

- **AK-1:** Gegeben ich habe Catan gewählt, dann zeigt die App nur aktive Gruppen, die Catan spielen können (globale Gruppen mit 2 bis 4 Mitgliedern und an Catan gebundene Gruppen).
- **AK-2:** Gegeben ich habe eine Gruppe gewählt, dann zeigt die App alle Mitglieder als Beteiligte an; eine Abwahl einzelner Mitglieder ist nicht möglich.
- **AK-3:** Gegeben die Optionen, dann kann ich LS-01, LS-03 und LS-04 einzeln an- und abschalten (Standard: an); LS-02 wird als immer aktiv angezeigt.
- **AK-4:** Gegeben die Optionen, dann kann ich die Startrohstoffe aktivieren (Standard: aus) und dabei die Anzahl von 1 bis 5 (Standard: 2) sowie „mit Zurücklegen“ (Standard) oder „ohne Zurücklegen“ einstellen.
- **AK-5:** Gegeben ich starte die Generierung, dann laufen die aktiven Phasen in der Reihenfolge aus 3.1 ab.

#### US-AB-02 Schritte einzeln bestätigen · M
Als bedienende Person möchte ich jeden Schritt selbst bestätigen, damit alle am Tisch jedes Ergebnis sehen und umsetzen können.
Bezug: FA-AB-03 → 3.1

- **AK-1:** Gegeben ein Schritt ist abgeschlossen, dann bleibt sein Ergebnis sichtbar, bis ich „Weiter“ wähle; es gibt keinen automatischen Übergang.
- **AK-2:** Gegeben die Platzierung, dann ist jedes Gebäude und jede Straße ein eigener Schritt mit eigener Animation und eigener Bestätigung.

#### US-AB-03 Schritt wiederholen · M
Als bedienende Person möchte ich einen Schritt wiederholen können, damit Fehler oder Missverständnisse am Tisch korrigierbar sind.
Bezug: FA-AB-04 → 3.1

- **AK-1:** Gegeben ein abgeschlossener Schritt, wenn ich „Wiederholen“ wähle, dann erscheint eine Warnung; nach Bestätigung wird der Schritt neu gelost und neu dargestellt.
- **AK-2:** Gegeben der Schritt hat abhängige Folgeschritte gemäß 3.1, dann nennt die Warnung, welche Schritte verworfen werden.
- **AK-3:** Gegeben ich wiederhole LS-01, LS-03, LS-04, eine Straße oder die Startrohstoffe einer Person, dann bleiben alle anderen Schritte unverändert.
- **AK-4:** Gegeben ich wiederhole Gebäude k, dann werden Straße k und alle späteren Gebäude und Straßen verworfen und anschließend Schritt für Schritt neu durchlaufen.
- **AK-5:** Gegeben ich wiederhole einen Dreh von LS-02, dann wird die gesamte Reihenfolge neu gelost und eine bereits begonnene Platzierung verworfen.
- **AK-6:** Gegeben die Generierung ist abgeschlossen, dann kann ich in der Übersicht der laufenden Partie jeden Schritt auswählen und wiederholen.
- **AK-7:** Gegeben eine Wiederholung, dann wird sie nirgends protokolliert.

#### US-AB-04 Laufende Partie einsehen · M
Als bedienende Person möchte ich das Ergebnis der Generierung während der Partie jederzeit einsehen, damit wir bei Unklarheiten nachschauen können.
Bezug: FA-AB-05

- **AK-1:** Gegeben die Generierung ist abgeschlossen, dann zeigt eine Übersicht das Brett mit allen Gebäuden und Straßen, die Ergebnisse von LS-01, LS-03 und LS-04, die Platzierungsreihenfolge mit Kennzeichnung der Startperson und ggf. die Startrohstoffe.
- **AK-2:** Gegeben eine laufende Partie, wenn ich die Startansicht öffne, dann gelange ich mit einem Tipp zurück zur Übersicht.

#### US-AB-05 Laufende Partie übersteht einen Neustart · M
Als bedienende Person möchte ich, dass die laufende Partie erhalten bleibt, auch wenn die App geschlossen wird, damit nichts verloren geht.
Bezug: FA-AB-07 → 3.5

- **AK-1:** Gegeben eine Partie in Generierung oder laufend, wenn die App geschlossen und neu gestartet wird, dann öffnet sie exakt denselben Stand einschließlich des aktuellen Schritts.
- **AK-2:** Gegeben eine laufende Partie, wenn ich eine neue Partie starten will, dann fragt die App, ob die laufende ohne Ergebnis beendet werden soll, oder kehrt auf Wunsch zu ihr zurück.
- **AK-3:** Gegeben die App wird während der Animation eines Schritts beendet, wenn sie neu startet, dann wird die Animation mit demselben Ergebnis erneut abgespielt, und der Schritt wartet auf Bestätigung.

#### US-AB-06 Partie beenden · M
Als bedienende Person möchte ich eine Partie mit oder ohne Ergebnis beenden, damit die App für die nächste Partie bereit ist.
Bezug: FA-AB-06, FA-AB-08 → 3.5

- **AK-1:** Gegeben die Übersicht der laufenden Partie, dann gibt es „Ergebnis eintragen“ und „Partie beenden ohne Ergebnis“.
- **AK-2:** Gegeben ich wähle „Ergebnis eintragen“, dann ist das Formular mit Spiel, Gruppe, Spielversion, Modus, den Catan-Farben der Partie und dem heutigen Datum vorbelegt; nach dem Speichern ist die Partie beendet.
- **AK-3:** Gegeben die Generierung läuft oder ist abgeschlossen, wenn ich „Partie beenden ohne Ergebnis“ wähle und bestätige, dann wird die Generierung verworfen und nichts gespeichert.
- **AK-4:** Gegeben eine Partie ist beendet, dann ist ihre Generierung nicht mehr abrufbar.

### 4.5 Losschritte (LS)

#### US-LS-01 Person losen (wiederverwendbarer Baustein) · M
Als Spielende möchten wir, dass Personen fair gelost werden, damit niemand bevorzugt wird.
Bezug: FA-LS-05, FA-LS-06, NFA-ZF-01, NFA-ZF-02

- **AK-1:** Gegeben eine Menge von n Personen, wenn eine Person gelost wird, dann hat jede Person die Wahrscheinlichkeit 1/n (Nachweis durch automatisierte Tests, siehe Kapitel 5).
- **AK-2:** Gegeben der Baustein, dann ist er ohne Abhängigkeit von Catan nutzbar (Nachweis durch automatisierte Tests mit beliebigen Personenmengen).
- **AK-3:** Gegeben LS-01, LS-03 und LS-04, dann sind die Ziehungen unabhängig; dieselbe Person kann mehrfach gelost werden.

#### US-LS-02 Landschaften, Häfen und Zahlenchips verlosen · M
Als bedienende Person möchte ich losen lassen, wer welchen Teil des Bretts aufbaut, damit der Aufbau fair verteilt ist.
Bezug: FA-LS-01, FA-LS-03, FA-LS-04 → 3.1

- **AK-1:** Gegeben die Losschritte sind aktiv, dann werden sie in der Reihenfolge LS-01, LS-03, LS-04 als je ein Schritt ausgeführt.
- **AK-2:** Gegeben ein Ergebnis, dann wird es als klarer Satz angezeigt, z. B. „Anna legt die Landschaftsfelder aus.“
- **AK-3:** Gegeben ein Losschritt ist deaktiviert, dann wird er übersprungen und nicht angezeigt.

#### US-LS-03 Platzierungsreihenfolge losen · M
Als Spielende möchten wir eine zufällige Platzierungsreihenfolge, damit niemand dauerhaft den Vorteil des ersten Zugs hat.
Bezug: FA-LS-02 → 3.1

- **AK-1:** Gegeben die Generierung, dann wird LS-02 immer nach LS-04 ausgeführt.
- **AK-2:** Gegeben n Personen, dann wird die Reihenfolge in n−1 Drehs aus den jeweils verbleibenden Personen gelost; der letzte Platz ergibt sich automatisch.
- **AK-3:** Gegeben die Reihenfolge steht fest, dann ist die Person auf Platz 1 als Startperson des Spiels gekennzeichnet.
- **AK-4:** Gegeben n Personen, dann ist jede der n! Reihenfolgen gleich wahrscheinlich (Nachweis durch automatisierte Tests).

### 4.6 Platzierung (PL)

#### US-PL-01 Brett darstellen · M
Als bedienende Person möchte ich ein Brett sehen, das wie unser physisches Brett ausgerichtet ist, damit ich Positionen direkt übertragen kann.
Bezug: FA-PL-07, FA-PL-08, NFA-GB-06, NFA-PL-04

- **AK-1:** Gegeben die Platzierung, dann zeigt die App 19 Felder mit nach oben zeigender Spitze in Reihen zu 3, 4, 5, 4 und 3 Feldern; der Umriss ist oben und unten gerade und links und rechts spitz.
- **AK-2:** Gegeben die Darstellung, dann tragen die Felder keine Landschaften oder Zahlen und es werden keine Original-Grafiken des Spiels verwendet.
- **AK-3:** Gegeben Hoch- oder Querformat auf Smartphone oder Tablet, dann ist das Brett vollständig sichtbar und behält seine Ausrichtung.

#### US-PL-02 Gebäude zufällig platzieren · M
Als Spielende möchten wir, dass die App unsere Startgebäude regelkonform und fair platziert, damit niemand die besten Plätze wählen kann.
Bezug: FA-PL-01 bis FA-PL-04, Anforderungsdokumentation Kapitel 6.2 und 6.4 → 3.2

- **AK-1:** Gegeben die Platzierungsreihenfolge P1 … Pn, dann wird in der Reihenfolge P1 … Pn, Pn … P1 platziert.
- **AK-2:** Gegeben das Basisspiel, dann erhält jede Person zwei Siedlungen; gegeben Städte & Ritter, dann erhält jede Person in der Vorwärtsrunde eine Siedlung und in der Rückwärtsrunde eine Stadt.
- **AK-3:** Gegeben ein neues Gebäude, dann steht es auf einer Inlandkreuzung, die an keine Kreuzung mit bestehendem Gebäude angrenzt, und jede solche Kreuzung hatte bei dieser Ziehung dieselbe Wahrscheinlichkeit.
- **AK-4:** Gegeben 4 Personen, dann werden immer alle 8 Gebäude regelkonform gesetzt, ohne dass ein bereits angezeigtes Gebäude zurückgenommen oder eine Sackgasse sichtbar wird.

#### US-PL-03 Straßen zufällig platzieren · M
Als Spielende möchten wir, dass auch die Straßen zufällig gesetzt werden, damit der gesamte Startaufbau fair ist.
Bezug: FA-PL-01, Anforderungsdokumentation Kapitel 6.3

- **AK-1:** Gegeben ein soeben gesetztes Gebäude, dann folgt als eigener Schritt eine Straße an einer der an dieses Gebäude angrenzenden Kanten, jede mit gleicher Wahrscheinlichkeit.
- **AK-2:** Gegeben eine Straße, dann gelten keine weiteren Einschränkungen gemäß 6.3; sie darf an Straßen und Gebäude anderer Personen angrenzen.

#### US-PL-04 Gebäude und Straßen erkennbar darstellen · M
Als Spielende möchten wir Gebäude und Straßen auf einen Blick zuordnen können, damit der Aufbau am Tisch schnell geht.
Bezug: FA-PL-05, FA-PL-06

- **AK-1:** Gegeben ein Gebäude oder eine Straße, dann wird es in der Catan-Farbe der jeweiligen Person für diese Partie dargestellt.
- **AK-2:** Gegeben eine Siedlung und eine Stadt, dann unterscheiden sie sich durch ihre Form, nicht nur durch Größe oder Farbe.
- **AK-3:** Gegeben die Farbe Weiß auf dem dunklen Hintergrund, dann bleiben Gebäude und Straßen durch eine Kontur klar erkennbar.

#### US-PL-05 Platzierung überspringen · C
Als bedienende Person möchte ich die Platzierung ausnahmsweise überspringen können, damit wir die App auch nutzen können, wenn wir einmal selbst wählen wollen.
Bezug: FA-PL-09

- **AK-1:** Gegeben der Beginn der Platzierung, dann gibt es einen kleinen, unauffälligen Button „Platzierung überspringen“.
- **AK-2:** Gegeben ich bestätige das Überspringen, dann geht es mit den Startrohstoffen (falls aktiv) oder mit dem Abschluss weiter; die Übersicht zeigt Reihenfolge und Startperson, aber keine Gebäude.

### 4.7 Startrohstoffe (SR)

#### US-SR-01 Startrohstoffe ziehen · S
Als Spielende möchten wir auf Wunsch zufällige Startrohstoffe erhalten, damit der Spielbeginn abwechslungsreicher wird.
Bezug: FA-SR-01 bis FA-SR-04

- **AK-1:** Gegeben die Option ist aktiv, dann werden die Startrohstoffe nach der Platzierung (bzw. nach LS-02, falls die Platzierung übersprungen wurde) gezogen, je Person ein Schritt in Platzierungsreihenfolge.
- **AK-2:** Gegeben die eingestellte Anzahl k, dann erhält jede Person genau k Rohstoffe aus Holz, Lehm, Wolle, Getreide und Erz.
- **AK-3:** Gegeben „mit Zurücklegen“, dann ist jede Ziehung gleichverteilt über alle fünf Rohstoffe und Doppelungen sind möglich.
- **AK-4:** Gegeben „ohne Zurücklegen“, dann erhält jede Person nur unterschiedliche Rohstoffe, und jede Ziehung ist gleichverteilt über die für diese Person noch verbleibenden.
- **AK-5:** Gegeben ein Ergebnis, dann werden die Rohstoffe mit eigenem Symbol und Namen angezeigt.

### 4.8 Inszenierung (IN)

#### US-IN-01 Glücksrad · S
Als Spielende möchten wir das Losen als Glücksrad erleben, damit der Aufbau spannend wird.
Bezug: FA-IN-02

- **AK-1:** Gegeben ein Losschritt, dann zeigt das Rad für jede zur Wahl stehende Person ein gleich großes Segment mit Name und Farbe.
- **AK-2:** Gegeben die Ziehung, dann hält das Rad sichtbar bei der gelosten Person an; die Animation bestimmt oder verändert das Ergebnis nicht.

#### US-IN-02 Aufblinken bei der Platzierung · S
Als Spielende möchten wir sehen, wie mögliche Positionen aufblinken, bevor eine festgelegt wird, damit die Platzierung spannend und nachvollziehbar wirkt.
Bezug: FA-IN-01

- **AK-1:** Gegeben die Platzierung eines Gebäudes, dann blinken vor der Festlegung mehrere gültige Kreuzungen auf, bevor die geloste hervorgehoben wird.
- **AK-2:** Gegeben die Animation, dann blinken nur gültige Kreuzungen bzw. die an das Gebäude angrenzenden Kanten auf.

#### US-IN-03 Soundeffekte und Tonschalter · S
Als bedienende Person möchte ich dezente Soundeffekte, die ich abschalten kann, damit die Stimmung passt, ohne zu stören.
Bezug: FA-IN-03, FA-IN-04, FA-IN-05

- **AK-1:** Gegeben der Ton ist an, dann begleiten dezente Soundeffekte Glücksrad, Aufblinken und Festlegung.
- **AK-2:** Gegeben die Einstellungen, dann gibt es einen Tonschalter (Standard: an); ist er aus, erklingt kein Ton. Die Einstellung bleibt gespeichert.
- **AK-3:** Gegeben die gesamte App, dann wird keine Vibration ausgelöst.
- **AK-4:** Gegeben das Gerät ist stummgeschaltet, dann erklingt kein Ton, soweit die Plattform das erlaubt; gegeben eine andere App spielt Musik, dann wird diese durch die Soundeffekte nicht unterbrochen.

#### US-IN-04 Animation überspringen · S
Als bedienende Person möchte ich eine Animation gezielt überspringen können, damit es bei Bedarf schneller geht, ohne versehentlich etwas zu überspringen.
Bezug: FA-IN-06

- **AK-1:** Gegeben eine laufende Animation, dann gibt es einen klar beschrifteten Button „Animation überspringen“.
- **AK-2:** Gegeben ich nutze ihn, dann erscheint sofort das Ergebnis, und der Schritt muss weiterhin bestätigt werden.
- **AK-3:** Gegeben ein Tippen außerhalb dieses Buttons, dann beeinflusst es die Animation nicht.
- **AK-4:** Gegeben die Einstellungen, dann gibt es keine Einstellung für das Animationstempo.

### 4.9 Ergebnisse (ER)

#### US-ER-01 Ergebnis erfassen · M
Als Nutzer möchte ich jederzeit ein Ergebnis eintragen können, auch ohne Generierung, damit alle Partien in die Statistik eingehen.
Bezug: FA-ER-01, FA-ER-02, FA-ER-03, FA-ER-07 → 3.4, 3.6

- **AK-1:** Gegeben die Startansicht oder eine Gruppe, wenn ich „Ergebnis eintragen“ wähle, dann öffnet sich das Formular, ohne dass eine Generierung nötig ist.
- **AK-2:** Gegeben das Formular, dann sind Datum (Standard: heute), Gruppe, Spiel und Sieger Pflicht, bei Catan zusätzlich die Spielversion.
- **AK-3:** Gegeben das Feld Uhrzeit, dann ist es optional, und „Jetzt“ setzt die aktuelle Uhrzeit.
- **AK-4:** Gegeben ich wähle mehrere Sieger, dann wird das Ergebnis als Unentschieden zwischen diesen Personen gespeichert; alle Beteiligten können gleichzeitig Sieger sein.
- **AK-5:** Gegeben eine gewählte Gruppe, dann stehen nur mit ihr verträgliche, aktive Spiele zur Wahl, und die Mitglieder sind die Beteiligten.
- **AK-6:** Gegeben Catan, dann ist der Modus optional und mit „Standard“ vorbelegt; Notizen sind bei allen Spielen optional.

#### US-ER-02 Siegpunkte erfassen · S
Als Nutzer möchte ich bei Catan die Siegpunkte aller Beteiligten erfassen, damit Durchschnittswerte möglich werden.
Bezug: FA-ER-03, FA-ER-06 → 3.6

- **AK-1:** Gegeben ein Spiel ohne Siegpunkte, dann gibt es keine Siegpunktfelder.
- **AK-2:** Gegeben Siegpunkte sind nur für einen Teil der Beteiligten eingetragen, wenn ich speichern will, dann ist das erst möglich, wenn alle oder keine Felder ausgefüllt sind.
- **AK-3:** Gegeben eine Eingabe, dann sind nur ganze Zahlen ab 0 zulässig.
- **AK-4:** Gegeben ein Sieger hat nicht die höchste Punktzahl oder Unentschieden-Sieger haben unterschiedliche Punktzahlen, wenn ich speichere, dann erscheint eine Warnung; nach Bestätigung wird gespeichert.

#### US-ER-03 Catan-Farben im Ergebnis · C
Als Nutzer möchte ich sehen, wer in einer Partie welche Farbe hatte, damit ich mich an die Partie erinnern kann.
Bezug: FA-ER-09

- **AK-1:** Gegeben ein Catan-Ergebnis, dann sind die Catan-Farben aus der Partie bzw. die Standardfarben vorbelegt und änderbar (mit Tausch bei Konflikt).
- **AK-2:** Gegeben die Detailansicht eines Ergebnisses, dann werden die Farben angezeigt; in die Statistik gehen sie nicht ein.

#### US-ER-04 Ergebnisse einer Gruppe ansehen · M
Als Nutzer möchte ich alle Ergebnisse einer Gruppe chronologisch sehen, damit ich die Historie nachvollziehen kann.
Bezug: FA-ER-08 → 3.7

- **AK-1:** Gegeben eine Gruppe, dann zeigt eine Liste alle Ergebnisse mit Datum, ggf. Uhrzeit, Spiel und Sieger bzw. Unentschieden, neueste zuerst gemäß 3.7.
- **AK-2:** Gegeben ein Eintrag, wenn ich ihn öffne, dann sehe ich alle erfassten Daten.

#### US-ER-05 Ergebnis bearbeiten und löschen · M
Als Nutzer möchte ich Ergebnisse korrigieren oder löschen, damit Fehler die Statistik nicht verfälschen.
Bezug: FA-ER-04

- **AK-1:** Gegeben ich habe ein Ergebnis bearbeitet, wenn ich speichere, dann erscheint vorher eine ausdrückliche Warnung, dass dies die Statistik verändert.
- **AK-2:** Gegeben ich lösche ein Ergebnis und bestätige die Warnung, dann wird zuvor ein Sicherungspunkt angelegt und das Ergebnis entfernt.
- **AK-3:** Gegeben eine Änderung oder Löschung, dann sind alle Statistiken sofort aktualisiert.

### 4.10 Statistik (ST)

#### US-ST-01 Kennzahlen je Person · M
Als Spielende möchten wir Kennzahlen je Person sehen, damit wir wissen, wer wie erfolgreich ist.
Bezug: FA-ST-01, FA-ST-02, FA-ST-05 → 3.8

- **AK-1:** Gegeben eine Gruppe, dann zeigt die Statistik für jedes Mitglied Partien, Siege, Siegquote, Unentschieden, aktuelle und längste Siegesserie; bei Catan zusätzlich die Durchschnittssiegpunkte.
- **AK-2:** Gegeben ein Unentschieden, dann zählt es für die beteiligten Sieger als Unentschieden, nicht als Sieg, und beendet ihre Siegesserie.
- **AK-3:** Gegeben Partien teils mit, teils ohne Siegpunkte, dann wird der Durchschnitt nur über Partien mit Siegpunkten gebildet; ohne solche Partien wird „–“ angezeigt.
- **AK-4:** Gegeben eine Gruppe ohne Partien im Filter, dann erscheint ein verständlicher Hinweis statt leerer Zahlen.
- **AK-5:** Gegeben die App, dann gibt es keine gruppenübergreifende Statistik.

#### US-ST-02 Rangliste · M
Als Spielende möchten wir eine Rangliste, deren Sortierung wir wählen können, damit wir uns aus verschiedenen Blickwinkeln vergleichen können.
Bezug: FA-ST-03 → 3.8

- **AK-1:** Gegeben die Rangliste, dann ist sie standardmäßig nach Siegen sortiert.
- **AK-2:** Gegeben die Rangliste, dann kann ich das Sortierkriterium aus den in 3.8 genannten Kriterien wählen.
- **AK-3:** Gegeben Gleichstand im gewählten Kriterium, dann entscheiden die Folgekriterien aus 3.8; bei vollständigem Gleichstand teilen sich die Personen einen Rang.

#### US-ST-03 Statistik filtern · S
Als Spielende möchten wir die Statistik nach Spiel und Spielversion filtern, damit wir Vergleichbares vergleichen.
Bezug: FA-ST-06, FA-ST-07

- **AK-1:** Gegeben eine globale Gruppe, dann kann ich zwischen „Alle Spiele“ und einem einzelnen Spiel filtern.
- **AK-2:** Gegeben der Filter steht auf Catan (oder die Gruppe ist an Catan gebunden), dann kann ich zusätzlich zwischen „Gesamt“, „Basisspiel“ und „Städte & Ritter“ wählen.
- **AK-3:** Gegeben ein Filter, dann gilt er für Kennzahlen, Rangliste und Diagramme gleichermaßen.
- **AK-4:** Gegeben der Filter umfasst nicht ausschließlich Catan, dann werden keine Durchschnittssiegpunkte angezeigt.

#### US-ST-04 Diagramme · S
Als Spielende möchten wir Verlauf und Verteilung der Siege grafisch sehen, damit Entwicklungen auf einen Blick erkennbar sind.
Bezug: FA-ST-04 → 3.7, 3.8

- **AK-1:** Gegeben eine Gruppe mit Partien, dann zeigt ein Liniendiagramm die kumulierten Siege je Person über die Partien in der Reihenfolge aus 3.7.
- **AK-2:** Gegeben eine Gruppe mit Partien, dann zeigt ein Diagramm die Verteilung der Siege je Person sowie den Anteil der Unentschieden.
- **AK-3:** Gegeben die Diagramme, dann werden die Gruppenfarben verwendet und der aktive Filter berücksichtigt.

### 4.11 Export und Import (EI)

#### US-EI-01 Vollsicherung exportieren · M
Als Nutzer möchte ich alle Daten einschließlich der Einstellungen in eine Datei sichern, damit ich nach einer Neuinstallation oder auf einem anderen Gerät alles wiederherstellen kann.
Bezug: FA-EI-01, FA-EI-09, FA-EI-12, NFA-DH-02, NFA-DH-04 → 3.9

- **AK-1:** Gegeben „Exportieren“ mit Umfang „Vollsicherung“, dann entsteht eine Datei mit allen Personen, Gruppen, eigenen Spielen, Partien, Ergebnissen, den Einstellungen, dem Stand von Hinweisen und Erinnerungen und der Formatversion.
- **AK-2:** Gegeben eine Vollsicherung, dann enthält sie weder Sicherungspunkte noch eine laufende Partie.
- **AK-3:** Gegeben die App, dann verlassen Daten das Gerät nur durch eine vom Nutzer ausgelöste Export-Aktion.
- **AK-4:** Gegeben das Teilen-Menü des Systems ist verfügbar, dann wird die Datei darüber angeboten; andernfalls wird sie heruntergeladen. Der Dateiname nennt Datum und Umfang.
- **AK-5:** Gegeben eine Vollsicherung ist abgeschlossen, dann gilt ihr Zeitpunkt als letzte Vollsicherung (→ 3.11, 3.12).

#### US-EI-02 Teilumfang exportieren · S
Als Nutzer möchte ich gezielt einzelne Gruppen, Spiele oder Partien exportieren, damit ich Freunden nur das schicke, was sie betrifft.
Bezug: FA-EI-02, FA-EI-08 → 3.9

- **AK-1:** Gegeben der Export, dann kann ich als Umfang wählen: Vollsicherung, eine oder mehrere Gruppen, ein oder mehrere Spiele oder frei ausgewählte einzelne Partien einer Gruppe.
- **AK-2:** Gegeben ein Teilexport, dann enthält er automatisch alle benötigten Personen, Gruppen und Spiele.
- **AK-3:** Gegeben der Umfang „Ausgewählte Partien“ und eine gewählte Gruppe, dann zeigt die App eine nach Spiel filterbare Liste aller Partien dieser Gruppe, in der ich beliebig viele Partien einzeln markieren kann; die Anzahl der markierten Partien wird angezeigt.
- **AK-4:** Gegeben ein Teilexport, dann enthält er keine Einstellungen und setzt die Export-Erinnerung nicht zurück.

#### US-EI-03 Daten importieren · M
Als Nutzer möchte ich eine Exportdatei importieren, damit ich Daten von einem anderen Gerät übernehmen kann.
Bezug: FA-EI-01, FA-EI-07, FA-EI-10, FA-EI-12, FA-DS-02, FA-AB-09, NFA-DH-04 → 3.9

- **AK-1:** Gegeben alle Entscheidungen zu Konflikten und Zuordnungen sind getroffen, wenn die Übernahme beginnt, dann wird zuerst der Sicherungspunkt „Vor Import“ angelegt; Sicherungspunkt und Übernahme erfolgen gemeinsam oder gar nicht.
- **AK-2:** Gegeben Datensätze, die bereits identisch vorhanden sind (K1), dann werden sie ohne Rückfrage übersprungen.
- **AK-3:** Gegeben ein Import, dann werden keine lokalen Daten gelöscht.
- **AK-4:** Gegeben eine Datei mit neuerer Formatversion, dann lehnt die App den Import mit dem Hinweis ab, die App zu aktualisieren; eine ältere Formatversion wird übernommen.
- **AK-5:** Gegeben ich breche den Import vor Abschluss ab, dann ist der Datenbestand unverändert.
- **AK-6:** Gegeben der Import ist abgeschlossen, dann zeigt eine Zusammenfassung, wie viele Datensätze neu, aktualisiert und übersprungen wurden.
- **AK-7:** Gegeben eine Partie in Generierung oder laufend, wenn ich importieren will, dann ist das gesperrt, die App nennt den Grund und bietet an, die Partie vorher zu beenden.
- **AK-8:** Gegeben die Datei enthält Einstellungen, dann fragt die App einmal, ob sie übernommen werden sollen.
- **AK-9:** Gegeben der Datenbestand ist leer, wenn ich eine Vollsicherung importiere, dann werden alle Datensätze ohne Rückfrage mit ihren Kennungen übernommen.
- **AK-10:** Gegeben eine fehlerhafte oder unvollständige Datei, dann lehnt die App sie vollständig ab und ändert nichts.

#### US-EI-04 Konflikte beim Import im Einzelfall lösen · M
Als Nutzer möchte ich bei jedem Konflikt selbst entscheiden, damit nichts ungewollt überschrieben wird.
Bezug: FA-EI-03, FA-EI-11 → 3.9

- **AK-1:** Gegeben ein Datensatz mit gleicher Kennung, aber anderem Inhalt (K2), dann zeigt die App die Unterschiede und bietet „Meine behalten“ oder „Importierte übernehmen“.
- **AK-2:** Gegeben eine mögliche Dublette einer Partie (K4), dann bietet die App „Beide behalten“ oder „Importierte überspringen“.
- **AK-3:** Gegeben mehrere Konflikte, dann wird jeder einzeln entschieden; eine Sammelentscheidung gibt es nicht.
- **AK-4:** Gegeben zwei Datensätze unterscheiden sich nur im Archivstatus, dann gelten sie als identisch (K1); der lokale Archivstatus bleibt erhalten.
- **AK-5:** Gegeben eine Option würde eine Regel verletzen (→ 3.9, Regel 9), dann ist sie deaktiviert und nennt den Grund; mindestens eine zulässige Option bleibt verfügbar.

#### US-EI-05 Importierte Daten vorhandenen Daten zuordnen · M
Als Nutzer möchte ich importierte Partien meiner Freunde meiner eigenen Gruppe mit denselben Personen zuordnen, damit unsere Partien in einer gemeinsamen Statistik landen.
Bezug: FA-EI-06 → 3.9

- **AK-1:** Gegeben eine importierte Gruppe mit unbekannter Kennung (K3), dann kann ich sie einer vorhandenen Gruppe mit gleicher Mitgliederzahl und verträglicher Spielbindung zuordnen oder neu anlegen; die Auswahl ist nicht vorbelegt.
- **AK-2:** Gegeben ich ordne eine Gruppe zu, dann ordne ich jede importierte Person genau einem Mitglied der Zielgruppe zu; die Auswahl ist nicht vorbelegt, und keine Person darf doppelt zugeordnet werden.
- **AK-3:** Gegeben eine unbekannte Person außerhalb einer Gruppenzuordnung oder ein unbekanntes eigenes Spiel, dann kann ich es einem vorhandenen Datensatz zuordnen oder neu anlegen.
- **AK-4:** Gegeben Daten mit denselben Kennungen wurden bei einem früheren Import bereits zugeordnet, wenn sie erneut importiert werden, dann muss die Zuordnung erneut manuell getroffen werden; die App merkt sich keine Zuordnungen.
- **AK-5:** Gegeben Catan, dann wird es immer automatisch erkannt.
- **AK-6:** Gegeben eine Zuordnung erweist sich nach dem Import als falsch, dann kann ich den Import über US-EI-06 vollständig rückgängig machen.
- **AK-7:** Gegeben Partien wurden nach einer Zuordnung importiert, wenn dieselbe Datei erneut importiert und dieselbe Zuordnung getroffen wird, dann werden die Partien als identisch erkannt (K1) und nicht doppelt angelegt.

#### US-EI-06 Import rückgängig machen · M
Als Nutzer möchte ich einen Import vollständig rückgängig machen, damit ein fehlerhafter Import keinen Schaden anrichtet.
Bezug: FA-EI-04, FA-DS-02 → 3.9

- **AK-1:** Gegeben die letzten 3 Importe, dann werden sie mit Datum und Uhrzeit angezeigt und haben jeweils „Rückgängig“.
- **AK-2:** Gegeben ich wähle „Rückgängig“, dann warnt die App, dass alle Änderungen seit diesem Import verloren gehen; nach Bestätigung wird der Sicherungspunkt vor dem Import wiederhergestellt.

#### US-EI-07 Export-Erinnerung · S
Als Nutzer möchte ich unaufdringlich an einen Export erinnert werden, damit ich meine Daten nicht verliere.
Bezug: FA-EI-05 → 3.11

- **AK-1:** Gegeben die Bedingungen aus 3.11 sind erfüllt, dann erscheint auf dem Startbildschirm ein kleines Banner mit „Jetzt sichern“ und „Später“.
- **AK-2:** Gegeben ich wähle „Später“, dann erscheint das Banner frühestens nach 7 Tagen wieder.
- **AK-3:** Gegeben ich wähle „Jetzt sichern“, dann wird eine Vollsicherung erstellt.
- **AK-4:** Gegeben es gibt seit der letzten Vollsicherung keine Änderungen, dann erscheint keine Erinnerung.
- **AK-5:** Gegeben ich erstelle nur einen Teilexport, dann bleibt die Erinnerung bestehen.

### 4.12 Datensicherung (DS)

#### US-DS-01 Automatische Sicherungspunkte · M
Als Nutzer möchte ich, dass die App automatisch Sicherungspunkte anlegt, damit ich versehentliche Änderungen zurücknehmen kann.
Bezug: FA-DS-01, FA-DS-02, FA-DS-04, FA-DS-05, FA-DS-07 → 3.10

- **AK-1:** Gegeben einer der automatischen Auslöser aus 3.10, dann wird vor der Aktion ein Sicherungspunkt mit Datum, Uhrzeit und Anlass angelegt.
- **AK-2:** Gegeben 15 Sicherungspunkte, wenn ein weiterer entsteht, dann wird der älteste entfernt, mit Ausnahme der Sicherungspunkte der letzten 3 Importe.
- **AK-3:** Gegeben die App bleibt über Mitternacht geöffnet, wenn sie am neuen Kalendertag in den Vordergrund zurückkehrt und sich seit dem letzten Sicherungspunkt etwas geändert hat, dann entsteht ein Sicherungspunkt „Täglich“.
- **AK-4:** Gegeben ein Sicherungspunkt, dann enthält er alle Nutzerdaten, aber weder Einstellungen noch eine laufende Partie.

#### US-DS-02 Sicherungspunkt wiederherstellen · M
Als Nutzer möchte ich einen früheren Datenstand wiederherstellen, damit Fehler rückgängig zu machen sind.
Bezug: FA-DS-01, FA-DS-04, FA-DS-07, FA-AB-09 → 3.10

- **AK-1:** Gegeben der Bereich „Sicherung“, dann sehe ich alle Sicherungspunkte mit Datum, Uhrzeit und Anlass.
- **AK-2:** Gegeben ich wähle einen Sicherungspunkt, dann warnt die App, dass alle späteren Änderungen verloren gehen; nach Bestätigung wird zuerst ein Sicherungspunkt „Vor Wiederherstellung“ angelegt und dann der gewählte Stand wiederhergestellt.
- **AK-3:** Gegeben eine Wiederherstellung, dann bleiben die Einstellungen unverändert.
- **AK-4:** Gegeben eine Partie in Generierung oder laufend, dann ist die Wiederherstellung gesperrt, und die App bietet an, die Partie vorher zu beenden.

#### US-DS-03 Manuellen Sicherungspunkt anlegen · C
Als Nutzer möchte ich selbst einen Sicherungspunkt anlegen, damit ich vor größeren Änderungen einen definierten Stand habe.
Bezug: FA-DS-06

- **AK-1:** Gegeben der Bereich „Sicherung“, wenn ich „Jetzt sichern“ wähle, dann entsteht ein Sicherungspunkt mit Anlass „Manuell“.

#### US-DS-04 Hinweis zum Schutz vor Datenverlust · S
Als Nutzer möchte ich verständlich erfahren, wovor Sicherungspunkte schützen und wovor nicht, damit ich rechtzeitig exportiere.
Bezug: FA-DS-03

- **AK-1:** Gegeben der Bereich „Sicherung“, dann erklärt ein kurzer Text, dass Sicherungspunkte auf dem Gerät liegen und nur eine Vollsicherung vor Deinstallation, Gerätewechsel, Defekt oder dem Löschen von Browserdaten schützt, und dass das Entfernen des App-Symbols einer Deinstallation gleichkommt.
- **AK-2:** Gegeben der erste Start der App, dann erscheint dieser Hinweis einmalig.

### 4.13 Updates (UP)

#### US-UP-01 Update-Hinweis und selbstbestimmtes Update · M
Als Nutzer möchte ich selbst entscheiden, wann ein Update angewendet wird, damit kein Spieleabend gestört wird.
Bezug: FA-UP-01, FA-UP-02 → 3.12

- **AK-1:** Gegeben eine neue Version ist verfügbar und keine Partie läuft, dann zeigt die App einen unaufdringlichen Hinweis mit „Jetzt aktualisieren“, der zum Sicherungsdialog (US-UP-02) führt.
- **AK-2:** Gegeben eine Partie in Vorbereitung, Generierung oder laufend, dann wird kein Update angewendet und der Hinweis erst nach dem Ende der Partie angezeigt.
- **AK-3:** Gegeben ein Update wurde angewendet, dann sind alle Daten und Einstellungen unverändert vorhanden.
- **AK-4:** Gegeben eine neue Version wurde geladen, aber nicht bestätigt, wenn die App vollständig geschlossen und neu gestartet wird, dann läuft weiterhin die bisherige Version.
- **AK-5:** Gegeben die Einstellungen, dann wird dort die aktuelle Versionsnummer angezeigt.

#### US-UP-02 Sicherung vor dem Update · M
Als Nutzer möchte ich vor jedem Update an eine Sicherung erinnert werden, damit ich bei einem Problem nichts verliere.
Bezug: FA-UP-03, FA-DS-04 → 3.12

- **AK-1:** Gegeben ich wähle „Jetzt aktualisieren“, dann erscheint immer ein Dialog mit „Sichern und aktualisieren“, „Ohne Sicherung aktualisieren“ und „Abbrechen“.
- **AK-2:** Gegeben der Dialog, dann nennt er das Datum der letzten Vollsicherung und die Anzahl der seitdem erfassten Ergebnisse bzw. den Hinweis, dass es seitdem keine Änderungen gab; gab es noch nie eine Vollsicherung, sagt er das.
- **AK-3:** Gegeben ich wähle „Sichern und aktualisieren“, dann wird zuerst eine Vollsicherung erstellt und weitergegeben (US-EI-01), danach wird aktualisiert.
- **AK-4:** Gegeben ich wähle eine der beiden Aktualisieren-Optionen, dann wird vor dem Wechsel der Sicherungspunkt „Vor Update“ angelegt.
- **AK-5:** Gegeben ich wähle „Abbrechen“, dann bleibt die bisherige Version aktiv, und der Hinweis bleibt bestehen.

### 4.14 Installation und Speicherschutz (IS)

#### US-IS-01 Nutzung unter iOS nur als installierte App · M
Als Nutzer möchte ich unter iOS sicher zur installierten App geführt werden, damit meine Daten nicht unbemerkt in einem getrennten Browserspeicher landen.
Bezug: FA-IS-01 → 3.13

- **AK-1:** Gegeben iOS oder iPadOS und die App läuft in einem Safari-Tab, dann zeigt sie ausschließlich eine bebilderte Installationsanleitung und keine weiteren Funktionen.
- **AK-2:** Gegeben iOS oder iPadOS und ein anderer Browser als Safari, dann zeigt die App ausschließlich den Hinweis, die Seite in Safari zu öffnen und dort zu installieren.
- **AK-3:** Gegeben die App wurde zum Home-Bildschirm hinzugefügt und von dort gestartet, dann sind alle Funktionen verfügbar.

#### US-IS-02 Installationshinweis unter Android und Windows · S
Als Nutzer möchte ich erfahren, dass ich die App installieren kann, damit ich sie wie eine normale App starten kann.
Bezug: FA-IS-02 → 3.13

- **AK-1:** Gegeben Android oder Windows und die App läuft im Browser-Tab, dann erscheint ein wegklickbarer Hinweis mit kurzer Anleitung zur Installation.
- **AK-2:** Gegeben die App läuft installiert, dann erscheint kein Installationshinweis.
- **AK-3:** Gegeben ich habe den Hinweis weggeklickt, dann erscheint er nicht erneut.

#### US-IS-03 Persistenten Speicher sicherstellen · M
Als Nutzer möchte ich wissen, ob meine Daten vor automatischer Löschung geschützt sind, damit ich bei Gefahr rechtzeitig reagieren kann.
Bezug: FA-IS-03 → 3.13

- **AK-1:** Gegeben der Start der App, dann fordert sie persistenten Speicher an, sofern er noch nicht gewährt ist.
- **AK-2:** Gegeben der Bereich „Sicherung“, dann zeigt er, ob der Speicher geschützt ist.
- **AK-3:** Gegeben der Speicher ist nicht geschützt, dann erscheint eine deutliche Warnung mit möglichen Ursachen und Abhilfen, z. B. eine Ausnahme für die App, wenn der Browser Websitedaten beim Schließen löscht, und der Empfehlung einer Vollsicherung.

### 4.15 Erscheinungsbild (GB)

#### US-GB-01 Akzentfarbe wählen · C
Als Nutzer möchte ich die Akzentfarbe ändern, damit die App meinem Geschmack entspricht.
Bezug: NFA-GB-03

- **AK-1:** Gegeben die Einstellungen, dann kann ich aus 6 bis 8 vordefinierten Akzentfarben wählen; Standard ist ein dunkles Lila.
- **AK-2:** Gegeben ich wähle eine Farbe, dann wirkt sie sofort und bleibt gespeichert.

---

## 5. Nicht-funktionale Anforderungen: Prüfkriterien

| ID | Prüfkriterium | Prüfart | Prio |
|---|---|---|---|
| NFA-ZF-01 | Alle Zufallswerte im Produktivcode stammen aus dem kryptografisch sicheren Generator der Laufzeitumgebung, auch dekorative; `Math.random` ist per Lint-Regel verboten; deterministische Quellen gibt es nur im Testcode | Code-Review, automatisierte Prüfung | M |
| NFA-ZF-02 | Die Umrechnung in Auswahlentscheidungen ist verzerrungsfrei, nachgewiesen durch vollständiges Durchzählen aller Eingabewerte; Chi-Quadrat-Tests über mindestens 100.000 Ziehungen bestehen für Personenlos, Reihenfolge, Kreuzungen, Kanten und Rohstoffe bei α = 0,001 je Test; ein einzelner Fehlschlag wird einmal wiederholt, erst ein zweiter gilt als Fehler | Automatisierter Test | M |
| NFA-ZF-03 | Die Zufallsquelle ist über eine Schnittstelle austauschbar; Tests laufen mit einer deterministischen Quelle reproduzierbar | Code-Review, automatisierter Test | M |
| NFA-PL-01 | Abnahme auf Android (Brave), iPhone und iPad (Safari, installiert) und Windows (Brave, installiert); Chrome als Vergleichsbrowser | Manueller Test | M |
| NFA-PL-02 | Eine gemeinsame Codebasis für alle Plattformen | Code-Review | M |
| NFA-PL-03 | Alle Funktionen außer Updates arbeiten im Flugmodus | Manueller Test | M |
| NFA-PL-04 | Alle Ansichten sind auf Smartphone und Tablet in Hoch- und Querformat ohne abgeschnittene Inhalte nutzbar | Manueller Test | M |
| NFA-DH-01 bis -03 | Keine Netzwerkzugriffe außer für Updates; keine Konten, keine Anmeldung, kein Tracking; eine Content-Security-Policy erlaubt nur die eigene Herkunft; Ende-zu-Ende-Tests schlagen bei Anfragen an fremde Adressen fehl | Code-Review, Netzwerkmitschnitt, automatisierter Test | M |
| NFA-DH-04 | Jeder Export enthält eine Formatversion; Import älterer Versionen ist durch Tests abgedeckt | Automatisierter Test | M |
| NFA-DH-05 | Jeder Datensatz hat eine zufällige, weltweit eindeutige Kennung | Code-Review | M |
| NFA-GB-01 | Eigenständiges, modernes Erscheinungsbild | Abnahme durch Product Owner | S |
| NFA-GB-02 | Dunkelmodus mit mitteldunklen Tönen, kein reines Schwarz | Abnahme durch Product Owner | M |
| NFA-GB-04 | Mikroanimationen bei Hover bzw. Berührung | Manueller Test | C |
| NFA-GB-05 | Alle Farben stammen aus zentralen Design-Tokens; keine Farbwerte im übrigen Code | Code-Review | M |
| NFA-GB-06 | Keine Original-Grafiken des Spiels | Abnahme durch Product Owner | M |
| NFA-I18N-01, -02 | Alle sichtbaren Texte stammen aus ausgelagerten Sprachdateien; keine festen Texte im Code | Code-Review, automatisierte Prüfung | M |
| NFA-EW-01 bis -06 | Spiele als Module, Regeln als Bausteine, Brettmodell mit optionalem Feldinhalt, Datenmodell ohne Hindernis für Synchronisation | Architektur-Review | M |
| NFA-EW-07 | Spiellogik und Zufall durch automatisierte Tests abgesichert, einschließlich aller Abnahmekriterien zu LS, PL und SR | Automatisierter Test | M |
| NFA-EW-08 | Die Behandlung von Sackgassen ist ein austauschbarer Baustein; die Sackgassenquote bei 4 Personen wird in Tests gemessen und dokumentiert | Automatisierter Test | S |

Barrierefreiheit ist kein Ziel von Version 1 (E-24) und wird nicht geprüft. *(ergänzt in 0.5)*

---

## 6. Rückverfolgbarkeit

| Anforderung | User Stories |
|---|---|
| FA-SP-01 | US-SP-01 |
| FA-SP-02 | US-SP-02 |
| FA-SP-03 | US-SP-03 |
| FA-SP-04 | US-SP-04 |
| FA-SP-05 | US-SP-02, US-PG-03 |
| FA-PG-01 | US-PG-01 |
| FA-PG-02 bis FA-PG-04 | US-PG-02 |
| FA-PG-05 | US-PG-03 |
| FA-PG-06 | US-PG-04 |
| FA-PG-07, FA-PG-08 | US-PG-03 |
| FA-PG-09 | US-PG-02, US-VW-01 |
| FA-PG-10 | US-PG-02, US-AB-01 |
| FA-VW-01 | US-VW-01 |
| FA-VW-02 | US-VW-02 |
| FA-VW-03 | US-VW-03 |
| FA-VW-04 | US-VW-04 |
| FA-VW-05 | US-VW-01, US-VW-03, US-VW-04 |
| FA-AB-01 | US-SP-01, US-AB-01 |
| FA-AB-02 | US-SP-04, US-AB-01 |
| FA-AB-03 | US-AB-02 |
| FA-AB-04 | US-AB-03 |
| FA-AB-05 | US-AB-04 |
| FA-AB-06 | US-AB-06 |
| FA-AB-07 | US-AB-05 |
| FA-AB-08 | US-AB-06 |
| FA-AB-09 | US-VW-02, US-VW-03, US-EI-03, US-DS-02 |
| FA-LS-01, FA-LS-03, FA-LS-04 | US-LS-02 |
| FA-LS-02 | US-LS-03 |
| FA-LS-05, FA-LS-06 | US-LS-01 |
| FA-PL-01 | US-PL-02, US-PL-03 |
| FA-PL-02 bis FA-PL-04 | US-PL-02 |
| FA-PL-05, FA-PL-06 | US-PL-04 |
| FA-PL-07, FA-PL-08 | US-PL-01 |
| FA-PL-09 | US-PL-05 |
| FA-SR-01 bis FA-SR-04 | US-SR-01 |
| FA-IN-01 | US-IN-02 |
| FA-IN-02 | US-IN-01 |
| FA-IN-03 bis FA-IN-05 | US-IN-03 |
| FA-IN-06 | US-IN-04 |
| FA-IN-07 | US-IN-03 |
| FA-ER-01, FA-ER-02, FA-ER-07 | US-ER-01 |
| FA-ER-03 | US-ER-01, US-ER-02 |
| FA-ER-04 | US-ER-05 |
| FA-ER-05 | Abgrenzung, keine Story |
| FA-ER-06 | US-ER-02 |
| FA-ER-08 | US-ER-04 |
| FA-ER-09 | US-ER-03 |
| FA-ST-01, FA-ST-02, FA-ST-05 | US-ST-01 |
| FA-ST-03 | US-ST-02 |
| FA-ST-04 | US-ST-04 |
| FA-ST-06, FA-ST-07 | US-ST-03 |
| FA-EI-01 | US-EI-01, US-EI-03 |
| FA-EI-02 | US-EI-02 |
| FA-EI-03 | US-EI-04 |
| FA-EI-04 | US-EI-06 |
| FA-EI-05 | US-EI-07 |
| FA-EI-06 | US-EI-05 |
| FA-EI-07 | US-EI-03 |
| FA-EI-08 | US-EI-02 |
| FA-EI-09 | US-EI-01, US-EI-02 |
| FA-EI-10 | US-EI-03 |
| FA-EI-11 | US-EI-04 |
| FA-EI-12 | US-EI-01, US-EI-03 |
| FA-DS-01 | US-DS-01, US-DS-02 |
| FA-DS-02 | US-DS-01, US-EI-03, US-EI-06 |
| FA-DS-03 | US-DS-04 |
| FA-DS-04, FA-DS-05 | US-DS-01, US-DS-02, US-UP-02 |
| FA-DS-06 | US-DS-03 |
| FA-DS-07 | US-DS-01, US-DS-02 |
| FA-UP-01, FA-UP-02 | US-UP-01 |
| FA-UP-03 | US-UP-02 |
| FA-IS-01 | US-IS-01 |
| FA-IS-02 | US-IS-02 |
| FA-IS-03 | US-IS-03 |
| NFA-GB-03 | US-GB-01 |
| Übrige NFA | Kapitel 5 |

---

## 7. Bestätigte Annahmen

Die folgenden Punkte wurden in der Klärung nicht ausdrücklich entschieden, in dieser Spezifikation festgelegt und vom Product Owner am 05.10.2026 bestätigt (A-02 in geänderter Fassung).

| ID | Annahme |
|---|---|
| A-01 | Die Palette der Gruppenfarben umfasst 12 Farben; eine Gruppe hat daher höchstens 12 Mitglieder. |
| A-02 | Gleichnamige Personen sind in der Personenliste nach Hinweis erlaubt, innerhalb einer Gruppe jedoch nicht; Spielnamen müssen eindeutig sein. *(geändert in 0.2)* |
| A-03 | Der Export eines Spiels umfasst alle Partien dieses Spiels über alle Gruppen. |
| A-04 | Schritte können wiederholt werden, solange die Partie läuft, also auch nach Abschluss der Generierung. |
| A-05 | Die Wiederholung von LS-02 verwirft die Platzierung, nicht aber bereits gezogene Startrohstoffe. |
| A-06 | Während einer Partie wird kein Update angeboten oder angewendet. |
| A-07 | Die Catan-Farben einer Partie werden im Ergebnis gespeichert, gehen aber nicht in die Statistik ein. |
| A-08 | Bei Catan ist „Basisspiel“ vorausgewählt; die zuletzt gewählten Optionen werden nicht gemerkt. |
| A-09 | LS-02 ist immer aktiv, weil die Platzierung zum Kern gehört; ohne Platzierung bestimmt LS-02 weiterhin die Startperson und die Reihenfolge der Startrohstoffe. |
| A-10 | Eine Sammelentscheidung für gleichartige Importkonflikte wird nicht angeboten (geparkt als PP-18). |

---

## 8. Ergebnis der Architekturphase und der Setup-Planung

Die in Version 0.3 an die Architekturphase übergebenen Punkte sind gelöst. Die technische Ausgestaltung beschreibt BoardBrain_Architektur.md (v0.1).

| Thema | Lösung | Bezug |
|---|---|---|
| Technologiewahl | PWA mit TypeScript, React, Motion und Vite; Fachlogik framework-frei; Speicher IndexedDB mit Dexie | ADR-001 bis ADR-007 |
| Exportformat | Versioniertes JSON mit Migrationskette; Teilen-Menü bzw. Download; kein QR-Code | ADR-012, 3.9 |
| Speicherpersistenz unter iOS | Nutzung nur als installierte App; persistenter Speicher wird angefordert und überwacht | ADR-016, 3.13, US-IS-01, US-IS-03 |
| Unsichtbare Sackgassen | Verdeckte Vorausberechnung aller verbleibenden Gebäude als austauschbare Strategie | ADR-010, 3.2 |
| Persistenz der laufenden Partie | Schrittergebnis wird vor der Animation gespeichert; unterbrochene Animation wird wiederholt | ADR-014, 3.5, US-AB-05 |
| Kennungen und Zuordnungen | UUID Version 4; Zuordnungen nur im Speicher während eines Imports | ADR-011, 3.9 |
| Sicherungspunkte | Im Exportformat in derselben Datenbank; Wiederherstellung in einer Transaktion | ADR-013, 3.10 |
| Ton | Web Audio mit Audio-Session „ambient“ | ADR-017, US-IN-03 |
| Update-Mechanismus | Kontrollierte Umschaltung über versionierte Caches; Sicherungsdialog | ADR-015, 3.12, US-UP-01, US-UP-02 |

Ergebnisse der Setup-Planung *(ergänzt in 0.5)*:

| Thema | Lösung | Bezug |
|---|---|---|
| Dauerhafte Adresse | `https://boardbrain.github.io/` über die Organisation `boardbrain` | OP-12, E-21, ADR-022 |
| Arbeitsweise | Story-Bündel in Arbeitsbranches; Claude Code eröffnet Pull Requests, der Product Owner nimmt ab und mergt; Haltepunkte | EP-10 bis EP-12, E-22, ADR-023 |
| Erste Veröffentlichung | Platzhalter-Release 0.1.0 ohne Service Worker; Vorabversionen offen | EP-02, E-25, OP-13 |
| Arbeitsregeln | Entwicklungsrichtlinien und `CLAUDE.md` im Repository | EP-12 |

Offen ist OP-13 (Vorabversionen), zu entscheiden nach Inkrement I2.
