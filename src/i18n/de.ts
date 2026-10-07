/**
 * Baum aus Textschlüsseln: Blätter sind Texte, innere Knoten Bereiche.
 */
export type TextTree = { readonly [key: string]: string | TextTree };

/**
 * Alle sichtbaren Texte der App auf Deutsch (NFA-I18N-01, ADR-018).
 * Schlüssel sind Bereiche und Punkte, z. B. `diagnose.titel`; Platzhalter in `{name}`.
 */
export const de = {
  app: {
    name: 'BoardBrain',
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
