CONTABILITÀ IVAN — PROTOTIPO v0.2

NOVITÀ v0.2
- modifica e cancellazione di qualsiasi movimento
- OCR con schermata di anteprima SEMPRE correggibile prima del salvataggio
- separazione tra “ragione sociale / testo originale” e “esercente visualizzato”
- memoria locale delle associazioni: es. ALFA DISTRIBUZIONE SRL -> Conad Aviano
- prima funzione di importazione estratto conto CSV
- riconciliazione proposta per stesso importo e data entro ±3 giorni
- movimenti bancari non trovati inviati alla maschera per classificazione manuale
- backup completo JSON + export CSV
- PWA pronta per GitHub Pages, con icone e service worker

ARCHITETTURA
GitHub Pages ospita SOLO il codice dell'app.
I dati personali restano nel localStorage del browser/dispositivo.
Il backup JSON/CSV può essere conservato privatamente (ad esempio su Google Drive).

PUBBLICAZIONE SU GITHUB PAGES
1. Crea un nuovo repository GitHub, per esempio “contabilita-ivan”.
2. Carica nella radice del repository TUTTI i file contenuti in questo ZIP.
3. In GitHub apri Settings > Pages.
4. In “Build and deployment” scegli “Deploy from a branch”.
5. Seleziona branch “main” e cartella “/(root)”, quindi Save.
6. GitHub mostrerà l'indirizzo HTTPS dell'app.
7. Aprilo da Chrome sul telefono e usa “Aggiungi a schermata Home” / “Installa app”.

PRIVACY
Non caricare su GitHub backup JSON, estratti conto, foto degli scontrini o altri dati personali.
Il file seed.js contiene i movimenti iniziali importati dall'Excel 2026: per un repository pubblico sarebbe quindi preferibile NON pubblicare questa versione con seed.js popolato. Per uso privato, crea un repository PRIVATE oppure usa una successiva build “pulita” in cui i dati iniziali vengono importati separatamente.

NOTA IMPORTANTE SU GITHUB PAGES
GitHub Pages normalmente pubblica solo repository compatibili con Pages secondo il piano/account in uso. Se vuoi evitare qualsiasi rischio di esposizione dei dati, useremo una build pulita senza movimenti incorporati nel codice e importeremo il backup dopo l'installazione.

IMPORT BANCA
Il parser CSV cerca automaticamente colonne con nomi simili a:
- Data / Data operazione / Data contabile
- Importo oppure Addebiti + Accrediti
- Descrizione / Causale / Operazione / Dettagli

Il formato varia da banca a banca: quando avremo un tuo estratto conto di esempio potremo creare un importatore specifico molto più affidabile.


BUILD GITHUB-SAFE
Questa build NON contiene i movimenti 2026. Dopo l'installazione usa Backup > Importa backup JSON e seleziona il file Contabilita_Ivan_dati_iniziali_PRIVATO.json, da conservare solo privatamente.
