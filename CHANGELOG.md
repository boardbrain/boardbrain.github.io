# Änderungsprotokoll

Alle nennenswerten Änderungen an BoardBrain stehen in dieser Datei. Der Aufbau folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionsnummern folgen [Semantic Versioning](https://semver.org/lang/de/).

Je Version gibt es nach Bedarf die Abschnitte *Neu*, *Geändert*, *Behoben*, *Entfernt* und *Sicherheit*.

## [Unveröffentlicht]

## [0.2.0] – 2026-11-13

Erste Testversion zum Ausprobieren am Spieleabend: Personen und Tische anlegen und eine Partie Catan fair auslosen lassen. Ergebnisse und Statistik kommen mit den nächsten Versionen. Weil es eine Testversion ist, können gespeicherte Daten bei einem späteren Update verloren gehen. Eine neue Version wird aktiv, sobald die App ganz geschlossen und wieder geöffnet wird.

### Neu

- Personen, Tische und eigene Spiele anlegen und bearbeiten; jede Person bekommt am Tisch ihre Farbe.
- Neue Partie Catan vorbereiten: Tisch, Personen, Basisspiel oder Städte & Ritter und Startrohstoffe wählen.
- Faire Auslosung Schritt für Schritt: Reihenfolge, Startplätze von Gebäuden und Straßen auf dem Brett und Startrohstoffe. Jedes Ergebnis ist gespeichert, bevor es gezeigt wird.
- Inszenierung: Karten werden gemischt und gezogen, Gebäude und Straßen blinken auf, bevor sie gesetzt werden. Im Spannungsmodus scheiden Plätze nach und nach aus, bis zum Duell. Mit „Animation überspringen“ geht es sofort weiter.
- Einzelne Schritte wiederholen, auch durch Antippen eines Steins auf dem Brett; mit „Rückblick“ und „Blättern“ frühere Schritte ansehen.
- Eine laufende Partie bleibt gespeichert und geht nach einem Neustart weiter.
- Die App lässt sich auf dem Startbildschirm installieren und funktioniert ohne Internet.
- Startansicht mit den Bereichen als Kartenhand.
- Diagnose mit Zusammenfassung, Bericht zum Teilen und Würfeltest.

### Geändert

- Eigener Fehlerbildschirm, jetzt auch bei Fehlern in einer einzelnen Ansicht.

## [0.1.0] – 2026-10-07

Erste Veröffentlichung: ein technischer Platzhalter, der zeigt, dass Aufbau, Prüfungen und Veröffentlichung funktionieren. Die eigentlichen Funktionen für den Spieleabend folgen in den nächsten Versionen.

### Neu

- Diagnoseansicht: zeigt die Version der App und prüft, ob das Gerät alle Voraussetzungen erfüllt (sichere Verbindung, Erzeugen von Kennungen, Service Worker, Speicher). Ob der Speicher geschützt und die App installiert ist, erscheint als Information.
- Fehlerbildschirm: Stürzt die App unerwartet ab, erscheint ein Hinweis mit der Schaltfläche „Neu laden“ statt einer leeren Seite.

### Sicherheit

- Die App lädt Inhalte nur von ihrer eigenen Adresse (Content Security Policy).

[Unveröffentlicht]: https://github.com/boardbrain/boardbrain.github.io/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/boardbrain/boardbrain.github.io/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/boardbrain/boardbrain.github.io/releases/tag/v0.1.0
