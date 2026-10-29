# BoardBrain – Messung der Sackgassen

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Testbericht (NFA-EW-08, Architektur 14.4) |
| Version | 0.1 |
| Stand | 29.10.2026 |
| Grundlage | BoardBrain_Anforderungsdokumentation.md 6.2, BoardBrain_Spezifikation.md 3.2, BoardBrain_Architektur.md 5.4 |
| Sprache | Deutsch |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 29.10.2026 | Erste Messung mit Bündel I2-A |

## 1. Worum es geht

Bei 4 Personen kann die Platzierung in eine Sackgasse laufen: Für ein weiteres Gebäude gibt es keine gültige Inlandkreuzung mehr (Anforderungsdokumentation 6.2.4). Die Strategie `RetryOnDeadEnd` lost dann alle offenen Gebäude verdeckt neu (Variante B, E-09). Für die Nutzer ist das unsichtbar. Gemessen wird, wie oft das vorkommt.

## 2. Verfahren

- Test: `tests/statistical/placement.stat.test.ts`, Block „NFA-EW-08 Dead ends with 4 persons“, Aufruf mit `npm run test:stat`.
- Je Spielversion 100.000 vollständige Platzierungen mit 8 Gebäuden auf dem Standardbrett, mit dem echten Zufallsgenerator (`CryptoRandomSource`).
- Gezählt wird, wie viele Durchläufe je Platzierung nötig waren. Ein Durchlauf mehr als einer heißt: Ein Durchlauf endete in einer Sackgasse und wurde verworfen.
- Die Spielversion ändert nur die Gebäudeart, nicht die Regeln für die Kreuzungen. Beide Messungen müssen also im Rahmen des Zufalls gleich ausfallen.

## 3. Ergebnis

Lauf vom 29.10.2026:

| Spielversion | Platzierungen | Durchläufe insgesamt | davon Sackgassen | Platzierungen mit Neulosen | Höchstzahl Durchläufe |
|---|---|---|---|---|---|
| Basisspiel | 100.000 | 100.024 | 24 (0,02 %) | 24 (0,02 %) | 2 |
| Städte & Ritter | 100.000 | 100.019 | 19 (0,02 %) | 19 (0,02 %) | 2 |

Ein früherer Lauf am selben Tag ergab 26 bzw. 24 Sackgassen.

## 4. Bewertung

- Sackgassen sind sehr selten: etwa 1 von 4.000 Platzierungen mit 4 Personen. Ein zweiter Durchlauf hat immer genügt.
- Die Rechenzeit des Neulosens spielt keine Rolle; eine ganze Platzierung dauert Bruchteile einer Millisekunde.
- Weil so selten neu gelost wird, verschiebt die Bedingung auf Durchläufe ohne Sackgasse die Gesamtverteilung nur geringfügig (Anforderungsdokumentation 6.2.6). Jede einzelne Ziehung bleibt exakt gleichverteilt.
- Bei 2 und 3 Personen braucht die Platzierung nie mehr als einen Durchlauf. Das prüft ein Eigenschaftstest in `src/games/catan/placement/planner.test.ts`.
- Die vorausschauende Variante A (PP-14) ist nach diesen Zahlen nicht nötig.
