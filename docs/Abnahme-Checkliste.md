# BoardBrain – Abnahme-Checkliste

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Manuelle Abnahme auf echten Geräten vor jedem Release |
| Version | 0.1 |
| Status | Angelegt mit Bündel I1-D; die Punkte späterer Inkremente gelten ab dem genannten Inkrement |
| Stand | 27.10.2026 |
| Grundlage | BoardBrain_Architektur.md v0.15 (12.1, 14.6), BoardBrain_Spezifikation.md v0.11 (Kapitel 5), Entwicklungsrichtlinien.md (3.8) |
| Sprache | Deutsch |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 27.10.2026 | Erstfassung mit I1-D: Geräte, Vorbereitung, Installation, Start im Flugmodus, Brett; Punkte der Inkremente I2 bis I5 vorgemerkt |

## 1. Zweck

Automatische Tests laufen in nachgebildeten Browsern. Ob die App auf echten Geräten installiert werden kann, im Flugmodus startet und gut aussieht, zeigt nur ein Test von Hand (Architektur 14.6, NFA-PL-01). Vor jedem Release arbeitet der Product Owner diese Liste auf allen Geräten ab und vermerkt das Ergebnis im Pull Request nach `main` (Entwicklungsrichtlinien 3.8). Vor Release 1.0 dient sie auch der Abnahme einzelner Bündel; dann genügen die Punkte, die das Bündel im Umsetzungsplan nennt.

Ein Punkt gilt erst ab dem Inkrement in der Spalte „ab“. Ein Punkt, der scheitert, wird als Issue erfasst und vor dem Release behoben.

## 2. Geräte (NFA-PL-01)

| Kürzel | Gerät | Browser | Nutzung |
|---|---|---|---|
| A | Galaxy S26 | Brave, Chrome zum Vergleich | im Browser-Tab und installiert |
| I | iPad | Safari | installiert; im Tab nur die Installationsanleitung (ab I4, US-IS-01) |
| P | iPhone | Safari | installiert; es gibt kein eigenes Gerät, ein geliehenes genügt; nur mit der veröffentlichten App, weil fremde Geräte das lokale Zertifikat nie bekommen (Architektur 16.6) |
| W | Windows 11 | Brave | im Browser-Tab und installiert |

## 3. Vorbereitung

| Nr. | Schritt |
|---|---|
| V-1 | Vor 1.0: auf dem PC `npm run build` und `npm run preview`; die Geräte öffnen `https://192.168.178.20:4173/`. Ab 1.0: `https://boardbrain.github.io/`. Der Entwicklungsserver (Port 5173) hat keinen Service Worker und eignet sich nicht für diese Liste (Architektur 11.4). |
| V-2 | Auf jedem Gerät `#/diagnose` öffnen: Alle Prüfwerte sind „vorhanden“, die Version stimmt. |
| V-3 | War BoardBrain unter derselben Adresse schon installiert, die alte App vorher entfernen, damit kein älterer Stand im Cache liegt. |

## 4. Prüfpunkte

| Nr. | ab | Prüfung | Erwartung | A | I | P | W |
|---|---|---|---|---|---|---|---|
| K-1 | I1 | Installieren: Android „Zum Startbildschirm hinzufügen“ bzw. „App installieren“, iOS „Teilen“ → „Zum Home-Bildschirm“, Windows Symbol „App installieren“ in der Adressleiste | Symbol D8 (zwei Karten) und Name „BoardBrain“ erscheinen; unter Android rund zugeschnitten ohne abgeschnittene Karten | ☐ | ☐ | ☐ | ☐ |
| K-2 | I1 | Installierte App starten | Eigenes Fenster ohne Adressleiste; unter Android kurz das Startbild mit dem Symbol auf dunklem Grund; in der Diagnose „Als App installiert: ja“ | ☐ | ☐ | ☐ | ☐ |
| K-3 | I1 | Statusleiste und Ränder (iOS, Android) | Dunkle Statusleiste, kein Inhalt unter Uhrzeit, Kamera oder Gestenleiste verdeckt | ☐ | ☐ | ☐ | – |
| K-4 | I1 | App einmal öffnen, in der Diagnose „Offline bereit: ja“ abwarten (ggf. einmal neu laden), App schließen, Flugmodus an, App starten (NFA-PL-03) | Die App startet; Start, Verwaltung, Diagnose und Brett sind erreichbar, gespeicherte Daten sind da | ☐ | ☐ | ☐ | ☐ |
| K-5 | I1 | Brett unter `#/brett` (Verweis „Brett ansehen“ in der Diagnose); Smartphone hochkant, Tablet hochkant und quer (US-PL-01, NFA-PL-04) | 19 Holzfelder mit Spitze oben in Reihen 3, 4, 5, 4, 3, vollständig sichtbar, ohne Scrollen, wie in `docs/design/i1d-board-final-preview.html` | ☐ | ☐ | ☐ | ☐ |
| K-6 | I1 | Smartphone ins Querformat drehen (E-29) | Nur der Hinweis, das Gerät zu drehen | ☐ | – | ☐ | – |
| K-7 | I2 | Vollständige Generierung mit 4 Personen in beiden Spielversionen | Alle Schritte laufen durch; Gebäude und Straßen in den Catan-Farben, Siedlung und Stadt an der Form unterscheidbar | ☐ | ☐ | ☐ | ☐ |
| K-8 | I2 | Neustart mitten in der Generierung (App schließen, wieder öffnen; US-AB-05) | Die Partie läuft beim zuletzt gespeicherten Schritt weiter | ☐ | ☐ | ☐ | ☐ |
| K-9 | I4 | Vollsicherung über das Teilen-Menü (US-EI-01) und Import auf einem zweiten Gerät (US-EI-03) | Datei lässt sich teilen; nach dem Import sind die Daten auf dem zweiten Gerät vollständig | ☐ | ☐ | ☐ | ☐ |
| K-10 | I4 | Update mit Sicherungsdialog (US-UP-01, US-UP-02) | Hinweis erscheint nicht während einer Partie; neue Version erst nach Bestätigung aktiv, auch nach Neustart; Sicherungspunkt „Vor Update“ vorhanden | ☐ | ☐ | ☐ | ☐ |
| K-11 | I4 | Persistenter Speicher (US-IS-03) | Im Bereich „Sicherung“ als geschützt angezeigt; sonst die Warnung mit Ursachen | ☐ | ☐ | ☐ | ☐ |
| K-12 | I4 | iOS: Seite im Safari-Tab öffnen (US-IS-01) | Ausschließlich die bebilderte Installationsanleitung | – | ☐ | ☐ | – |
| K-13 | I5 | Ton mit und ohne Stummschaltung, während Musik läuft (US-IN-03, FA-IN-07) | Stummschalter wird respektiert; laufende Musik wird nicht unterbrochen | ☐ | ☐ | ☐ | ☐ |
| K-14 | I5 | Installationshinweis im Browser-Tab (US-IS-02) | Erscheint unter Android und Windows, lässt sich wegklicken und kommt nicht wieder | ☐ | – | – | ☐ |

## 5. Bekannte Grenzen der automatischen Tests

- Den Start ohne Netz prüft der Ende-zu-Ende-Test nur in Chromium, weil Playwrights WebKit unter Windows jedes Neuladen im Offline-Modus abbricht (Architektur 14.5). Für Safari zählt deshalb K-4 auf iPad und iPhone.
- WebKit unter Windows nähert Safari nur an; Installation, Startbild und Statusleiste (K-1 bis K-3) gibt es nur auf echten Geräten.
