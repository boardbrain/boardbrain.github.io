/**
 * Tree of text keys: leaves are texts, inner nodes are areas.
 */
export type TextTree = { readonly [key: string]: string | TextTree };

/**
 * All visible texts of the app in German (NFA-I18N-01, ADR-018).
 * Keys are areas joined by dots, e.g. `diagnose.titel`; placeholders as `{name}`.
 */
export const de = {
  app: {
    name: 'BoardBrain',
  },
  allgemein: {
    name: 'Name',
    speichern: 'Speichern',
    abbrechen: 'Abbrechen',
  },
  navigation: {
    titel: 'Hauptnavigation',
    start: 'Start',
    verwaltung: 'Verwaltung',
  },
  start: {
    titel: 'Start',
    einleitung: 'Faire Zufallsentscheidungen und Statistik für euren Spieleabend.',
    personen: 'Personen verwalten',
    spiele: 'Spiele verwalten',
  },
  verwaltung: {
    titel: 'Verwaltung',
    bereiche: 'Bereiche der Verwaltung',
    personen: 'Personen',
    spiele: 'Spiele',
    nameLeer: 'Bitte gib einen Namen ein.',
  },
  personen: {
    titel: 'Personen',
    neu: 'Neue Person',
    liste: 'Alle Personen',
    leer: 'Noch keine Personen angelegt.',
    gleicherName: 'Es gibt bereits eine Person namens „{name}“. Trotzdem anlegen?',
    gleicherNameGruppe:
      'Gleichnamige Personen können später nicht Mitglied derselben Gruppe werden.',
    trotzdemAnlegen: 'Trotzdem anlegen',
  },
  spiele: {
    titel: 'Spiele',
    unterstuetzt: 'Unterstützte Spiele',
    eigene: 'Eigene Spiele',
    eigeneLeer: 'Noch keine eigenen Spiele angelegt.',
    neu: 'Neues eigenes Spiel',
    gleicherName: 'Es gibt bereits ein Spiel namens „{name}“. Bitte wähle einen anderen Namen.',
    namen: {
      catan: 'Catan',
    },
  },
  diagnose: {
    titel: 'Diagnose',
    einleitung: 'Technische Prüfwerte dieses Geräts für die Abnahme.',
    version: 'Version {version}',
    pruefwerte: 'Prüfwerte',
    informationen: 'Informationen',
    sichererKontext: 'Sicherer Kontext (HTTPS)',
    randomUuid: 'crypto.randomUUID',
    serviceWorker: 'Service Worker (Schnittstelle)',
    speicherSchnittstelle: 'Persistenter Speicher (Schnittstelle)',
    speicherGeschuetzt: 'Speicher geschützt',
    installiert: 'Als App installiert',
    vorhanden: 'vorhanden',
    fehlt: 'fehlt',
    ja: 'ja',
    nein: 'nein',
    unbekannt: 'unbekannt',
  },
  fehler: {
    titel: 'Etwas ist schiefgelaufen',
    text: 'BoardBrain hat einen unerwarteten Fehler festgestellt. Lade die Seite neu. Bleibt der Fehler, kopiere die technischen Details in ein Issue.',
    neuLaden: 'Neu laden',
    details: 'Technische Details',
  },
} as const satisfies TextTree;
