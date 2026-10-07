# Änderungsprotokoll

Alle nennenswerten Änderungen an BoardBrain stehen in dieser Datei. Der Aufbau folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionsnummern folgen [Semantic Versioning](https://semver.org/lang/de/).

Je Version gibt es nach Bedarf die Abschnitte *Neu*, *Geändert*, *Behoben*, *Entfernt* und *Sicherheit*.

## [Unveröffentlicht]

## [0.1.0] – 2026-10-07

Erste Veröffentlichung: ein technischer Platzhalter, der zeigt, dass Aufbau, Prüfungen und Veröffentlichung funktionieren. Die eigentlichen Funktionen für den Spieleabend folgen in den nächsten Versionen.

### Neu

- Diagnoseansicht: zeigt die Version der App und prüft, ob das Gerät alle Voraussetzungen erfüllt (sichere Verbindung, Erzeugen von Kennungen, Service Worker, Speicher). Ob der Speicher geschützt und die App installiert ist, erscheint als Information.
- Fehlerbildschirm: Stürzt die App unerwartet ab, erscheint ein Hinweis mit der Schaltfläche „Neu laden“ statt einer leeren Seite.

### Sicherheit

- Die App lädt Inhalte nur von ihrer eigenen Adresse (Content Security Policy).

[Unveröffentlicht]: https://github.com/boardbrain/boardbrain.github.io/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/boardbrain/boardbrain.github.io/releases/tag/v0.1.0
