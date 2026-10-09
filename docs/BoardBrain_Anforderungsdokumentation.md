# BoardBrain – Anforderungsdokumentation

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Anforderungsdokumentation (Ergebnis der Anforderungserhebung) |
| Version | 0.16 |
| Status | Final – freigegeben für die Durchführung des Setups und die Umsetzung (zusammen mit Spezifikation v0.5 und Architektur v0.2) |
| Stand | 09.10.2026 |
| Sprache | Deutsch |
| Ablage | Ab Abschluss des Setups ausschließlich im Repository unter `docs/` (EP-09) |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 04.10.2026 | Erstfassung auf Basis der Anforderungserhebung |
| 0.2 | 05.10.2026 | Farben und Siegpunkte als spielspezifische Merkmale (nur Catan); Startrohstoffe in Menge und Ziehverfahren konfigurierbar |
| 0.3 | 05.10.2026 | Ablage und Pflege der Projektdokumentation festgelegt (EP-07 bis EP-09) |
| 0.4 | 05.10.2026 | Klärung OP-03 bis OP-08 und OP-10 in der Spezifikationsphase: Fehler in Regel 6.2.4 korrigiert (Sackgassen bei 4 Personen) und Behandlung festgelegt; Reihenfolge der Losschritte, Schrittdefinition und Wiederholung präzisiert; Farbmodell mit Gruppen- und Catan-Farbe; Verwaltung (neu 5.13); Ergebnis-, Statistik-, Import-, Sicherungs- und Erinnerungsregeln präzisiert; Lebenszyklus der laufenden Partie; Releaseumfang V1 festgelegt; neue IDs FA-PG-07 bis -10, FA-VW-01 bis -05, FA-AB-07/-08, FA-LS-06, FA-PL-09, FA-SR-04, FA-IN-05/-06, FA-ER-06 bis -09, FA-EI-06 bis -08, FA-DS-04 bis -06, NFA-DH-05, NFA-EW-08, E-09 bis E-13, OP-11, PP-14 bis PP-18 |
| 0.5 | 05.10.2026 | Abnahme der Spezifikation: Personennamen innerhalb einer Gruppe eindeutig (FA-PG-09, FA-VW-01); freie Auswahl einzelner Partien beim Export, auch gruppenübergreifend (FA-EI-02); Zuordnungen beim Import werden vorgeschlagen und jedes Mal bestätigt (FA-EI-06, E-11) |
| 0.6 | 05.10.2026 | Zuordnungen beim Import stets manuell, ohne Vorbelegung und ohne Speicherung (FA-EI-06, E-11); Auswahl einzelner Partien beim Export auf eine Gruppe beschränkt (FA-EI-02), gruppenübergreifende Auswahl geparkt (PP-19) |
| 0.7 | 06.10.2026 | Ergebnisse der Architekturphase: Vollsicherung einschließlich Einstellungen (FA-EI-02, -05, -09, -10); Austausch über Teilen-Menü bzw. Download, kein QR-Code (FA-EI-12); Konfliktregeln beim Import präzisiert (FA-EI-03, -11); Sperren während einer laufenden Partie (FA-AB-09); erneutes Abspielen einer unterbrochenen Animation (FA-AB-07); Sicherungspunkte vor Updates, Tagesregel und Umfang (FA-DS-04, -07); Sicherungsdialog vor jedem Update und Update nur nach ausdrücklicher Bestätigung (FA-UP-02, -03); Installation und Speicherschutz (neu 5.14, FA-IS-01 bis -03); Ton respektiert die Stummschaltung (FA-IN-07); Brettumriss einheitlich „spitz“ (FA-PL-07); Zufall und Abnahmeplattformen präzisiert (NFA-ZF-01, -02, NFA-PL-01); lokales Testen über HTTPS (EP-06); OP-01, OP-02, OP-09 geklärt; neue Entscheidungen E-14 bis E-20; neuer offener Punkt OP-12 |
| 0.8 | 06.10.2026 | Ergebnisse der Setup-Planung: OP-12 geklärt (E-21, Adresse `https://boardbrain.github.io/`); Arbeitsweise mit Story-Bündeln, Haltepunkten und Abnahme durch den Product Owner (neu EP-10 bis EP-12, E-22); `main` vor Release 1.0 nur mit Platzhalter (EP-02 präzisiert, E-25); Arbeitsbranches und Pull Requests präzisiert (EP-03, EP-04); Lizenz MIT (E-23); Barrierefreiheit ausdrücklich kein Ziel von Version 1 (E-24); Modelleinsatz für Setup und kritische Teile ergänzt (9.3); neuer offener Punkt OP-13 (Vorabversionen) |
| 0.9 | 06.10.2026 | Lizenz von MIT auf PolyForm Strict License 1.0.0 geändert (E-23) (PR #1) |
| 0.10 | 07.10.2026 | OP-13 ergänzt: Abnahme auf dem iPhone nur über Geräte von Freunden (PR #2) |
| 0.11 | 07.10.2026 | Nächste Schritte nach Abschluss des Setups: Umsetzung beginnt vor dem Design; OP-11 parallel zu I1, OP-06 vor I5; Verweis auf `docs/Umsetzungsplan.md` (13) |
| 0.12 | 07.10.2026 | Übersicht über Personen und Gruppen mit Detailansichten (neu FA-VW-06) (PR #13) |
| 0.13 | 07.10.2026 | Design D-1: OP-11 geklärt (E-26); wählbare Designs mit Standard „Holz“ und Standard-Akzent je Design statt einer einzelnen Akzentfarbe mit Standard Lila (NFA-GB-03) |
| 0.14 | 08.10.2026 | Abnahme von I1-C: globale Gruppen können Catan ausschließen (FA-PG-04, E-27); überarbeitete Gruppenfarben-Palette und Kontrastregel für Spielfarben (E-28, E-26 angepasst) |
| 0.15 | 08.10.2026 | Design D-3: Smartphones nur im Hochformat, Tablets und PC in beiden Ausrichtungen (NFA-PL-04 präzisiert, E-29) |
| 0.16 | 09.10.2026 | Einstellung „Ich hasse Catan!“ blendet die Catan-Funktionen app-weit aus (FA-SP-06, E-30) |

## Inhaltsverzeichnis

1. Einleitung
2. Produktvision und Ziele
3. Glossar
4. Stakeholder und Nutzer
5. Funktionale Anforderungen
6. Regelwerk Catan, Modus „Standard“
7. Nicht-funktionale Anforderungen
8. Rahmenbedingungen
9. Entwicklungsprozess
10. Getroffene Entscheidungen
11. Offene Punkte
12. Parkplatz (spätere Erweiterungen)
13. Nächste Schritte

---

## 1. Einleitung

### 1.1 Zweck des Dokuments

Dieses Dokument hält alle Anforderungen, Rahmenbedingungen und Entscheidungen fest, die während der Anforderungserhebung zu BoardBrain erarbeitet wurden. Es ist die verbindliche Grundlage für die anschließende Spezifikation, die Architektur und die Umsetzung. Änderungen an Anforderungen werden hier nachgeführt und in der Änderungshistorie dokumentiert. Die prüfbaren Abnahmekriterien zu diesen Anforderungen enthält die Spezifikation (BoardBrain_Spezifikation.md), die technische Umsetzung beschreibt die Architektur (BoardBrain_Architektur.md).

### 1.2 Ausgangslage

Die Initiatoren spielen eine abgewandelte Variante von Catan, bei der die Startgebäude nicht von den Spielern gewählt, sondern zufällig platziert werden. Bisher werden dafür die Kreuzungen des Spielbretts manuell nummeriert und ein externer Zufallsgenerator verwendet. Landschaftsfelder, Häfen und Zahlenchips werden weiterhin physisch gemischt und gelegt. Ziel ist es, diesen Ablauf grafisch, nachvollziehbar und mit kryptografisch sicherem Zufall in einer App abzubilden und gleichzeitig Spielergebnisse langfristig auszuwerten.

### 1.3 Geltungsbereich

Version 1 umfasst die Zufallsgenerierung für Catan (Modus „Standard“) sowie die Verwaltung von Personen, Gruppen, Spielen, Partien, Ergebnissen und Statistiken. Weitere Spiele mit Generator, weitere Modi und Synchronisation sind ausdrücklich nicht Teil von Version 1, müssen aber architektonisch ermöglicht werden (siehe Kapitel 7.6 und 12). Version 1 wird erst veröffentlicht, wenn alle in diesem Dokument enthaltenen Anforderungen umgesetzt sind (E-10).

---

## 2. Produktvision und Ziele

### 2.1 Produktvision

BoardBrain ist eine plattformunabhängige, vollständig offline nutzbare App, die Brettspielabende unterstützt. Sie übernimmt alle Zufallsentscheidungen beim Spielaufbau, inszeniert diese spannend und fair, und baut über alle Partien einer Gruppe hinweg eine aussagekräftige Langzeitstatistik auf. Die App beginnt mit Catan und ist so angelegt, dass weitere Spiele, Modi und Funktionen ergänzt werden können.

### 2.2 Ziele

| ID | Ziel |
|---|---|
| Z-01 | Die manuelle Nummerierung von Kreuzungen und der externe Zufallsgenerator werden vollständig durch die App ersetzt. |
| Z-02 | Alle Zufallsentscheidungen sind fair, unvorhersehbar und gleichverteilt. |
| Z-03 | Der Aufbau einer Partie wird als spannendes, schrittweises Erlebnis gestaltet. |
| Z-04 | Spielergebnisse werden pro Gruppe dauerhaft erfasst und ausgewertet. |
| Z-05 | Die App verursacht keine Kosten und erfordert keinen eigenen Serverbetrieb. |
| Z-06 | Die App ist ohne grundlegenden Umbau um weitere Spiele, Modi und Regeln erweiterbar. |

---

## 3. Glossar

| Begriff | Definition |
|---|---|
| Spiel | Ein Brettspiel als Typ, z. B. Catan oder Uno. |
| Unterstütztes Spiel | Ein Spiel, für das die App eine Generierung anbietet. In Version 1 nur Catan. |
| Eigenes Spiel | Ein vom Nutzer angelegtes Spiel ohne Generierung, das ausschließlich der Ergebniserfassung dient. |
| Spielversion | Variante eines Spiels. Bei Catan: Basisspiel oder Erweiterung Städte & Ritter. |
| Modus | Regelwerk, nach dem die Generierung abläuft, z. B. „Standard“. Ein Spiel kann mehrere Modi haben. |
| Person | Ein Mensch, der an Partien teilnimmt. Eine Person kann mehreren Gruppen angehören. |
| Gruppe | Feste Zusammensetzung von 2 bis 12 Personen. Bei jeder Partie einer Gruppe sind alle ihre Mitglieder beteiligt. Die Mitglieder sind nach dem Anlegen unveränderlich. |
| Globale Gruppe | Gruppe, deren Partien zu beliebigen Spielen gehören können. |
| Spielgebundene Gruppe | Gruppe, deren Partien ausschließlich zu einem bestimmten Spiel gehören. |
| Gruppenfarbe | Spielunabhängige Farbe einer Person innerhalb einer Gruppe, verwendet in Ergebnislisten, Rangliste und Diagrammen. |
| Spielfarbe | Spielspezifische Farbe einer Person innerhalb einer Gruppe, die den Spielfiguren entspricht. In Version 1 nur bei Catan (Catan-Farbe). |
| Archivieren | Ausblenden einer Person, einer Gruppe oder eines eigenen Spiels aus allen Auswahllisten, ohne Daten oder Statistiken zu verändern. Rückgängig machbar. |
| Partie | Eine einzelne gespielte Runde eines Spiels durch eine Gruppe an einem bestimmten Datum. Eine Partie hat keinen eigenen Namen. Gespeichert wird eine Partie nur mit ihrem Ergebnis. |
| Laufende Partie | Eine Partie, deren Vorbereitung oder Generierung begonnen hat und die noch nicht beendet ist. Es gibt höchstens eine. |
| Ergebnis | Die zu einer Partie erfassten Daten: Datum, optional Uhrzeit, Sieger bzw. Unentschieden, optional Siegpunkte aller Beteiligten und Notizen; bei Catan zusätzlich Spielversion, Modus und Catan-Farben. |
| Generierung | Der von der App gesteuerte, schrittweise Ablauf aller Zufallsentscheidungen beim Aufbau einer Partie. |
| Losschritt | Ein einzelner Zufallsentscheid innerhalb der Generierung, z. B. „Wer legt die Häfen?“. |
| Schritt | Kleinste Einheit der Generierung, die einzeln dargestellt, bestätigt und wiederholt wird: ein Dreh des Glücksrads, ein Gebäude, eine Straße oder die Startrohstoffe einer Person. |
| Kreuzung | Eckpunkt zwischen Feldern, an dem Siedlungen und Städte stehen. |
| Kante | Verbindung zwischen zwei Kreuzungen, auf der Straßen liegen. |
| Inlandkreuzung | Kreuzung, die an drei Landfelder grenzt, also nicht an Wasser. |
| Sackgasse | Stand der Platzierung, in dem für ein weiteres Gebäude keine gültige Kreuzung mehr existiert. |
| Schlangenreihenfolge | Platzierungsreihenfolge, die einmal vorwärts und anschließend rückwärts durchlaufen wird (z. B. P1, P2, P3, P3, P2, P1). |
| Startrohstoffe | Rohstoffe, die jede Person zu Spielbeginn erhält. |
| Sicherungspunkt | Von der App intern angelegter Stand aller Nutzerdaten (ohne Einstellungen), der wiederhergestellt werden kann. |
| Vollsicherung | Export aller Nutzerdaten einschließlich Einstellungen und Hinweisstand in eine Datei, z. B. zum Schutz vor Datenverlust oder für einen Gerätewechsel. Ersetzt den früheren Exportumfang „Alle Daten“. |
| Installierte App | Die auf dem Home-Bildschirm bzw. als App im Betriebssystem installierte PWA, im Unterschied zur Nutzung in einem Browser-Tab. |
| Persistenter Speicher | Vom Browser gewährter Schutz, der die Daten der App bei Speicherknappheit von der automatischen Löschung ausnimmt. |
| Kennung | Zufällig erzeugte, weltweit eindeutige ID eines Datensatzes. |
| Zuordnung | Beim Import getroffene Festlegung, dass ein importierter Datensatz einem vorhandenen Datensatz mit anderer Kennung entspricht. Sie wird bei jedem Import manuell getroffen und nicht gespeichert. |

---

## 4. Stakeholder und Nutzer

| Rolle | Beschreibung | Interessen |
|---|---|---|
| Initiator / Product Owner | Auftraggeber und Hauptnutzer, entwickelt die App gemeinsam mit Claude. | Funktionsumfang, Erweiterbarkeit, Wartbarkeit des Codes, keine Kosten |
| Spielende (Freundeskreis) | Teilnehmende an Partien, ggf. in mehreren Gruppen. | Fairness, Spannung, nachvollziehbare Statistik |
| Bedienende Person am Tisch | Die Person, die während der Generierung das zentrale Gerät bedient. | Einfache, schnelle Bedienung, gute Ablesbarkeit |

**Nutzungskontext:** Die App wird während eines Spieleabends auf einem zentralen Gerät (Smartphone oder Tablet) genutzt, das in derselben Ausrichtung wie das physische Spielbrett neben dieses gelegt wird. Es gibt keine Benutzerkonten und keine Anmeldung.

---

## 5. Funktionale Anforderungen

Die Anforderungen sind mit eindeutigen IDs versehen. Die Priorisierung nach MoSCoW und die Abnahmekriterien enthält die Spezifikation.

### 5.1 Spiele

| ID | Anforderung |
|---|---|
| FA-SP-01 | Beim Start einer Generierung muss zunächst das Spiel ausgewählt werden. In Version 1 steht Catan zur Verfügung. |
| FA-SP-02 | Nutzer können eigene Spiele anlegen (z. B. Uno), die nur der Ergebniserfassung dienen. |
| FA-SP-03 | Eigene Spiele werden in einem separaten Bereich „Eigene Spiele“ angezeigt und sind dadurch von unterstützten Spielen unterscheidbar. |
| FA-SP-04 | Für unterstützte Spiele können eine Spielversion und ein Modus gewählt werden. |
| FA-SP-05 | Spielfarben und Siegpunkte sind spielspezifische Merkmale. Jedes Spiel legt fest, ob es diese unterstützt. In Version 1 unterstützt ausschließlich Catan Spielfarben (Rot, Blau, Weiß, Orange) und Siegpunkte; eigene Spiele haben keine Spielfarben und keine Siegpunkte. Gruppenfarben (FA-PG-07) sind davon unabhängig. *(geändert in 0.4)* |
| FA-SP-06 | Die Einstellung „Ich hasse Catan!“ (Untertitel „Die Catan-Funktionen werden ausgeblendet.“) blendet Catan app-weit aus: keine Generierung und keine neue Catan-Partie, Catan in keiner Spielauswahl, bei allen Gruppen ist Catan ausgeschlossen und die Bindung „Nur Catan“ nicht wählbar. Bisherige Catan-Ergebnisse bleiben sichtbar. Das Einschalten erfordert eine Bestätigung nach einer Warnung; die Einstellung ist jederzeit umkehrbar und verändert die gespeicherten Einstellungen der Gruppen nicht. Standard ist aus. *(neu in 0.16)* |

### 5.2 Personen und Gruppen

| ID | Anforderung |
|---|---|
| FA-PG-01 | Nutzer können beliebig viele Personen anlegen. |
| FA-PG-02 | Nutzer können beliebig viele Gruppen anlegen. |
| FA-PG-03 | Eine Gruppe besteht aus einer festen Menge von Personen. Eine Person kann mehreren Gruppen angehören. |
| FA-PG-04 | Eine Gruppe ist entweder global oder an genau ein Spiel gebunden. Eine globale Gruppe kann Catan ausschließen; sie spielt dann alle übrigen Spiele und hat keine Catan-Farben. *(ergänzt in 0.14)* |
| FA-PG-05 | Bei Spielen mit Spielfarben (FA-SP-05) hat jede Person innerhalb einer Gruppe, die dieses Spiel spielen kann, je Spiel eine Standard-Spielfarbe. *(präzisiert in 0.4)* |
| FA-PG-06 | Die Spielfarbe einer Person kann für eine einzelne Partie abweichend gewählt werden, ohne die Standardfarbe zu verändern. |
| FA-PG-07 | Jede Person hat innerhalb einer Gruppe eine Gruppenfarbe aus einer modernen, spielunabhängigen Palette, die auch die vier Catan-Farben enthält. Gruppenfarbe und Catan-Farbe dürfen gleich sein. In an Catan gebundenen Gruppen ist die Catan-Farbe zugleich die Gruppenfarbe. *(neu in 0.4)* |
| FA-PG-08 | Farben gelten ausschließlich innerhalb einer Gruppe und sind dort je Farbart eindeutig. Wird eine bereits belegte Farbe gewählt, tauschen die beiden Personen ihre Farben. Beim Anlegen einer Gruppe werden freie Farben automatisch der Reihe nach vergeben; Farben aus anderen Gruppen werden weder übernommen noch vorgeschlagen. *(neu in 0.4)* |
| FA-PG-09 | Eine Gruppe hat einen Namen und 2 bis 12 Mitglieder. Die Mitglieder sind nach dem Anlegen unveränderlich. Innerhalb einer Gruppe sind die Personennamen eindeutig, damit Personen beim Import eindeutig zugeordnet werden können. *(neu in 0.4, ergänzt in 0.5)* |
| FA-PG-10 | Catan kann nur von Gruppen mit 2 bis 4 Mitgliedern gespielt werden. Eine an Catan gebundene Gruppe hat höchstens 4 Mitglieder. *(neu in 0.4)* |

### 5.3 Ablauf einer Partie mit Generierung

| ID | Anforderung |
|---|---|
| FA-AB-01 | Der Ablauf beginnt mit der Auswahl von Spiel und Gruppe. Alle Mitglieder der Gruppe gelten als beteiligt. |
| FA-AB-02 | Vor der Generierung werden Spielversion, Modus und Optionen festgelegt, insbesondere welche Losschritte aktiv sind und ob Startrohstoffe gezogen werden. |
| FA-AB-03 | Jeder Schritt der Generierung muss vom Nutzer ausdrücklich bestätigt werden, bevor der nächste beginnt. Es gibt keinen automatischen Durchlauf. Ein Schritt ist ein Dreh des Glücksrads, ein Gebäude, eine Straße oder die Startrohstoffe einer Person; jedes Gebäude und jede Straße hat eine eigene Animation. *(präzisiert in 0.4)* |
| FA-AB-04 | Jeder Schritt kann wiederholt werden, solange die Partie läuft. Vor der Wiederholung erscheint eine Warnung. Verworfen werden nur die vom wiederholten Schritt abhängigen Folgeschritte: bei einem Gebäude die zugehörige Straße und alle späteren Gebäude und Straßen, bei der Platzierungsreihenfolge die Platzierung; bei LS-01, LS-03, LS-04, einer Straße oder Startrohstoffen keine. Wiederholungen werden nicht protokolliert. *(präzisiert in 0.4)* |
| FA-AB-05 | Nach Abschluss der Generierung bleibt das Ergebnis während der laufenden Partie einsehbar. |
| FA-AB-06 | Nach der Generierung bietet die App das Eintragen eines Ergebnisses an. Dies ist optional und kein Pflichtschritt. |
| FA-AB-07 | Es gibt höchstens eine laufende Partie. Sie übersteht das Schließen und Neustarten der App unverändert. Das Ergebnis eines Schritts steht fest, bevor seine Animation beginnt; wird die App während einer Animation beendet, wird diese nach dem Neustart mit demselben Ergebnis erneut abgespielt. *(neu in 0.4, ergänzt in 0.7)* |
| FA-AB-08 | Eine laufende Partie endet mit dem Speichern eines Ergebnisses oder mit „Beenden ohne Ergebnis“. Danach wird die Generierung verworfen; gespeichert bleibt nur ein ggf. erfasstes Ergebnis. *(neu in 0.4)* |
| FA-AB-09 | Solange eine Partie in Generierung oder laufend ist, sind Import, Wiederherstellung eines Sicherungspunkts sowie Archivieren, Löschen und Ändern der Spielbindung der beteiligten Gruppe gesperrt. Die App nennt den Grund und bietet an, die Partie vorher zu beenden. *(neu in 0.7)* |

### 5.4 Losschritte (Catan, Modus „Standard“)

Die Losschritte werden in der Reihenfolge LS-01, LS-03, LS-04, LS-02 ausgeführt; anschließend folgen Platzierung und Startrohstoffe. LS-01, LS-03 und LS-04 sind einzeln aktivierbar bzw. überspringbar. LS-02 ist immer aktiv, da die Platzierung zum Kern gehört. *(geändert in 0.4)*

| ID | Anforderung |
|---|---|
| FA-LS-01 | Losen, welche Person die gemischten Landschaftsfelder auslegt. |
| FA-LS-02 | Losen der Platzierungsreihenfolge aller beteiligten Personen in aufeinanderfolgenden Drehs des Glücksrads; der letzte Platz ergibt sich automatisch. Die Person auf Platz 1 beginnt anschließend auch das Spiel. *(präzisiert in 0.4)* |
| FA-LS-03 | Losen, welche Person die gemischten Häfen auslegt. |
| FA-LS-04 | Losen, welche Person die Zahlenchips aus dem Beutel auf die Felder legt. |
| FA-LS-05 | Das Losen einer Person (FA-LS-01, 03, 04) wird als wiederverwendbarer, spielunabhängiger Baustein umgesetzt. |
| FA-LS-06 | Die Ziehungen von FA-LS-01, 03 und 04 sind unabhängig; dieselbe Person kann mehrfach gelost werden. *(neu in 0.4)* |

### 5.5 Platzierung von Gebäuden und Straßen

| ID | Anforderung |
|---|---|
| FA-PL-01 | Die App bestimmt zufällig die Position aller Startgebäude und der zugehörigen Straßen nach den Regeln des gewählten Modus (siehe Kapitel 6). |
| FA-PL-02 | Die Platzierung erfolgt in Schlangenreihenfolge auf Basis der gelosten Platzierungsreihenfolge. |
| FA-PL-03 | Im Basisspiel platziert jede Person zwei Siedlungen mit je einer Straße. |
| FA-PL-04 | Mit Städte & Ritter platziert jede Person in der Vorwärtsrunde eine Siedlung und in der Rückwärtsrunde eine Stadt, jeweils mit einer Straße. |
| FA-PL-05 | Siedlungen und Städte sind grafisch klar unterscheidbar. |
| FA-PL-06 | Gebäude und Straßen werden in der Farbe der jeweiligen Person dargestellt. |
| FA-PL-07 | Die Darstellung des Bretts entspricht der Ausrichtung des physischen Bretts: Felder mit nach oben zeigender Spitze in Reihen mit 3, 4, 5, 4 und 3 Feldern von oben nach unten; der Umriss des Bretts ist oben und unten gerade und links und rechts spitz. *(präzisiert in 0.4, vereinheitlicht in 0.7)* |
| FA-PL-08 | Die App kennt in Version 1 weder Landschaften noch Zahlenchips. Das Brett wird ohne Inhalte dargestellt. |
| FA-PL-09 | Die Platzierung ist fester Bestandteil der Generierung. Zu ihrem Beginn bietet ein kleiner Button an, sie ausnahmsweise zu überspringen. *(neu in 0.4)* |

### 5.6 Startrohstoffe

| ID | Anforderung |
|---|---|
| FA-SR-01 | Das Ziehen der Startrohstoffe ist eine aktivierbare Option. Standard ist deaktiviert. *(präzisiert in 0.4)* |
| FA-SR-02 | Jede Person erhält eine einstellbare Anzahl von 1 bis 5 Startrohstoffen (Standard: 2), die zufällig aus den fünf Rohstoffarten gezogen werden (Holz, Lehm, Wolle, Getreide, Erz). |
| FA-SR-03 | Einstellbar ist, ob mit oder ohne Zurücklegen gezogen wird. Standard ist mit Zurücklegen, wobei doppelte Rohstoffe möglich sind. Ohne Zurücklegen erhält jede Person nur unterschiedliche Rohstoffe. |
| FA-SR-04 | Die Startrohstoffe werden nach der Platzierung gezogen, je Person ein Schritt in Platzierungsreihenfolge. *(neu in 0.4)* |

### 5.7 Inszenierung

| ID | Anforderung |
|---|---|
| FA-IN-01 | Die Platzierung wird schrittweise dargestellt, wobei Kreuzungen und Kanten vor der Festlegung aufblinken. |
| FA-IN-02 | Das Losen von Personen wird als Glücksrad dargestellt. |
| FA-IN-03 | Die Generierung wird von dezenten Soundeffekten begleitet. |
| FA-IN-04 | Es wird keine Vibration verwendet. |
| FA-IN-05 | Ein Tonschalter in den Einstellungen schaltet alle Soundeffekte ab. Standard ist eingeschaltet. *(neu in 0.4)* |
| FA-IN-06 | Animationen lassen sich nur über einen klar beschrifteten Button überspringen; Antippen anderer Stellen beschleunigt oder überspringt nichts. Eine Einstellung für das Animationstempo gibt es nicht. *(neu in 0.4)* |
| FA-IN-07 | Soundeffekte respektieren die Stummschaltung des Geräts, soweit die Plattform das erlaubt, und unterbrechen keine Musikwiedergabe anderer Apps. *(neu in 0.7)* |

### 5.8 Ergebnisse

| ID | Anforderung |
|---|---|
| FA-ER-01 | Ein Ergebnis kann jederzeit eingetragen werden, auch ohne vorherige Generierung, als Nachtrag oder für eigene Spiele. |
| FA-ER-02 | Ein Ergebnis enthält Datum (Standard: heute), Gruppe, Spiel und den Sieger. Ein Unentschieden zwischen mehreren Personen ist möglich. Optional kann eine Uhrzeit erfasst werden, die sich mit „Jetzt“ auf die aktuelle Uhrzeit setzen lässt. *(präzisiert in 0.4)* |
| FA-ER-03 | Bei Catan ist die Spielversion Pflicht, der Modus optional. Notizen sind optional. Bei Spielen mit Siegpunkten (FA-SP-05) können zusätzlich die Siegpunkte aller beteiligten Personen erfasst werden. *(geändert in 0.4)* |
| FA-ER-04 | Ergebnisse können nachträglich bearbeitet und gelöscht werden. Zuvor erscheint eine ausdrückliche Warnung, dass dies die Statistik verändert. |
| FA-ER-05 | Kooperative Spiele werden in Version 1 nicht unterstützt. |
| FA-ER-06 | Siegpunkte werden für alle Beteiligten oder für keinen erfasst, als ganze Zahlen ab 0. Hat ein Sieger nicht die höchste Punktzahl oder haben Unentschieden-Sieger unterschiedliche Punktzahlen, erscheint eine Warnung; das Speichern bleibt nach Bestätigung möglich. *(neu in 0.4)* |
| FA-ER-07 | Ein Unentschieden umfasst zwei bis alle Beteiligten. Abgebrochene Partien ohne Sieger werden nicht erfasst. *(neu in 0.4)* |
| FA-ER-08 | Partien werden nach Datum, innerhalb eines Tages nach Uhrzeit sortiert; Partien ohne Uhrzeit folgen denen mit Uhrzeit, untereinander in Erfassungsreihenfolge. *(neu in 0.4)* |
| FA-ER-09 | Bei Catan werden die in der Partie verwendeten Catan-Farben mit dem Ergebnis gespeichert. Sie gehen nicht in die Statistik ein. *(neu in 0.4)* |

### 5.9 Statistik

| ID | Anforderung |
|---|---|
| FA-ST-01 | Statistiken werden ausschließlich pro Gruppe geführt. Gruppenübergreifende Auswertungen sind in Version 1 nicht vorgesehen. |
| FA-ST-02 | Folgende Kennzahlen werden je Person bereitgestellt: Anzahl Partien, Siege, Siegquote, Unentschieden sowie aktuelle und längste Siegesserie; Niederlagen und Unentschieden beenden eine Serie. Bei Spielen mit Siegpunkten (FA-SP-05) zusätzlich die Durchschnittssiegpunkte, gebildet nur über Partien mit erfassten Siegpunkten. *(präzisiert in 0.4)* |
| FA-ST-03 | Es gibt eine Rangliste innerhalb der Gruppe. Das Sortierkriterium ist manuell wählbar; Standard sind die Siege. *(präzisiert in 0.4)* |
| FA-ST-04 | Es gibt eine grafische Darstellung des Verlaufs über die Zeit (kumulierte Siege je Person) sowie der Verteilung der Siege (je Person und Anteil der Unentschieden). *(präzisiert in 0.4)* |
| FA-ST-05 | Unentschieden werden als eigene Kategorie gezählt, nicht als Sieg. |
| FA-ST-06 | Bei globalen Gruppen lässt sich die Statistik nach Spiel filtern. |
| FA-ST-07 | Bei Catan lässt sich die Statistik nach Spielversion (Basisspiel, Städte & Ritter) filtern und zusätzlich als Gesamtauswertung über alle Catan-Partien anzeigen. |

### 5.10 Export und Import

| ID | Anforderung |
|---|---|
| FA-EI-01 | Daten können exportiert und importiert werden. Ein Export umfasst je nach Auswahl Personen, Gruppen, Spiele, Partien und Ergebnisse. |
| FA-EI-02 | Der Umfang eines Exports ist frei wählbar: Vollsicherung (FA-EI-09), einzelne oder mehrere Gruppen, einzelne oder mehrere Spiele sowie frei ausgewählte einzelne Partien einer Gruppe (z. B. fünf bestimmte Partien). *(präzisiert in 0.6 und 0.7)* |
| FA-EI-03 | Beim Import fragt die App bei jedem Konflikt mit vorhandenen Daten im Einzelfall nach, wie verfahren werden soll. Konflikte sind: gleiche Kennung mit anderem Inhalt („Meine behalten“ oder „Importierte übernehmen“) und mögliche Dubletten von Partien („Beide behalten“ oder „Importierte überspringen“). Identische Datensätze werden ohne Rückfrage übersprungen. Der Archivstatus zählt beim Vergleich nicht zum Inhalt; bei vorhandenen Datensätzen bleibt der lokale Archivstatus erhalten. *(präzisiert in 0.4 und 0.7)* |
| FA-EI-04 | Jeder der letzten drei Importe kann nachträglich vollständig rückgängig gemacht werden, indem der Sicherungspunkt vor dem Import wiederhergestellt wird. Spätere Änderungen gehen dabei verloren; darauf wird vorher gewarnt. *(präzisiert in 0.4)* |
| FA-EI-05 | Die App erinnert klein und unaufdringlich an eine Vollsicherung, wenn seit der letzten Vollsicherung Daten geändert wurden und diese mehr als 30 Tage zurückliegt oder seitdem mindestens 10 neue Ergebnisse erfasst wurden. Teilexporte setzen die Erinnerung nicht zurück. „Später“ blendet die Erinnerung für 7 Tage aus. *(präzisiert in 0.4 und 0.7)* |
| FA-EI-06 | Importierte Gruppen, Personen und eigene Spiele mit unbekannter Kennung können vorhandenen Datensätzen zugeordnet oder neu angelegt werden, z. B. um Partien von Freunden der eigenen Gruppe mit denselben Personen zuzuordnen. Zuordnungen werden bei jedem Import manuell getroffen; die App belegt keine Auswahl vor und speichert keine Zuordnungen. Fehlerhafte Zuordnungen werden über den Sicherungspunkt vor dem Import behoben (FA-DS-02, FA-EI-04). *(neu in 0.4, geändert in 0.6)* |
| FA-EI-07 | Ein Import fügt nur hinzu oder aktualisiert; er löscht nie lokale Daten. *(neu in 0.4)* |
| FA-EI-08 | Teilexporte enthalten automatisch alle benötigten Personen, Gruppen und Spiele. *(neu in 0.4)* |
| FA-EI-09 | Die Vollsicherung enthält alle Personen, Gruppen, eigenen Spiele, Partien und Ergebnisse sowie die Einstellungen und den Stand von Hinweisen und Erinnerungen. Nicht enthalten sind Sicherungspunkte und eine laufende Partie. Teilexporte enthalten keine Einstellungen. *(neu in 0.7)* |
| FA-EI-10 | Enthält eine importierte Datei Einstellungen, fragt die App einmal, ob diese übernommen werden sollen. Beim Einspielen in einen leeren Datenbestand werden alle Datensätze ohne Rückfrage und mit ihren Kennungen übernommen. *(neu in 0.7)* |
| FA-EI-11 | Würde eine Importoption eine Regel verletzen (z. B. doppelte Personennamen in einer Gruppe oder eine Spielbindung, die nicht zu den Partien passt), wird sie deaktiviert und mit Begründung angezeigt; mindestens eine zulässige Option bleibt stets verfügbar. *(neu in 0.7)* |
| FA-EI-12 | Exportdateien werden über das Teilen-Menü des Systems weitergegeben oder, wo dieses fehlt, heruntergeladen. Importiert wird über die Dateiauswahl. Ein Austausch per QR-Code ist nicht vorgesehen. *(neu in 0.7)* |

### 5.11 Datensicherung

| ID | Anforderung |
|---|---|
| FA-DS-01 | Die App legt automatisch interne Sicherungspunkte an, aus denen ein früherer Datenstand wiederhergestellt werden kann. |
| FA-DS-02 | Vor jedem Import wird automatisch ein Sicherungspunkt angelegt (Grundlage für FA-EI-04). |
| FA-DS-03 | Die Vollsicherung ist der vorgesehene Schutz gegen Datenverlust durch Deinstallation, Gerätewechsel, Defekt oder das Löschen von Browserdaten. Dies wird dem Nutzer verständlich kommuniziert, einschließlich des Hinweises, dass das Entfernen des App-Symbols einer Deinstallation gleichkommt. *(präzisiert in 0.7)* |
| FA-DS-04 | Sicherungspunkte entstehen zusätzlich vor jeder Wiederherstellung, vor jedem Löschen von Person, Gruppe, Spiel oder Ergebnis, vor jedem Update sowie beim ersten Start oder der ersten Rückkehr der App in den Vordergrund an einem Kalendertag, sofern sich seit dem letzten Sicherungspunkt etwas geändert hat. *(neu in 0.4, ergänzt in 0.7)* |
| FA-DS-05 | Es werden höchstens 15 Sicherungspunkte aufbewahrt; der älteste wird zuerst entfernt, ausgenommen die Sicherungspunkte der letzten drei Importe. *(neu in 0.4)* |
| FA-DS-06 | Der Nutzer kann zusätzlich manuell einen Sicherungspunkt anlegen. *(neu in 0.4)* |
| FA-DS-07 | Sicherungspunkte umfassen Personen, Gruppen, eigene Spiele, Partien und Ergebnisse, aber keine Einstellungen und keine laufende Partie. Eine Wiederherstellung lässt die Einstellungen unverändert. *(neu in 0.7)* |

### 5.12 Updates

| ID | Anforderung |
|---|---|
| FA-UP-01 | Ist eine neue Version verfügbar, zeigt die App einen unaufdringlichen Hinweis. |
| FA-UP-02 | Der Nutzer entscheidet selbst, wann das Update angewendet wird. Eine neue Version wird ausschließlich nach seiner ausdrücklichen Bestätigung aktiv, auch nicht automatisch nach einem Neustart der App. Während einer Partie in Vorbereitung, Generierung oder laufend wird kein Update angeboten oder angewendet. *(präzisiert in 0.7)* |
| FA-UP-03 | Vor jedem Update bietet ein Dialog an, zuerst eine Vollsicherung zu erstellen. Er nennt das Datum der letzten Vollsicherung und die seitdem erfassten Ergebnisse. *(neu in 0.7)* |

### 5.13 Verwaltung *(neu in 0.4)*

| ID | Anforderung |
|---|---|
| FA-VW-01 | Personen können umbenannt werden, sofern dadurch in keiner ihrer Gruppen ein doppelter Name entsteht, und archiviert werden. Löschen ist nur möglich, wenn die Person keiner Gruppe angehört, auch keiner archivierten. *(ergänzt in 0.5)* |
| FA-VW-02 | Gruppen können umbenannt, in ihren Farben geändert und in ihrer Spielbindung geändert werden, sofern alle bestehenden Partien und die Mitgliederzahl zur neuen Bindung passen. Die Mitglieder sind nicht änderbar. |
| FA-VW-03 | Gruppen können archiviert und wiederbelebt werden; Partien und Statistik bleiben dabei erhalten. Aktive und archivierte Gruppen können nach deutlicher Warnung gelöscht werden; dabei werden alle ihre Partien entfernt. |
| FA-VW-04 | Eigene Spiele können umbenannt und archiviert werden. Löschen ist nur ohne zugehörige Ergebnisse möglich. Catan kann weder umbenannt noch archiviert noch gelöscht werden. |
| FA-VW-05 | Archivierte Personen, Gruppen und Spiele erscheinen in keiner Auswahlliste für neue Daten, bleiben aber in bestehenden Daten und Statistiken sichtbar. |
| FA-VW-06 | Die Personenliste zeigt zu jeder Person ihre Gruppen. Personen und Gruppen lassen sich antippen und öffnen eine Detailansicht: bei Personen mit ihren Gruppen, bei Gruppen mit Bindung, Mitgliedern und deren Farben. Gruppen und Mitglieder sind in den Detailansichten wiederum antippbar. *(neu in 0.12)* |

### 5.14 Installation und Speicherschutz *(neu in 0.7)*

| ID | Anforderung |
|---|---|
| FA-IS-01 | Unter iOS und iPadOS ist die App nur als installierte App nutzbar, weil installierte App und Browser-Tab dort getrennte Speicher haben. Im Safari-Tab zeigt die App ausschließlich eine bebilderte Installationsanleitung, in anderen Browsern den Hinweis, die Seite in Safari zu öffnen. |
| FA-IS-02 | Unter Android und Windows zeigt die App im Browser-Tab einen wegklickbaren Hinweis zur Installation. |
| FA-IS-03 | Die App fordert beim Start persistenten Speicher an und zeigt dessen Status im Bereich „Sicherung“. Ist er nicht gewährt, warnt sie deutlich und erklärt mögliche Ursachen, etwa eine Browsereinstellung, die Websitedaten beim Schließen löscht. |

---

## 6. Regelwerk Catan, Modus „Standard“

### 6.1 Brett

- Standardbrett mit 19 Feldern, 54 Kreuzungen und 72 Kanten
- 24 der 54 Kreuzungen sind Inlandkreuzungen; es sind genau die Eckpunkte des Mittelfelds und der sechs umliegenden Felder
- 2 bis 4 beteiligte Personen

### 6.2 Gebäude

1. Gebäude dürfen ausschließlich auf Inlandkreuzungen platziert werden.
2. Es gilt die Abstandsregel: Eine Kreuzung ist ungültig, wenn sie direkt an eine Kreuzung mit einem bestehenden Gebäude angrenzt.
3. Jede gültige Kreuzung hat bei jeder einzelnen Ziehung exakt dieselbe Auswahlwahrscheinlichkeit.
4. *(korrigiert in 0.4)* Bei 2 und 3 Personen (höchstens 6 Gebäude) steht stets eine gültige Kreuzung zur Verfügung, da 5 Gebäude höchstens 20 Inlandkreuzungen blockieren. Bei 4 Personen (8 Gebäude) kann dagegen eine Sackgasse entstehen. Beispiel: Die sechs Inlandkreuzungen, die von den Ecken des Mittelfelds jeweils eine Kante nach außen liegen, grenzen nicht aneinander, blockieren zusammen aber alle 24 Inlandkreuzungen. Die bisherige Aussage, dass bei 4 Personen stets eine gültige Kreuzung verbleibt, war falsch.
5. *(neu in 0.4)* Behandlung von Sackgassen: Ein Durchlauf, der in eine Sackgasse führt, wird verworfen und neu gelost, ab Beginn der Platzierung bzw. ab dem wiederholten Gebäude. Bereits angezeigte und bestätigte Gebäude werden dabei nie zurückgenommen; eine Sackgasse ist für Nutzer nie sichtbar (E-09).
6. *(neu in 0.4)* Folge für die Fairness: Jede einzelne Ziehung bleibt gleichverteilt. Die Gesamtverteilung ist auf Durchläufe ohne Sackgasse bedingt; das wird bewusst in Kauf genommen. Eine vorausschauende Gültigkeitsprüfung ist als PP-14 geparkt.

### 6.3 Straßen

1. Die Straße wird zufällig und gleichverteilt aus allen an das jeweilige Gebäude angrenzenden Kanten gewählt.
2. Es gelten keine weiteren Einschränkungen: Straßen dürfen an der Küste entlang verlaufen, in Richtungen zeigen, in denen kein weiteres Gebäude möglich ist, und an Straßen oder Gebäude anderer Personen angrenzen.

### 6.4 Platzierungsreihenfolge

| Runde | Basisspiel | Städte & Ritter |
|---|---|---|
| Vorwärts (P1 → Pn) | Siedlung + Straße | Siedlung + Straße |
| Rückwärts (Pn → P1) | Siedlung + Straße | Stadt + Straße |

---

## 7. Nicht-funktionale Anforderungen

### 7.1 Zufall und Fairness

| ID | Anforderung |
|---|---|
| NFA-ZF-01 | Alle Zufallsentscheidungen verwenden den kryptografisch sicheren Zufallsgenerator des Betriebssystems bzw. der Laufzeitumgebung. Das gilt für den gesamten Produktivcode einschließlich rein dekorativer Zufallswerte in Animationen; deterministische Zufallsquellen gibt es ausschließlich im Testcode. *(präzisiert in 0.7)* |
| NFA-ZF-02 | Die Umrechnung von Zufallswerten in Auswahlentscheidungen erfolgt ohne Verzerrung (insbesondere ohne Modulo-Bias), sodass jede Option exakt gleich wahrscheinlich ist. Die Verzerrungsfreiheit der Umrechnung wird durch vollständiges Durchzählen exakt nachgewiesen, die Gleichverteilung der Ziehungen zusätzlich statistisch geprüft. *(präzisiert in 0.7)* |
| NFA-ZF-03 | Die Zufallsquelle ist hinter einer eigenen Schnittstelle gekapselt, damit sie testbar und austauschbar ist. |

### 7.2 Plattformen und Betrieb

| ID | Anforderung |
|---|---|
| NFA-PL-01 | Die App läuft auf Android, iOS (Smartphone und iPad) und Windows. Abgenommen wird mit Brave unter Android und Windows sowie mit Safari unter iOS und iPadOS; Chrome dient als Vergleichsbrowser. *(präzisiert in 0.7)* |
| NFA-PL-02 | Die App ist so plattformunabhängig wie möglich umgesetzt. |
| NFA-PL-03 | Die App funktioniert nach der Installation vollständig offline. Internet wird nur für Updates benötigt. |
| NFA-PL-04 | Die Darstellung passt sich an Smartphone- und Tablet-Bildschirme an. Smartphones werden im Hochformat genutzt; im Querformat zeigt die App auf Smartphones nur einen Hinweis, das Gerät zu drehen. Tablets und PC sind in beiden Ausrichtungen nutzbar. *(präzisiert in 0.15, E-29)* |

### 7.3 Datenhaltung und Datenschutz

| ID | Anforderung |
|---|---|
| NFA-DH-01 | Alle Nutzerdaten werden ausschließlich lokal auf dem Gerät gespeichert. |
| NFA-DH-02 | Nutzerdaten verlassen das Gerät nur durch einen vom Nutzer ausgelösten Export. |
| NFA-DH-03 | Es gibt keine Benutzerkonten, keine Anmeldung und kein Tracking. |
| NFA-DH-04 | Das Exportformat ist versioniert, damit Exporte auch mit späteren App-Versionen importiert werden können. |
| NFA-DH-05 | Jeder Datensatz erhält bei seiner Anlage eine zufällig erzeugte, weltweit eindeutige Kennung. Catan hat eine fest eingebaute, auf allen Geräten gleiche Kennung. *(neu in 0.4)* |

### 7.4 Gestaltung und Bedienung

| ID | Anforderung |
|---|---|
| NFA-GB-01 | Modernes, frisches Erscheinungsbild mit eigenständiger Handschrift, bewusst kein generischer „KI-Look“. |
| NFA-GB-02 | Version 1 erhält ausschließlich einen Dunkelmodus in angenehmen, mitteldunklen Tönen, kein reines Schwarz. |
| NFA-GB-03 | Das Erscheinungsbild ist über Designs wählbar. Ein Design legt Oberflächen, Text, Hintergrund und eine Standard-Akzentfarbe fest; Catan- und Gruppenfarben sind in allen Designs gleich. Version 1 enthält die Designs „Holz“ (Standard), „Tiefsee“, „Wald“ und „Glas“; weitere Designs lassen sich ohne Umbau ergänzen. Zusätzlich kann der Nutzer die Akzentfarbe aus 6 bis 8 vordefinierten Tönen wählen; ohne Auswahl gilt die Standard-Akzentfarbe des Designs. *(präzisiert in 0.4, geändert in 0.13: vorher eine Akzentfarbe mit Standard Lila)* |
| NFA-GB-04 | Mikroanimationen wie Hover-Effekte. Auf Touch-Geräten werden gleichwertige Effekte bei Berührung eingesetzt. |
| NFA-GB-05 | Farben werden zentral als Design-Tokens definiert, damit ein späterer Hellmodus ohne Umbau möglich ist. |
| NFA-GB-06 | Die Darstellung des Bretts ist eine eigenständige, generische Grafik ohne Verwendung von Original-Grafiken des Spiels. |

### 7.5 Internationalisierung

| ID | Anforderung |
|---|---|
| NFA-I18N-01 | Die App ist in Version 1 auf Deutsch. |
| NFA-I18N-02 | Alle Texte sind von Beginn an ausgelagert, sodass weitere Sprachen, zunächst Englisch, ohne Codeänderungen ergänzt werden können. |

### 7.6 Erweiterbarkeit und Wartbarkeit

| ID | Anforderung |
|---|---|
| NFA-EW-01 | Spiele sind als eigenständige Module angelegt. Weitere Spiele können ergänzt werden, ohne bestehende Spiele zu verändern. |
| NFA-EW-02 | Platzierungsregeln sind als kombinierbare Bausteine umgesetzt und werden je Modus zusammengestellt. |
| NFA-EW-03 | Das Brettmodell erlaubt, dass Felder später optional einen Inhalt (Landschaft, Zahl) besitzen. |
| NFA-EW-04 | Die Architektur ermöglicht eine spätere Brettgenerierung durch die App sowie inhaltsabhängige Regeln. |
| NFA-EW-05 | Abweichende Brettformen (z. B. Seefahrer) sind nicht geplant, sollen aber nicht grundsätzlich verbaut werden. |
| NFA-EW-06 | Die Datenhaltung verbaut keine spätere Synchronisation zwischen Geräten. |
| NFA-EW-07 | Spiellogik und Zufall sind durch automatisierte Tests abgesichert. |
| NFA-EW-08 | Die Behandlung von Sackgassen ist ein austauschbarer Baustein, damit später die vorausschauende Gültigkeit (PP-14) ergänzt werden kann. *(neu in 0.4)* |

---

## 8. Rahmenbedingungen

| ID | Rahmenbedingung |
|---|---|
| RB-01 | Es dürfen keine Kosten entstehen, weder für Hosting noch für Entwicklerkonten oder App-Stores. |
| RB-02 | Es wird kein eigener Server betrieben. Zulässig ist ein kostenloser Dienst, der ausschließlich statische Dateien ausliefert. |
| RB-03 | Die Entwicklung erfolgt unter Windows. |
| RB-04 | Der Code wird überwiegend von Claude geschrieben. Der Product Owner muss ihn nachvollziehen und pflegen können. |
| RB-05 | Die Programmiersprache und das Framework werden nach fachlicher Eignung gewählt. |
| RB-06 | Es gibt keinen festen Termin für die Fertigstellung. |

---

## 9. Entwicklungsprozess

### 9.1 Vorgehensmodell

Das Projekt folgt einem strukturierten, sequenziellen Vorgehen:

1. Anforderungserhebung (abgeschlossen, dieses Dokument)
2. Spezifikation mit User Stories, Abnahmekriterien und Priorisierung nach MoSCoW (abgeschlossen, Spezifikation)
3. Architektur und Technologieentscheidung (abgeschlossen, Architektur)
4. Einrichtung von Entwicklungsumgebung und Repository (Planung abgeschlossen; Durchführung nach `docs/Setup-Anleitung.md`, abgeschlossen bei erfüllter `docs/Setup-DoD.md`)
5. Iterative Umsetzung
6. Test und Abnahme
7. Veröffentlichung als Release

### 9.2 Versionsverwaltung und Branches

| ID | Festlegung |
|---|---|
| EP-01 | Die Versionsverwaltung erfolgt mit Git auf GitHub. |
| EP-02 | Es wird mit Branches gearbeitet. Der Branch `main` enthält ausschließlich freigegebene, veröffentlichungsreife Stände. Vor Release 1.0 enthält `main` nur den Platzhalter aus der Setup-Phase (Release 0.1.0): eine Seite ohne Service Worker und ohne Datenspeicherung, mit der die Veröffentlichungskette nachgewiesen wird (E-25). *(präzisiert in 0.8)* |
| EP-03 | Die Entwicklung findet in separaten Branches statt: `develop` als Integrationsstand sowie kurzlebige Arbeitsbranches, die von `develop` abzweigen und jeweils ein Bündel zusammengehöriger User Stories oder eine Aufgabe enthalten. Pushes in diese Branches haben keine Auswirkung auf die veröffentlichte App. *(präzisiert in 0.8)* |
| EP-04 | Änderungen gelangen ausschließlich per Pull Request und Merge nach `develop` und `main`, nachdem sie getestet wurden. Nach `main` gelangen nur Pull Requests aus `develop` (Release) oder aus einem Hotfix-Branch. GitHub erzwingt dies über Schutzregeln. *(präzisiert in 0.8)* |
| EP-05 | Jede Veröffentlichung wird als Release mit Versionsnummer nach Semantic Versioning (z. B. 1.0.0) und einer kurzen Änderungsbeschreibung markiert. |
| EP-06 | Tests erfolgen vor jedem Merge lokal unter Windows im Browser und bei Bedarf auf Mobilgeräten im lokalen Netzwerk. Der lokale Entwicklungsserver läuft dafür über HTTPS mit einem lokal ausgestellten Zertifikat, weil Service Worker und Kennungserzeugung einen sicheren Kontext erfordern. *(präzisiert in 0.7)* |
| EP-07 | Bis zur Einrichtung des Repositorys ist die vom Product Owner lokal gespeicherte Datei die Masterkopie. Claude liefert Änderungen als neue Dateiversion, die die alte Version im Claude-Projekt ersetzt. Im Projekt liegt stets nur eine Version je Dokument. |
| EP-08 | In der Setup-Phase wird die gesamte Projektdokumentation (Anforderungen, Spezifikation, Architektur) in den Ordner `docs/` des Repositorys überführt. |
| EP-09 | Ab diesem Zeitpunkt ist `docs/` die einzige Masterkopie. Dokumente werden dort direkt (z. B. mit Claude Code) bearbeitet und wie Code über Branches und Merges versioniert. |
| EP-10 | Claude Code setzt ein Bündel zusammengehöriger User Stories in einem Arbeitsbranch eigenständig um, führt alle Prüfungen lokal aus und eröffnet einen Pull Request nach `develop`. Es hält an und fragt den Product Owner, wenn eine Anforderung unklar oder widersprüchlich ist, eine Lösung von der Architektur abweichen würde, eine neue Abhängigkeit nötig wäre oder Anforderungen bzw. Spezifikation geändert werden müssten (Haltepunkte). *(neu in 0.8)* |
| EP-11 | Der Product Owner nimmt jeden Pull Request lokal ab und führt den Merge selbst durch. Die automatischen Prüfungen auf GitHub müssen vorher bestanden sein. *(neu in 0.8)* |
| EP-12 | Verbindliche Regeln für Code, Tests, Git, Abhängigkeiten und Dokumentation stehen in `docs/Entwicklungsrichtlinien.md`. Die Datei `CLAUDE.md` im Repository enthält deren Kurzfassung für Claude Code. *(neu in 0.8)* |

### 9.3 Empfohlener Einsatz der Claude-Modelle

| Phase | Modell | Aufwand |
|---|---|---|
| Anforderungserhebung | Claude Opus 5.5 | Medium |
| Spezifikation | Claude Opus 5.5 | High |
| Architektur und Technologieentscheidungen | Claude Opus 5.5 | High, bei kritischen Entscheidungen xhigh |
| Setup-Planung (Chat) | Claude Opus 5.5 | Medium, beim Erstellen der Dokumente High |
| Durchführung des Setups (Claude Code) | Claude Opus 5.5 | High |
| Implementierung (Claude Code) | Claude Sonnet 5.5 | Medium |
| Implementierung kritischer Teile (Zufall, Platzierung und Sackgassen, Service Worker und Updates, Importkonflikte, Datenmigrationen) | Claude Opus 5.5 | High |
| Tests, Boilerplate, Dokumentationspflege | Claude Sonnet 5.5 | Low bis Medium |
| Code-Reviews und schwierige Fehler | Claude Opus 5.5 | High |
| Einfache Hilfsaufgaben | Claude Haiku 4.5 | – |

Hinweise zur Token-Effizienz: Die Stufe „max“ wird vermieden. Für jede Phase wird ein neuer Chat begonnen, und dieses Dokument dient zusammen mit der Spezifikation als gemeinsame Wissensgrundlage, z. B. als Dateien in einem Claude-Projekt. In Claude Code bietet sich die Einstellung `opusplan` an (Opus für die Planung, Sonnet für die Umsetzung). Mit dem Plan Pro verbraucht Opus das Nutzungskontingent deutlich schneller; Opus wird deshalb nur für das Setup und die kritischen Teile eingesetzt. Liegt Sonnet bei einer Aufgabe zweimal hintereinander daneben, wird auf Opus gewechselt, statt weiter nachzubessern. *(ergänzt in 0.8)*

---

## 10. Getroffene Entscheidungen

| ID | Entscheidung | Begründung |
|---|---|---|
| E-01 | Zufall aus dem kryptografisch sicheren Generator des Betriebssystems | Unvorhersehbar und manipulationssicher, funktioniert offline und ohne externe Dienste |
| E-02 | Keine Protokollierung von Ziehungen oder Wiederholungen | Die Gruppe vertraut auf die Ehrlichkeit der Spielenden |
| E-03 | Daten ausschließlich lokal, Austausch nur per Export und Import | Kein Hosting, keine Kosten, volle Datenhoheit |
| E-04 | Progressive Web App (PWA) ohne nativen Wrapper; in der Architekturphase bestätigt (ADR-001) | Einzige praktikable kostenlose Option für iOS; native iOS-Apps erfordern ein kostenpflichtiges Entwicklerkonto oder wöchentliches Neusignieren über einen Mac |
| E-05 | Bereitstellung über GitHub Pages | Kostenlos, kein Serverbetrieb, später mit geringem Aufwand austauschbar (Alternativen: Cloudflare Pages, Netlify) |
| E-06 | Öffentlich einsehbarer Quellcode wird akzeptiert | Voraussetzung für GitHub Pages im kostenlosen Tarif; Nutzerdaten sind davon nicht betroffen |
| E-07 | Gruppen mit fester Zusammensetzung | Saubere, vergleichbare Statistik pro Gruppe |
| E-08 | Unentschieden als eigene Kategorie | Keine Verfälschung von Siegquoten |
| E-09 | Sackgassen bei der Platzierung werden durch verdecktes Neulosen behandelt (Variante B); die vorausschauende Gültigkeit (Variante A) ist geparkt | Einfach umzusetzen und zu verstehen; Sackgassen sind selten; Variante A bleibt als Baustein nachrüstbar (NFA-EW-08) |
| E-10 | Version 1 wird erst mit dem vollständigen Umfang dieses Dokuments veröffentlicht; MoSCoW steuert nur die Umsetzungsreihenfolge | Kein Termindruck (RB-06), gewünscht ist ein rundes erstes Release |
| E-11 | Weltweit eindeutige, zufällige Kennungen; Zuordnungen beim Import stets manuell und ohne Speicherung | Unabhängig erfasste Daten kollidieren nie; Partien von Freunden lassen sich der eigenen Gruppe zuordnen; jede Zuordnung ist eine bewusste Entscheidung, Fehler sind über den Sicherungspunkt vor dem Import behebbar |
| E-12 | Mitglieder einer Gruppe sind unveränderlich; es gibt keine Funktion zum Kopieren von Gruppen | Vergleichbarkeit der Statistik; einfache Bedienung |
| E-13 | Die Generierung wird mit dem Ende der Partie verworfen; gespeichert wird nur das Ergebnis | Folgerichtig zu E-02; schlanke Datenhaltung |
| E-14 | TypeScript, React mit React Compiler, Motion für Animationen und Vite als Build-Werkzeug; die Fachlogik ist framework-frei (ADR-002 bis ADR-006) | Größte Verbreitung und Routine bei der Codeerzeugung; Animationen gleichwertig umsetzbar; Fachlogik bleibt bei einem späteren Wechsel der Oberfläche erhalten |
| E-15 | IndexedDB mit Dexie als Speicher, eine Datenbank mit mehreren Stores (ADR-007) | Einziger geeigneter Browserspeicher; Transaktionen über alle Stores; Schema-Migrationen eingebaut |
| E-16 | Exportformat: versioniertes JSON; Austausch über Teilen-Menü bzw. Download; kein QR-Code (ADR-012) | Lesbar, robust, auf allen Plattformen verarbeitbar; QR-Codes fassen zu wenig Daten und sind am Tisch umständlich |
| E-17 | Unter iOS und iPadOS nur als installierte App nutzbar; persistenter Speicher wird angefordert (ADR-016) | Getrennte Speicher von Safari-Tab und installierter App würden sonst zu fehlenden Daten führen |
| E-18 | Kontrollierte Update-Umschaltung über versionierte Caches; Sicherungsdialog vor jedem Update (ADR-015) | Das Standardverhalten von PWAs würde neue Versionen beim Neustart ohne Zustimmung aktivieren |
| E-19 | Vollsicherung einschließlich Einstellungen ersetzt den Export „Alle Daten“ | Vollständige Wiederherstellung nach Neuinstallation des Browsers oder Gerätewechsel |
| E-20 | Während einer laufenden Partie sind Import, Wiederherstellung und strukturelle Änderungen der beteiligten Gruppe gesperrt | Die laufende Partie darf nicht auf geänderte oder fehlende Daten verweisen |
| E-21 | Die App wird dauerhaft unter `https://boardbrain.github.io/` veröffentlicht: GitHub-Organisation `boardbrain`, Repository `boardbrain.github.io` (Architektur ADR-022). Die Adresse wird nie geändert. *(neu in 0.8)* | Eigene Herkunft, damit kein anderes Projekt die Daten der App sieht; kostenlos; kurz und gut weiterzugeben; ein späterer Wechsel würde alle Nutzer von ihren Daten trennen |
| E-22 | Schnelle Umsetzung hat Vorrang vor feingranularer Steuerung: Claude Code setzt Story-Bündel eigenständig bis zum Pull Request um; der Product Owner nimmt im Pull Request ab und mergt (EP-10, EP-11) *(neu in 0.8)* | Ein nutzbarer Stand entsteht schnell; die Kontrolle über alles, was nach `develop` und `main` gelangt, bleibt beim Product Owner; Haltepunkte sichern Entscheidungen, die ihm vorbehalten sind |
| E-23 | Der Quellcode steht unter der PolyForm Strict License 1.0.0 mit dem Hinweis „Required Notice: Copyright (c) 2026 Jonasss29“; er ist öffentlich einsehbar (E-06), aber nicht Open Source: Nutzung nur für nichtkommerzielle Zwecke, Weitergabe und Änderungen durch Dritte sind nicht erlaubt. Klänge und Schriften behalten ihre eigenen Lizenzen *(neu in 0.8, geändert in 0.9: vorher MIT)* | Der Product Owner behält die Kontrolle über Weitergabe und kommerzielle Nutzung; standardisierter, verständlicher Lizenztext; verträglich mit den Lizenzen der Abhängigkeiten (MIT, ISC, BSD, Apache 2.0 erlauben die Verwendung in nicht offenem Code); enthält einen Haftungsausschluss; Pseudonym statt Klarname |
| E-24 | Barrierefreiheit ist kein Ziel von Version 1 *(neu in 0.8)* | Die App wird nur im Freundeskreis genutzt. Unberührt bleiben die Erkennbarkeit von Gebäuden und Straßen (FA-PL-05, FA-PL-06, US-PL-04) und die technische Regel, echte Bedienelemente mit Beschriftung zu verwenden (Entwicklungsrichtlinien) |
| E-25 | Erste Veröffentlichung ist ein Platzhalter (Release 0.1.0) ohne Service Worker und ohne Datenspeicherung; über Vorabversionen der echten App vor 1.0 wird nach Inkrement I2 entschieden (OP-13) *(neu in 0.8)* | Die Veröffentlichungskette wird früh auf der echten Adresse nachgewiesen, ohne dass etwas auf den Geräten zurückbleibt |
| E-26 | Farbwerte nach Design D-1: Standarddesign „Holz“ (warmes, mitteldunkles Braun, Akzent Bernstein); weitere Designs „Tiefsee“ (Petrol), „Wald“ (Grüngrau) und „Glas“ (Farbverlauf mit Milchglasflächen); kräftige Catan-Farben und eine gedeckte Gruppenfarben-Palette; 6 Akzentfarben (Indigo, Blau, Petrol, Grün, Bernstein, Beere). Die Werte stehen ausschließlich in `src/ui/styles/tokens.css` *(neu in 0.13; Gruppenfarben und Kontrastregel geändert in 0.14 durch E-28)* | Auswahl des Product Owners anhand einer Vorschau auf den Abnahmegeräten; alle Werte erreichen in allen Designs mindestens 4,5 : 1 für Text, sodass die App unabhängig vom Design lesbar bleibt |
| E-27 | Eine globale Gruppe kann Catan ausschließen; sie hat dann auch bei 2 bis 4 Mitgliedern nur Gruppenfarben *(neu in 0.14)* | Wer mit einer kleinen Gruppe nie Catan spielt, muss keine Catan-Farben vergeben; die Gruppe bleibt dennoch für alle übrigen Spiele offen. Wunsch des Product Owners bei der Abnahme von I1-C |
| E-28 | Überarbeitete Gruppenfarben-Palette mit 12 gut unterscheidbaren, gedeckten Farben: Rot, Blau, Orange und Weiß (Catan-Töne), Gelb, Moosgrün, Indigo (hell), Petrol, Magenta, Kaffee, Rosé, Steingrau. Spielfarben erreichen mindestens 3 : 1 zum Hintergrund jedes Designs und mindestens 2,3 : 1 auf dessen Karten *(neu in 0.14)* | Die Unterscheidbarkeit der Personenfarben untereinander hat Vorrang vor dem Kontrast zum Hintergrund: In der Palette aus D-1 waren Grün, Limette und Petrol sowie Violett und Indigo zu ähnlich (Farbabstand ΔE bis 13); die neue Palette erreicht mindestens ΔE 29. Ausgewählt vom Product Owner in der Farbvorschau auf den Abnahmegeräten, in allen vier Designs geprüft |
| E-29 | Smartphones nur im Hochformat; im Querformat erscheint statt der App ein Hinweis zum Drehen. Tablets (auch aufgeklappte Falt-Smartphones) und PC in beiden Ausrichtungen *(neu in 0.15)* | Im Querformat ist ein Smartphone zu niedrig für Navigation und Inhalt; ein Hinweis wirkt auf Android und iOS gleich, eine echte Sperre gibt es nur unter Android und würde dort auch Tablets sperren. Entscheidung des Product Owners in Design D-3 |
| E-30 | Einstellung „Ich hasse Catan!“ blendet die Catan-Funktionen app-weit aus; Einschalten nur nach Warnung und Bestätigung; umkehrbar ohne Änderung gespeicherter Gruppeneinstellungen; Gruppen, die währenddessen angelegt werden, schließen Catan aus und können es später wieder zulassen *(neu in 0.16)* | Voraussichtlich nutzen viele die App ganz ohne Catan, nur für Ergebnisse und Statistik; für sie sind Generierung, Catan-Farben und Catan-Auswahl nur Ballast. Entscheidung des Product Owners nach Design D-3 |

---

## 11. Offene Punkte

| ID | Offener Punkt | Klärung in Phase | Status |
|---|---|---|---|
| OP-01 | Endgültige Technologiewahl (PWA, Framework, Programmiersprache, Speichertechnologie) | Architektur | geklärt: E-14, E-15, Architektur ADR-001 bis ADR-007 |
| OP-02 | Exportformat und Darstellung des Austauschs (Datei, ggf. QR-Code) | Architektur | geklärt: E-16, FA-EI-12, Architektur ADR-012 |
| OP-03 | Konkrete Konfliktfälle beim Import und deren Auflösungsoptionen | Spezifikation | geklärt: FA-EI-03, FA-EI-06 bis -08, Spezifikation 3.9 |
| OP-04 | Häufigkeit und Anzahl der internen Sicherungspunkte | Spezifikation | geklärt: FA-DS-04 bis -06, Spezifikation 3.10 |
| OP-05 | Intervall und Form der Export-Erinnerung | Spezifikation | geklärt: FA-EI-05, Spezifikation 3.11 |
| OP-06 | Gestaltung von Glücksrad, Aufblinken, Tempo und Sounds im Detail | Design | teilweise geklärt: Funktion in FA-IN-05, FA-IN-06; visuelle Gestaltung offen |
| OP-07 | Verwaltungsfunktionen: Bearbeiten, Löschen und ggf. Archivieren von Personen, Gruppen und Spielen sowie Auswirkungen auf bestehende Statistiken | Spezifikation | geklärt: FA-VW-01 bis -05 |
| OP-08 | Verhalten der Standardfarben bei Personen in mehreren Gruppen und bei Farbkonflikten innerhalb einer Partie | Spezifikation | geklärt: FA-PG-05 bis -08, Spezifikation 3.3 |
| OP-09 | Persistenz des Speichers unter iOS (Installation auf dem Home-Bildschirm erforderlich) | Architektur | geklärt: E-17, FA-IS-01 bis -03, Architektur ADR-016 |
| OP-10 | Priorisierung aller Anforderungen nach MoSCoW und Festlegung des Umfangs von Version 1 | Spezifikation | geklärt: E-10, Spezifikation Kapitel 2 |
| OP-11 | Konkrete Farbwerte der Catan-Farben, der Gruppenfarben-Palette und der Akzentfarben unter Berücksichtigung der Lesbarkeit im Dunkelmodus | Design | geklärt: E-26, NFA-GB-03, Architektur 13.4 |
| OP-12 | Dauerhafte Adresse (Herkunft) der App: eigene GitHub-Organisation mit eigener Herkunft (Empfehlung) oder Projektseite unter dem persönlichen Konto. Ein späterer Wechsel trennt die Nutzer von ihren Daten. | Setup | geklärt: E-21, Architektur ADR-022 |
| OP-13 | Veröffentlichung von Vorabversionen der echten App (0.x) vor Release 1.0, etwa für Test-Spieleabende außerhalb des Heimnetzes. Erfordert eine Festlegung zum Umgang mit Daten aus Vorabversionen und einen funktionierenden Update-Mechanismus. Zusätzlich gilt: Der Product Owner besitzt kein eigenes iPhone; die Abnahme auf dem iPhone (NFA-PL-01) ist nur über Geräte von Freunden möglich. Vorabversionen unter der echten Adresse würden das erleichtern, weil dafür kein lokales Zertifikat auf fremden Geräten nötig ist. *(neu in 0.8, präzisiert in 0.10)* | Umsetzung (nach I2) | offen |

---

## 12. Parkplatz (spätere Erweiterungen)

Die folgenden Ideen sind ausdrücklich nicht Teil von Version 1, werden aber bei der Architektur berücksichtigt.

| ID | Idee |
|---|---|
| PP-01 | Weitere Modi für Catan, z. B. Küstenkreuzungen mit mindestens zwei angrenzenden Landfeldern |
| PP-02 | Ausgleichende Regeln (z. B. Mindestanzahl verschiedener Rohstoffe pro Person) |
| PP-03 | Brettgenerierung durch die App: Landschaften, Zahlenchips und Häfen nach Regeln |
| PP-04 | Inhaltsabhängige Platzierungsregeln (z. B. keine doppelten Zahlen, Ausschluss der Wüste) |
| PP-05 | Weitere unterstützte Spiele mit eigener Generierung |
| PP-06 | Synchronisation zwischen Geräten |
| PP-07 | Gruppenübergreifende Statistik pro Person |
| PP-08 | Erfassung der Spieldauer |
| PP-09 | Hellmodus |
| PP-10 | Englische Sprachversion |
| PP-11 | Abweichende Brettformen, z. B. Seefahrer |
| PP-12 | Kooperative Spiele in der Ergebniserfassung |
| PP-13 | Nachprüfbares Protokoll aller Ziehungen einer Partie |
| PP-14 | Vorausschauende Gültigkeit bei der Platzierung: Eine Kreuzung gilt nur als gültig, wenn danach alle restlichen Gebäude noch platzierbar sind (Variante A zu E-09) |
| PP-15 | Statistik nach Farbe (z. B. Siegquote je Catan-Farbe) |
| PP-16 | Weitere Diagramme und Auswertungen |
| PP-17 | Eigene Spielfarben-Paletten für weitere Spiele |
| PP-18 | Sammelentscheidung für gleichartige Konflikte beim Import |
| PP-19 | Gruppenübergreifende Auswahl einzelner Partien beim Export |

---

## 13. Nächste Schritte

1. Setup durchführen nach `docs/Setup-Anleitung.md`, bis alle Punkte der `docs/Setup-DoD.md` erfüllt sind; dabei Überführung der Dokumentation nach `docs/` (EP-08) – *abgeschlossen am 07.10.2026 mit Release 0.1.0*
2. Umsetzung ab Inkrement I1 gemäß Spezifikation, Kapitel 2.3, in Story-Bündeln (EP-10); Reihenfolge, Zuschnitt und Ablauf in `docs/Umsetzungsplan.md`
3. Design der Farbwerte (OP-11) parallel zu Inkrement I1; Design der Inszenierung (OP-06) vor Inkrement I5. Beides blockiert die vorherigen Inkremente nicht, weil Farbwerte nur in den Design-Tokens stehen und die Inszenierung erst in I5 umgesetzt wird – *OP-11 erledigt am 07.10.2026 (E-26)*
4. Nach Inkrement I2: Entscheidung über Vorabversionen (OP-13)
