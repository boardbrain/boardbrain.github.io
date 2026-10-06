# BoardBrain – Setup-Anleitung für Windows

| Feld | Inhalt |
|---|---|
| Projekt | BoardBrain |
| Dokumenttyp | Schritt-für-Schritt-Anleitung für die Einrichtung |
| Version | 0.2 |
| Stand | 06.10.2026 |
| Grundlage | BoardBrain_Architektur.md v0.2 (Kapitel 16), Entwicklungsrichtlinien.md v0.1 |
| Abschlusskriterium | Alle Punkte in `Setup-DoD.md` erfüllt |
| Sprache | Deutsch |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 06.10.2026 | Erstfassung aus der Setup-Planung |
| 0.2 | 06.10.2026 | Lizenz in I2 von MIT auf PolyForm Strict License 1.0.0 geändert (Anforderungsdokumentation E-23) (PR #1) |

## So liest du diese Anleitung

Jeder Schritt ist markiert:

- **[DU]** erledigst du selbst, etwa Klicks auf GitHub, Installationen, Einstellungen am Handy.
- **[CLAUDE CODE]** übernimmt Claude Code. Es hält an jeder Stelle an, an der du etwas tun musst, und sagt dir, was als Nächstes kommt.

Befehle in grauen Kästen gibst du in **PowerShell** ein. So öffnest du sie: Windows-Taste drücken, „Terminal“ tippen, Enter. Ein Befehl wird mit Enter ausgeführt. Kopieren und Einfügen funktioniert mit Strg+C und Strg+V bzw. Rechtsklick.

Platzhalter in spitzen Klammern ersetzt du durch deine Werte, zum Beispiel `‹DEINE-IP›` durch `192.168.178.20`.

Wenn ein Schritt anders aussieht als beschrieben (GitHub und Windows benennen Menüs gelegentlich um), frag Claude Code oder den Planungs-Chat und beschreibe, was du siehst.

---

## Teil A: Bereits erledigt (zur Kontrolle)

Diese Schritte hast du in der Planung schon ausgeführt. Hake sie hier nur ab.

- [ ] **[DU]** Zwei-Faktor-Authentifizierung im persönlichen GitHub-Konto aktiv, Wiederherstellungscodes gesichert
- [ ] **[DU]** Private E-Mail-Adresse aktiv („Keep my email addresses private“, „Block command line pushes that expose my email“); noreply-Adresse notiert
- [ ] **[DU]** Organisation `boardbrain` angelegt (Free), 2FA-Pflicht aktiv, Base permissions „Read“
- [ ] **[DU]** Repository `boardbrain/boardbrain.github.io` angelegt: öffentlich, leer; Wiki und Projects aus, Issues an; „Automatically delete head branches“ an
- [ ] **[DU]** Sicherheitsfunktionen: Private vulnerability reporting, Dependabot alerts, Secret scanning mit Push protection an (Dependency graph und CodeQL folgen in Teil I)
- [ ] **[DU]** Actions: nur Actions von GitHub erlaubt; Fork-Workflows nur nach Freigabe; Workflow permissions „Read“; Actions dürfen keine Pull Requests erstellen
- [ ] **[DU]** Pages: Source „GitHub Actions“; Umgebung `github-pages` nur für Tags `v*` (falls die Umgebung noch fehlte: Kontrolle in Teil I, Schritt I6)
- [ ] **[DU]** Tag-Ruleset `Release-Tags` für `v*`: Updates, Löschen und Force-Push gesperrt

---

## Teil B: Werkzeuge installieren [DU]

Dauer: etwa 15 Minuten.

### B1 PowerShell vorbereiten

Windows erlaubt in PowerShell standardmäßig keine Skripte; npm braucht sie aber. Einmalig für dein Benutzerkonto erlauben:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Bestätige mit `J` bzw. `Y`. Prüfe dann, ob der Windows-Paketmanager vorhanden ist:

```powershell
winget --version
```

Es sollte eine Versionsnummer erscheinen. Unter Windows 11 ist winget vorinstalliert.

### B2 Node.js prüfen und installieren

```powershell
node -v
```

| Ergebnis | Vorgehen |
|---|---|
| Fehlermeldung „nicht erkannt“ | Node.js ist nicht installiert: weiter mit dem Installationsbefehl unten |
| `v24.…` | Passt, Installationsbefehl überspringen |
| Eine andere Version | Unter *Einstellungen → Apps → Installierte Apps* „Node.js“ deinstallieren, dann den Installationsbefehl ausführen |

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

Hinweis: Der Befehl installiert die jeweils aktuelle LTS-Version. Im Oktober 2026 wechselt die LTS-Einstufung von Node.js 24 auf 26. Installiert winget bei dir bereits 26, ist das in Ordnung; Claude Code trägt dann die tatsächlich installierte Hauptversion ins Projekt ein.

### B3 Git, GitHub CLI, mkcert und Chrome installieren

```powershell
winget install --id Git.Git -e
winget install --id GitHub.cli -e
winget install --id FiloSottile.mkcert -e
winget install --id Google.Chrome -e
```

Chrome ist der Vergleichsbrowser (NFA-PL-01); falls schon installiert, meldet winget das einfach.

### B4 Installation prüfen

**Schließe das Terminal und öffne es neu**, damit Windows die neuen Programme findet. Dann:

```powershell
node -v
npm -v
git --version
gh --version
mkcert -version
```

Jeder Befehl muss eine Versionsnummer ausgeben. Notiere die Node.js-Version.

---

## Teil C: Git und GitHub CLI einrichten [DU]

### C1 Git konfigurieren

Ersetze `‹NOREPLY›` durch deine noreply-Adresse von GitHub (Form `12345678+Jonasss29@users.noreply.github.com`; zu finden unter GitHub → Settings → Emails).

```powershell
git config --global user.name "Jonasss29"
git config --global user.email "‹NOREPLY›"
git config --global init.defaultBranch main
git config --global core.autocrlf false
git config --global pull.ff only
git config --global fetch.prune true
git config --global core.longpaths true
```

Was die Einstellungen bewirken, steht in Architektur 16.1. Kontrolle:

```powershell
git config --global --list
```

### C2 GitHub CLI anmelden

```powershell
gh auth login --hostname github.com --git-protocol https --web --scopes workflow
```

1. Die Frage „Authenticate Git with your GitHub credentials?“ beantwortest du mit **Yes**.
2. Es erscheint ein achtstelliger Code. Drücke Enter; der Browser öffnet sich.
3. Melde dich bei GitHub an, gib den Code ein und klicke auf **Continue**.
4. Auf der Seite „Authorize GitHub CLI“ steht unten die Organisation **boardbrain**. Klicke daneben auf **Grant**, falls der Knopf angezeigt wird; sonst kann `gh` nicht auf das Repository der Organisation zugreifen.
5. Klicke auf **Authorize github**.

Kontrolle:

```powershell
gh auth status
```

Es muss „Logged in to github.com account Jonasss29“ erscheinen, und unter „Token scopes“ muss `workflow` stehen.

---

## Teil D: Heimnetz vorbereiten [DU]

### D1 Feste IP-Adresse für den PC in der FRITZ!Box

Das HTTPS-Zertifikat gilt für die IP-Adresse deines PCs. Sie darf sich nicht ändern.

1. Öffne im Browser `http://fritz.box` und melde dich an.
2. Gehe zu **Heimnetz → Netzwerk → Netzwerkverbindungen**.
3. Suche deinen PC in der Liste und klicke rechts auf das **Stift-Symbol** (Bearbeiten).
4. Setze den Haken bei **Diesem Netzwerkgerät immer die gleiche IPv4-Adresse zuweisen**.
5. Notiere die angezeigte IPv4-Adresse (z. B. `192.168.178.20`) und klicke auf **OK**.

Kontrolle in PowerShell:

```powershell
ipconfig
```

Die „IPv4-Adresse“ deiner WLAN- oder Ethernet-Verbindung muss mit der notierten übereinstimmen.

### D2 Netzwerk in Windows als „Privat“ einstufen

1. **Einstellungen → Netzwerk und Internet**.
2. Auf **WLAN** bzw. **Ethernet** klicken, dann auf die Eigenschaften deines Netzwerks.
3. **Netzwerkprofiltyp** auf **Privates Netzwerk** stellen.

Nur in privaten Netzwerken erlaubt die Windows-Firewall später den Zugriff vom Handy auf den Entwicklungsserver.

---

## Teil E: Lokale Zertifikate mit mkcert [DU]

**Wichtig:** mkcert erzeugt eine private Zertifizierungsstelle. Ihr Schlüssel `rootCA-key.pem` darf den PC nie verlassen: nicht ins Repository, nicht in eine Cloud, nicht per Mail. Wer ihn hätte, könnte Zertifikate ausstellen, denen deine Geräte vertrauen. Claude Code ist der Zugriff darauf verboten.

### E1 Zertifizierungsstelle anlegen

```powershell
mkcert -install
```

Windows zeigt eine Sicherheitswarnung, dass ein Stammzertifikat installiert wird. Bestätige mit **Ja**. Brave und Chrome unter Windows vertrauen dem Zertifikat ab jetzt.

### E2 Serverzertifikat erzeugen

Ersetze `‹DEINE-IP›` durch die Adresse aus D1.

```powershell
mkdir $env:USERPROFILE\.boardbrain-certs
cd $env:USERPROFILE\.boardbrain-certs
mkcert -cert-file cert.pem -key-file key.pem localhost 127.0.0.1 ::1 ‹DEINE-IP›
```

Im Ordner liegen jetzt `cert.pem` und `key.pem`. Der Entwicklungsserver liest sie später von dort. Ändert sich die IP-Adresse doch einmal, wiederholst du nur diesen Schritt mit der neuen Adresse.

### E3 Stammzertifikat für die Mobilgeräte bereitstellen

```powershell
explorer (mkcert -CAROOT)
```

Der Ordner der Zertifizierungsstelle öffnet sich. Er enthält zwei Dateien:

| Datei | Verwendung |
|---|---|
| `rootCA.pem` | Kommt auf die Mobilgeräte |
| `rootCA-key.pem` | **Bleibt hier. Niemals kopieren.** |

Kopiere **nur** `rootCA.pem` auf den Desktop und benenne die Kopie um in `boardbrain-dev-ca.crt`. Die Endung `.crt` erkennen Android und iOS zuverlässiger.

---

## Teil F: Zertifikat auf den Mobilgeräten installieren [DU]

### F1 Android (Brave)

1. Übertrage `boardbrain-dev-ca.crt` aufs Handy, zum Beispiel per USB-Kabel in den Ordner „Download“ oder per Mail an dich selbst und dann speichern.
2. Öffne **Einstellungen** und suche oben nach **„Zertifikat“** oder **„CA-Zertifikat“**. Der Weg unterscheidet sich je nach Hersteller, typisch ist *Sicherheit und Datenschutz → Weitere Sicherheitseinstellungen → Verschlüsselung und Anmeldedaten → Zertifikat installieren → CA-Zertifikat*; bei Samsung *Sicherheit und Datenschutz → Weitere Sicherheitseinstellungen → Vom Gerätespeicher installieren → CA-Zertifikat*.
3. Die Warnung bestätigst du mit **Trotzdem installieren** und wählst die Datei aus.
4. Kontrolle: Unter *Vertrauenswürdige Anmeldedaten → Nutzer* steht ein Eintrag „mkcert …“.

### F2 iPhone und iPad (Safari)

Führe die Schritte auf beiden Geräten aus.

1. Schicke `boardbrain-dev-ca.crt` per Mail an dich selbst und öffne den Anhang in der App **Mail** von Apple. Alternativ: in iCloud Drive hochladen und in der App **Dateien** antippen.
2. Es erscheint „Profil geladen“. Tippe auf **Schließen**.
3. **Einstellungen → Allgemein → VPN und Geräteverwaltung**, das Profil „mkcert …“ antippen, **Installieren**, Gerätecode eingeben, zweimal **Installieren** bestätigen.
4. **Einstellungen → Allgemein → Info → Zertifikatsvertrauenseinstellungen**: den Schalter bei „mkcert …“ **einschalten** und mit **Fortfahren** bestätigen.

Ohne Schritt 4 vertraut Safari dem Zertifikat nicht.

### F3 Später wieder entfernen

Wenn das Projekt ruht: Android unter *Vertrauenswürdige Anmeldedaten → Nutzer* den Eintrag entfernen; iOS unter *VPN und Geräteverwaltung* das Profil löschen; Windows mit `mkcert -uninstall`.

---

## Teil G: Claude Code einrichten [DU]

### G1 Installieren

```powershell
irm https://claude.ai/install.ps1 | iex
```

Terminal schließen und neu öffnen, dann:

```powershell
claude --version
```

### G2 Anmelden

```powershell
claude
```

Beim ersten Start öffnet sich der Browser. Melde dich mit deinem Claude-Konto (Plan Pro) an. Danach beendest du Claude Code mit `/exit`.

### G3 Erweiterung in VS Code

1. VS Code öffnen, **Erweiterungen** (Strg+Umschalt+X).
2. Nach **Claude Code** suchen, Herausgeber **Anthropic**, **Installieren**.
3. Ein Claude-Symbol erscheint in der Seitenleiste bzw. oben rechts im Editor.

---

## Teil H: Repository klonen und Dokumente ablegen [DU]

### H1 Klonen

Das Projekt liegt in `C:\dev\boardbrain`, ohne Leerzeichen im Pfad und **nicht in OneDrive**, weil die Synchronisation den Ordner `node_modules` stört.

```powershell
mkdir C:\dev
cd C:\dev
gh repo clone boardbrain/boardbrain.github.io boardbrain
```

Die Meldung, dass ein leeres Repository geklont wurde, ist richtig.

### H2 Dokumente ablegen

Lege die Dateien aus der Planung so ab:

```
C:\dev\boardbrain\
├─ CLAUDE.md
└─ docs\
   ├─ BoardBrain_Anforderungsdokumentation.md   (v0.8)
   ├─ BoardBrain_Spezifikation.md               (v0.5)
   ├─ BoardBrain_Architektur.md                 (v0.2)
   ├─ Entwicklungsrichtlinien.md
   ├─ Setup-Anleitung.md                        (diese Datei)
   └─ Setup-DoD.md
```

Die Datei `Start-Prompt-Claude-Code.md` gehört **nicht** ins Repository; halte sie für Teil I bereit.

### H3 In VS Code öffnen

```powershell
code C:\dev\boardbrain
```

Die Frage „Do you trust the authors of the files in this folder?“ beantwortest du mit **Yes, I trust the authors**.

---

## Teil I: Setup mit Claude Code

Öffne Claude Code in VS Code (Claude-Symbol). Stelle das Modell ein: Befehl `/model`, **Opus 5.5**, Aufwand **high**. Füge dann den Text aus `Start-Prompt-Claude-Code.md` ein und sende ihn.

Claude Code arbeitet in Etappen und hält nach jeder an. Die folgende Übersicht zeigt, was wann passiert; die Details liefert Claude Code jeweils selbst.

### I1 Plan freigeben

- **[CLAUDE CODE]** liest die Dokumente und legt im Plan-Modus einen Plan für das gesamte Setup vor, einschließlich der aktuellen Versionen aller Pakete und offener Fragen.
- **[DU]** liest den Plan, stellt Fragen, gibt ihn frei.

### I2 Erster Stand auf `main` und `develop`

- **[CLAUDE CODE]** legt den ersten Commit auf `main` an: Dokumente, `CLAUDE.md`, `README.md`, `LICENSE` (PolyForm Strict 1.0.0, Jonasss29), `CHANGELOG.md`, `.gitattributes`, `.gitignore`. Pusht `main`, legt `develop` an und pusht es. (Schutzregeln gibt es noch nicht; das ist der einzige direkte Push.)
- **[DU]** auf GitHub im Repository:
  1. **Settings → General → Default branch**: auf das Wechselsymbol klicken, **develop** wählen, **Update**, Warnung bestätigen.
  2. Weiter unten unter **Pull Requests**:
     - **Allow merge commits**: an; *Default commit message*: **Pull request title**
     - **Allow squash merging**: an; *Default commit message*: **Pull request title**
     - **Allow rebase merging**: aus
     - **Always suggest updating pull request branches**: an

### I3 Projektgerüst

- **[CLAUDE CODE]** arbeitet im Branch `chore/setup-scaffold`: Vite, React und TypeScript; alle Prüfwerkzeuge mit den Projektregeln; Testgerüste mit je einem ersten Test; Diagnoseansicht `#/diagnose`; Workflows `ci.yml` und `deploy.yml`; `dependabot.yml`; PR-Vorlage; `.claude/settings.json`; `.vscode/`. Führt alle Prüfungen aus, baut testweise Regelverstöße ein und zeigt, dass die Prüfungen sie erkennen. Pusht und eröffnet den Pull Request nach `develop`.

### I4 Lokale Abnahme

- **[CLAUDE CODE]** startet den Entwicklungsserver und nennt dir die Adressen.
- **[DU]**:
  1. Am PC in Brave: `https://localhost:5173/#/diagnose`
  2. Auf Android in Brave sowie auf iPhone und iPad in Safari: `https://‹DEINE-IP›:5173/#/diagnose`
  3. Fragt Windows beim ersten Start, ob Node.js im Netzwerk erreichbar sein darf: nur **Private Netzwerke** erlauben.
  4. Auf allen Geräten: keine Zertifikatswarnung, alle Prüfwerte grün.

### I5 Prüfungen auf GitHub beobachten

- **[DU]** im Pull Request unten: Die Prüfungen `check`, `e2e` und `pr-title` laufen und werden grün. Das dauert einige Minuten. Wird eine rot, sag es Claude Code.

### I6 Schutzregeln und restliche Einstellungen

Jetzt, wo die Prüfungen einmal gelaufen sind, kennt GitHub ihre Namen.

- **[DU]** Ruleset für `develop`: **Settings → Rules → Rulesets → New ruleset → New branch ruleset**
  1. *Ruleset Name*: `develop`; *Enforcement status*: **Active**; *Bypass list*: leer
  2. *Target branches*: **Add target → Include by pattern** → `develop`
  3. Regeln:
     - **Restrict deletions**: an
     - **Require linear history**: an
     - **Require a pull request before merging**: an; *Required approvals*: **0**; *Allowed merge methods*: nur **Squash**
     - **Require status checks to pass**: an; über **Add checks** `check`, `e2e` und `pr-title` hinzufügen; *Require branches to be up to date before merging*: aus
     - **Block force pushes**: an
     - alle übrigen: aus
  4. **Create**
- **[DU]** Ruleset für `main`, genauso, mit diesen Unterschieden:
  - *Ruleset Name* und Muster: `main`
  - **Require linear history**: aus
  - *Allowed merge methods*: nur **Merge**
  - Status checks vorerst: `check`, `e2e`, `pr-title` (`stat` und `guard-main` folgen in I8)
- **[DU]** **Settings → Advanced Security** (bzw. *Code security*):
  - **Dependency graph**: an (falls der Schalter wieder einen Fehler zeigt: unter **Insights → Dependency graph** prüfen, ob Pakete aufgelistet sind; dann ist er aktiv)
  - **Dependabot security updates**: **Enable**
  - **Grouped security updates**: **Enable**
  - **Dependabot version updates**: nichts tun; sie werden durch die Datei `.github/dependabot.yml` aktiv, sobald sie auf `develop` liegt
  - **CodeQL analysis**: **Set up → Default**, Sprachen bestätigen, **Enable CodeQL**
- **[DU]** **Settings → Environments → github-pages**: Unter *Deployment branches and tags* darf nur die Regel **Tag `v*`** stehen. Fehlt die Umgebung noch, entsteht sie beim ersten Release; dann diese Kontrolle in I9 vor dem Release-Befehl nachholen.

### I7 Mergen

- **[DU]** Im Pull Request **Squash and merge**, dann **Confirm squash and merge**.
- **[CLAUDE CODE]** wechselt auf `develop` und holt den neuen Stand.

### I8 Schutz nachweisen

- **[CLAUDE CODE]** versucht einen direkten Push nach `develop` (wird abgelehnt) und eröffnet einen Test-Pull-Request aus einem Testbranch nach `main`. Dort laufen `stat` und `guard-main`; `guard-main` muss fehlschlagen.
- **[DU]** Im Ruleset `main` unter *Require status checks to pass* zusätzlich `stat` und `guard-main` hinzufügen und speichern.
- **[CLAUDE CODE]** schließt den Test-Pull-Request und löscht den Testbranch.

### I9 Release 0.1.0

- **[CLAUDE CODE]** eröffnet `chore/release-0.1.0` nach `develop` (Version 0.1.0, Eintrag in `CHANGELOG.md`).
- **[DU]** mergt nach grünen Prüfungen (Squash).
- **[CLAUDE CODE]** eröffnet den Pull Request `develop` → `main` mit Titel `release: 0.1.0`.
- **[DU]** wartet auf alle Prüfungen einschließlich `stat` und `guard-main` und mergt mit **Create a merge commit**.
- **[DU]** Kontrolle der Umgebung `github-pages` (siehe I6), falls noch offen.
- **[CLAUDE CODE]** fragt nach deiner Zustimmung und führt dann `gh release create v0.1.0 --target main` aus.
- **[DU]** Unter **Actions** läuft der Workflow „Deploy“ und wird grün.

### I10 Veröffentlichung prüfen

- **[DU]** auf PC, Android, iPhone und iPad: `https://boardbrain.github.io/` öffnen. Die Diagnoseansicht erscheint ohne Warnung.
- **[DU]** am PC in Brave: Entwicklertools (F12) → **Application → Service Workers**: Es ist **kein** Service Worker registriert. Unter **Elements** steht im `<head>` das Meta-Tag `Content-Security-Policy`.

### I11 Abschluss

- **[CLAUDE CODE]** geht mit dir `docs/Setup-DoD.md` durch, hakt die Punkte ab und eröffnet dafür einen Pull Request `docs: Setup-DoD abgeschlossen` nach `develop`.
- **[DU]** mergt.
- **[DU]** Falls Dependabot inzwischen Pull Requests eröffnet hat: nach grünen Prüfungen mergen oder bis zum ersten Bündel liegen lassen.
- **[DU]** Im Claude-Projekt „BoardBrain“ auf claude.ai die alten Dokumente löschen. Ab jetzt ist `docs/` im Repository die einzige Masterkopie (EP-09). Für spätere Planungs-Chats lädst du bei Bedarf den aktuellen Stand von GitHub hoch.

Damit ist das Setup abgeschlossen. Nächster Schritt: Design (OP-06, OP-11) oder direkt Inkrement I1.

---

## Hilfe bei typischen Problemen

| Problem | Lösung |
|---|---|
| `npm` meldet „Ausführung von Skripts ist auf diesem System deaktiviert“ | Schritt B1 ausführen |
| Ein Befehl wird nach der Installation „nicht erkannt“ | Terminal schließen und neu öffnen; bei VS Code das ganze Programm neu starten |
| `gh` kann nicht auf `boardbrain/boardbrain.github.io` zugreifen | Unter GitHub → Settings → Applications → Authorized OAuth Apps → GitHub CLI den Zugriff für die Organisation **boardbrain** gewähren; oder `gh auth login` wiederholen und auf **Grant** achten |
| Push wird mit „workflow scope“ abgelehnt | `gh auth refresh --scopes workflow` |
| Handy zeigt Zertifikatswarnung | Unter iOS die Zertifikatsvertrauenseinstellung (F2, Schritt 4) prüfen; IP-Adresse in `ipconfig` mit der im Zertifikat vergleichen (E2) |
| Handy erreicht den PC nicht | Gleiches WLAN? Netzwerk in Windows „Privat“ (D2)? Firewall-Abfrage für Node.js erlaubt? |
| Prüfung auf GitHub rot, lokal grün | Claude Code den Link zum fehlgeschlagenen Lauf geben; häufig Zeilenenden oder fehlende Dateien im Commit |
