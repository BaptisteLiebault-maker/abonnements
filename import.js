// Import d'un relevé bancaire : on lit le fichier de la banque (CSV, OFX ou QIF),
// puis on cherche les paiements qui reviennent régulièrement.
// Tout se passe dans le navigateur : le fichier n'est jamais envoyé sur Internet.

// ---------- RÉGLAGES ----------

// La liste des services connus (MARCHANDS, SERVICES) est dans app.js

// Mots que les banques ajoutent au libellé et qui ne disent pas qui on paie
const MOTS_VIDES = new Set((
  "PRLV SEPA PRELEVEMENT PRELEVT PRLVT PRELEV CB CARTE PAIEMENT PAIEMT PAIE ACHAT ACHATS " +
  "FACTURE FACT FAC ECHEANCE ECH VIR VIREMENT VIRT PERMANENT EUROPEEN EUROP INST INSTANTANE " +
  "RECU EMIS DE DU DES LA LE LES AU AUX ET EN POUR PAR REF REFERENCE MANDAT ID ICS RUM " +
  "CARD PAYMENT DEBIT TPE COM FR WWW HTTP HTTPS SAS SARL SA EUR EURO EUROS"
).split(" "));

// Les fréquences qu'on sait reconnaître, avec l'écart moyen entre deux paiements (en jours)
// et la marge acceptée (un prélèvement peut tomber un peu avant ou après)
const PERIODES = [
  { cle: "semaine", jours: 7, min: 5, max: 9, marge: 2 },
  { cle: "mois", jours: 30.4, min: 24, max: 38, marge: 6 },
  { cle: "an", jours: 365, min: 330, max: 400, marge: 25 },
];

const MOIS_TEXTE = {
  JAN: 1, JANV: 1, JANVIER: 1, FEB: 2, FEV: 2, FEVR: 2, FEVRIER: 2, MAR: 3, MARS: 3,
  APR: 4, AVR: 4, AVRIL: 4, MAY: 5, MAI: 5, JUN: 6, JUIN: 6, JUL: 7, JUIL: 7, JUILLET: 7,
  AUG: 8, AOU: 8, AOUT: 8, SEP: 9, SEPT: 9, SEPTEMBRE: 9, OCT: 10, OCTOBRE: 10,
  NOV: 11, NOVEMBRE: 11, DEC: 12, DECEMBRE: 12,
};

const JOUR = 86400000;

// ---------- PETITS OUTILS ----------

// "Date de l'opération" → "date de l operation" (pour reconnaître les titres de colonnes)
function cleColonne(texte) {
  return normaliser(texte).toLowerCase();
}

function titre(mots) {
  return mots.map(mot => mot[0] + mot.slice(1).toLowerCase()).join(" ");
}

function mediane(nombres) {
  const tries = [...nombres].sort((a, b) => a - b);
  const milieu = Math.floor(tries.length / 2);
  return tries.length % 2 ? tries[milieu] : (tries[milieu - 1] + tries[milieu]) / 2;
}

function enTexteISO(date) {
  return date.toLocaleDateString("sv");     // format AAAA-MM-JJ
}

// ---------- LIRE LES MONTANTS ET LES DATES ----------

// "-1 234,56 €", "12.99", "(12,99)", "12,99-" → nombre (NaN si ce n'est pas un montant)
function lireMontant(texte) {
  let t = String(texte ?? "").trim();
  if (!t) return NaN;
  let negatif = false;
  if (/^\(.*\)$/.test(t)) { negatif = true; t = t.slice(1, -1); }
  t = t.replace(/[\s  ']/g, "").replace(/[€$£]|EUR/gi, "").replace(/−/g, "-");
  if (t.endsWith("-")) { negatif = !negatif; t = t.slice(0, -1); }
  if (t.startsWith("+")) t = t.slice(1);
  else if (t.startsWith("-")) { negatif = !negatif; t = t.slice(1); }
  if (!/^\d[\d.,]*$/.test(t)) return NaN;

  // Le dernier séparateur est celui des centimes, les autres séparent les milliers
  const virgule = t.lastIndexOf(","), point = t.lastIndexOf(".");
  if (virgule >= 0 && point >= 0) {
    const centimes = virgule > point ? "," : ".";
    t = t.split(centimes === "," ? "." : ",").join("").replace(centimes, ".");
  } else if (virgule >= 0) {
    t = t.split(",").length > 2 ? t.replace(/,/g, "") : t.replace(",", ".");
  } else if (point >= 0 && t.split(".").length > 2) {
    t = t.replace(/\./g, "");
  }
  const nombre = Number(t);
  if (!Number.isFinite(nombre)) return NaN;
  return negatif ? -nombre : nombre;
}

// Découpe une date en morceaux. "jma" = jour/mois/année, "amj" = année/mois/jour,
// "?" = on ne sait pas encore si c'est 05/09 (5 septembre) ou 05/09 (9 mai, à l'américaine)
function morceauxDate(texte) {
  const t = String(texte ?? "").trim();
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/) || t.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return { ordre: "amj", a: +m[3], b: +m[2], annee: +m[1] };
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.'](\d{2,4})\b/);
  if (m) return { ordre: "?", a: +m[1], b: +m[2], annee: +m[3] };
  m = normaliser(t).match(/^(\d{1,2}) ([A-Z]+) (\d{2,4})\b/);
  if (m && MOIS_TEXTE[m[2]]) return { ordre: "jma", a: +m[1], b: MOIS_TEXTE[m[2]], annee: +m[3] };
  return null;
}

// Regarde toutes les dates du fichier pour savoir si le jour vient avant le mois
function detecterOrdreDates(textes) {
  for (const texte of textes) {
    const d = morceauxDate(texte);
    if (d?.ordre !== "?") continue;
    if (d.a > 12) return "jma";
    if (d.b > 12) return "mja";
  }
  return "jma";                              // par défaut, à la française
}

function lireDate(texte, ordre) {
  const d = morceauxDate(texte);
  if (!d) return null;
  const versLAmericaine = d.ordre === "?" && ordre === "mja";
  const jour = versLAmericaine ? d.b : d.a;
  const mois = versLAmericaine ? d.a : d.b;
  const annee = d.annee < 100 ? 2000 + d.annee : d.annee;
  const date = new Date(annee, mois - 1, jour);
  if (date.getMonth() !== mois - 1 || date.getDate() !== jour || annee < 1990) return null;
  return date;
}

// ---------- LIRE LE FICHIER DE LA BANQUE ----------

// Renvoie la liste des opérations : { date, montant (négatif = argent qui sort), libelle }
function lireReleve(texte) {
  texte = texte.replace(/^﻿/, "");
  if (/<STMTTRN>/i.test(texte)) return lireOFX(texte);
  if (/^\s*!Type:/im.test(texte)) return lireQIF(texte);
  return lireCSV(texte);
}

function lireOFX(texte) {
  const blocs = texte.split(/<STMTTRN>/i).slice(1);
  const champ = (bloc, nom) => (bloc.match(new RegExp(`<${nom}>([^<\\r\\n]*)`, "i")) || [])[1]?.trim() || "";
  return blocs.map(bloc => ({
    date: lireDate(champ(bloc, "DTPOSTED").slice(0, 8), "jma"),
    montant: lireMontant(champ(bloc, "TRNAMT")),
    libelle: [champ(bloc, "NAME"), champ(bloc, "MEMO")].filter(Boolean).join(" "),
  })).filter(op => op.date && !Number.isNaN(op.montant));
}

function lireQIF(texte) {
  const fiches = texte.split(/^\^/m).map(fiche => {
    const valeurs = {};
    fiche.split(/\r?\n/).forEach(ligne => {
      if (ligne && !valeurs[ligne[0]]) valeurs[ligne[0]] = ligne.slice(1).trim();
    });
    return valeurs;
  });
  const ordre = detecterOrdreDates(fiches.map(f => f.D));
  return fiches.map(f => ({
    date: lireDate(f.D, ordre),
    montant: lireMontant(f.T ?? f.U),
    libelle: [f.P, f.M].filter(Boolean).join(" "),
  })).filter(op => op.date && !Number.isNaN(op.montant));
}

// Découpe un texte CSV en lignes et en cases (gère les "guillemets")
function decouperCSV(texte, separateur) {
  const lignes = [];
  let ligne = [], cellule = "", entreGuillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (entreGuillemets) {
      if (c === '"' && texte[i + 1] === '"') { cellule += '"'; i++; }
      else if (c === '"') entreGuillemets = false;
      else cellule += c;
    } else if (c === '"') entreGuillemets = true;
    else if (c === separateur) { ligne.push(cellule); cellule = ""; }
    else if (c === "\n") { ligne.push(cellule); lignes.push(ligne); ligne = []; cellule = ""; }
    else if (c !== "\r") cellule += c;
  }
  ligne.push(cellule);
  lignes.push(ligne);
  return lignes.map(l => l.map(s => s.trim())).filter(l => l.some(s => s !== ""));
}

// Le séparateur est celui qui donne le plus souvent le même nombre de colonnes
function detecterSeparateur(texte) {
  const debut = texte.split("\n").slice(0, 60).join("\n");
  let meilleur = ";", meilleurScore = -1;
  for (const sep of [";", ",", "\t", "|"]) {
    const compte = {};
    decouperCSV(debut, sep).forEach(l => { if (l.length > 1) compte[l.length] = (compte[l.length] || 0) + 1; });
    const [nbColonnes, nbLignes] = Object.entries(compte).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0] || [0, 0];
    const score = nbLignes * 100 + Number(nbColonnes);
    if (score > meilleurScore) { meilleur = sep; meilleurScore = score; }
  }
  return meilleur;
}

// Cherche la ligne de titres ("Date", "Libellé", "Montant"…), parfois après quelques lignes d'infos
function trouverEntete(lignes) {
  for (let i = 0; i < Math.min(lignes.length, 30); i++) {
    const cles = lignes[i].map(cleColonne);
    const aUneDate = cles.some(c => /date/.test(c));
    const aUnMontant = cles.some(c => /montant|amount|somme|debit|credit/.test(c));
    if (aUneDate && aUnMontant) return i;
  }
  return -1;
}

function colonnesDepuisEntete(entete) {
  const cles = entete.map(cleColonne);
  const trouver = (test, interdits = []) => cles.findIndex((c, i) => test.test(c) && !interdits.includes(i));

  let date = trouver(/date/);
  const dateOperation = cles.findIndex(c => /date/.test(c) && !/val/.test(c));
  if (dateOperation >= 0) date = dateOperation;

  const montant = trouver(/montant|amount|somme/, [date]);
  const debit = trouver(/debit/, [date, montant]);
  const credit = trouver(/credit/, [date, montant, debit]);
  const prises = [date, montant, debit, credit];

  // Le libellé : on prend la colonne la plus précise qui existe
  let libelle = -1;
  for (const mot of ["libelle simplifie", "libelle", "label", "intitule", "description",
    "beneficiaire", "payee", "nature", "operation"]) {
    libelle = cles.findIndex((c, i) => c.includes(mot) && !prises.includes(i));
    if (libelle >= 0) break;
  }
  const detail = cles.findIndex((c, i) => /detail|information|complement|memo|supplierfound/.test(c) && i !== libelle && !prises.includes(i));
  return { date, montant, debit, credit, libelle, detail };
}

// Fichier sans ligne de titres : on devine les colonnes en regardant leur contenu
function devinerColonnes(lignes) {
  const nb = Math.max(...lignes.map(l => l.length));
  const stats = [];
  for (let i = 0; i < nb; i++) {
    const cases = lignes.map(l => l[i] || "").filter(Boolean);
    const part = test => cases.filter(test).length / Math.max(1, lignes.length);
    stats.push({
      dates: part(c => morceauxDate(c)),
      montants: part(c => !morceauxDate(c) && !Number.isNaN(lireMontant(c))),
      centimes: part(c => /[.,]\d{2}$/.test(c)),
      longueur: cases.filter(c => Number.isNaN(lireMontant(c))).reduce((t, c) => t + c.length, 0) / Math.max(1, cases.length),
    });
  }
  const meilleure = (score, interdits = []) => {
    let choix = -1;
    stats.forEach((s, i) => { if (!interdits.includes(i) && score(s) > 0.5 && (choix < 0 || score(s) > score(stats[choix]))) choix = i; });
    return choix;
  };
  const date = meilleure(s => s.dates);
  const montant = meilleure(s => s.montants + s.centimes, [date]);
  let libelle = -1;
  stats.forEach((s, i) => { if (i !== date && i !== montant && s.longueur > (libelle < 0 ? 0 : stats[libelle].longueur)) libelle = i; });
  return { date, montant, debit: -1, credit: -1, libelle, detail: -1 };
}

function lireCSV(texte) {
  const lignes = decouperCSV(texte, detecterSeparateur(texte));
  const iEntete = trouverEntete(lignes);
  const col = iEntete >= 0 ? colonnesDepuisEntete(lignes[iEntete]) : devinerColonnes(lignes);
  const donnees = lignes.slice(iEntete + 1);
  if (col.date < 0 || (col.montant < 0 && col.debit < 0 && col.credit < 0)) return [];

  const ordre = detecterOrdreDates(donnees.map(l => l[col.date]));
  const operations = [];
  donnees.forEach(l => {
    const date = lireDate(l[col.date], ordre);
    if (!date) return;
    let montant = col.montant >= 0 ? lireMontant(l[col.montant]) : NaN;
    if (Number.isNaN(montant)) {
      const debit = lireMontant(l[col.debit]), credit = lireMontant(l[col.credit]);
      if (debit) montant = -Math.abs(debit);
      else if (!Number.isNaN(credit)) montant = Math.abs(credit);
    }
    if (Number.isNaN(montant)) return;
    const libelle = [l[col.libelle], l[col.detail]].filter(Boolean).join(" ");
    operations.push({ date, montant, libelle });
  });

  // Certains relevés n'ont qu'une colonne "Montant" sans signe moins : ce sont alors des dépenses
  if (col.montant >= 0 && col.debit < 0 && operations.length && operations.every(op => op.montant >= 0)) {
    operations.forEach(op => op.montant = -op.montant);
  }
  return operations;
}

// ---------- TROUVER LES ABONNEMENTS ----------

// Regroupe les paiements faits au même endroit, puis garde ceux qui reviennent régulièrement.
// finReleve = date de la dernière opération du relevé
function trouverAbonnements(operations, finReleve) {
  const groupes = new Map();
  operations.forEach(op => {
    if (op.montant >= 0) return;                         // on ne garde que l'argent qui sort
    const texte = normaliser(op.libelle);
    if (/\b(RETRAIT|DAB)\b/.test(texte)) return;         // retraits d'espèces

    const connu = MARCHANDS.find(([regle]) => regle.test(texte));
    let cle, nom, categorie;
    if (connu) {
      [, nom, categorie] = connu;
      cle = "connu:" + nom;
    } else {
      const mots = texte.split(" ").filter(mot => mot.length > 1 && !/\d/.test(mot) && !MOTS_VIDES.has(mot));
      if (!mots.length) return;
      cle = mots.slice(0, 2).join(" ");
      nom = titre(mots.slice(0, 2));
      categorie = devinerCategorie(texte) ?? "autre";
    }
    if (!groupes.has(cle)) {
      groupes.set(cle, { nom, categorie, connu: Boolean(connu), virement: /^VIR/.test(texte), operations: [] });
    }
    groupes.get(cle).operations.push(op);
  });

  const trouves = [];
  groupes.forEach(groupe => {
    regrouperParPrix(groupe.operations, groupe.connu).forEach(paiements => {
      const abo = analyserPaiements(paiements, groupe, finReleve);
      if (abo) trouves.push(abo);
    });
  });
  return trouves.sort((a, b) => b.coche - a.coche || prixParMois(b) - prixParMois(a));
}

// Au même endroit, on peut payer plusieurs choses (Apple : iCloud et Apple Music, par exemple).
// On sépare donc les paiements par prix, en tolérant de petites différences.
function regrouperParPrix(operations, connu) {
  const tries = [...operations].sort((a, b) => a.montant - b.montant);
  const paquets = [];
  tries.forEach(op => {
    const dernier = paquets[paquets.length - 1];
    const prix = Math.abs(op.montant);
    const prixPrecedent = dernier && Math.abs(dernier[dernier.length - 1].montant);
    if (dernier && Math.abs(prix - prixPrecedent) <= Math.max(1, prix * 0.12)) dernier.push(op);
    else paquets.push([op]);
  });
  paquets.forEach(p => p.sort((a, b) => a.date - b.date));

  // Si le prix a augmenté en cours de route (13,49 € puis 15,99 €), les deux paquets
  // se suivent dans le temps sans se mélanger : c'est le même abonnement.
  // Pour un service connu, un seul paiement au nouveau prix suffit.
  paquets.sort((a, b) => a[0].date - b[0].date);
  const fusionnes = [];
  paquets.forEach(p => {
    const avant = fusionnes[fusionnes.length - 1];
    const seSuivent = avant && avant.length > 1 && avant[avant.length - 1].date < p[0].date;
    if (seSuivent && (p.length > 1 || connu)) avant.push(...p);
    else fusionnes.push(p);
  });
  return fusionnes;
}

function analyserPaiements(paiements, groupe, finReleve) {
  const dernier = paiements[paiements.length - 1];
  let periode, confiance;

  if (paiements.length >= 2) {
    const ecarts = paiements.slice(1).map((op, i) => Math.round((op.date - paiements[i].date) / JOUR));
    const ecartHabituel = mediane(ecarts);
    periode = PERIODES.find(p => ecartHabituel >= p.min && ecartHabituel <= p.max);
    if (!periode) return null;

    // Les écarts doivent tomber sur la période (ou un multiple, si un mois manque dans le relevé)
    const reguliers = ecarts.filter(e => {
      const fois = Math.max(1, Math.round(e / periode.jours));
      return Math.abs(e - fois * periode.jours) <= periode.marge * fois;
    });
    if (reguliers.length / ecarts.length < 0.6) return null;
    confiance = paiements.length >= 3 || groupe.connu ? "sur" : "probable";
  } else {
    // Un seul paiement : on ne le propose que si on connaît le service et qu'il n'y a eu qu'un paiement.
    // S'il date de plus de 40 jours sans recommencer, c'est sûrement un abonnement à l'année.
    if (!groupe.connu || groupe.operations.length > 1) return null;
    periode = (finReleve - dernier.date) / JOUR > 40 ? PERIODES[2] : PERIODES[1];
    confiance = "verifier";
  }

  // Pour un service connu, on retrouve l'offre grâce au prix payé (Netflix 21,99 € → Premium)
  const prix = Math.round(Math.abs(dernier.montant) * 100) / 100;
  const offre = SERVICES[groupe.nom]?.offres.find(o => o.frequence === periode.cle && Math.abs(o.prix - prix) < 0.3);

  return {
    nom: groupe.nom,
    categorie: groupe.categorie,
    connu: groupe.connu,
    offre: offre?.nom,
    prix,
    frequence: periode.cle,
    date: enTexteISO(dernier.date),             // le site calcule tout seul le prochain paiement
    nombre: paiements.length,
    confiance,
    libelle: dernier.libelle,
    coche: !groupe.virement && (confiance === "sur" || groupe.connu),
  };
}

// ---------- INTERFACE ----------

const CONFIANCES = {
  sur: { label: "Sûr", couleur: "var(--vert)" },
  probable: { label: "Probable", couleur: "var(--bleu)" },
  verifier: { label: "À vérifier", couleur: "var(--orange)" },
  deja: { label: "Déjà dans ta liste", couleur: "var(--texte-doux)" },
};

const dateLongue = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
let detections = [];

function messageImport(texte, type = "") {
  el("importMessage").textContent = texte;
  el("importMessage").className = "import-message " + type;
  el("importMessage").hidden = !texte;
}

// Les banques françaises exportent souvent en "Windows-1252" plutôt qu'en UTF-8
async function lireTexte(fichier) {
  const octets = await fichier.arrayBuffer();
  try { return new TextDecoder("utf-8", { fatal: true }).decode(octets); }
  catch { return new TextDecoder("windows-1252").decode(octets); }
}

async function importerFichiers(fichiers) {
  fichiers = [...fichiers];
  if (!fichiers.length) return;
  el("importResultats").hidden = true;

  const pasLisibles = fichiers.filter(f => /\.(xlsx?|pdf|ods|numbers)$/i.test(f.name));
  if (pasLisibles.length) {
    messageImport(`« ${pasLisibles[0].name} » n'est pas un fichier que le site sait lire. ` +
      "Sur le site de ta banque, choisis plutôt le format CSV (ou OFX, QIF) au moment de télécharger tes opérations.", "erreur");
    return;
  }

  // Si plusieurs relevés se chevauchent, une même opération ne doit compter qu'une fois
  const vues = new Map();
  for (const fichier of fichiers) {
    const dansCeFichier = new Map();
    lireReleve(await lireTexte(fichier)).forEach(op => {
      const cle = `${enTexteISO(op.date)}|${op.montant}|${op.libelle}`;
      const liste = dansCeFichier.get(cle) || [];
      liste.push(op);
      dansCeFichier.set(cle, liste);
    });
    dansCeFichier.forEach((liste, cle) => {
      if (!vues.has(cle) || vues.get(cle).length < liste.length) vues.set(cle, liste);
    });
  }
  const operations = [...vues.values()].flat();

  if (!operations.length) {
    messageImport("Aucune opération trouvée dans ce fichier. Vérifie que c'est bien l'export des opérations " +
      "de ton compte (avec une date, un libellé et un montant pour chaque ligne).", "erreur");
    return;
  }

  const dates = operations.map(op => op.date.getTime());
  const debut = new Date(Math.min(...dates)), fin = new Date(Math.max(...dates));
  detections = trouverAbonnements(operations, fin);

  // On repère ceux qui sont déjà dans la liste
  const nomsExistants = abonnements.map(abo => normaliser(abo.nom));
  detections.forEach(d => {
    const nom = normaliser(d.nom);
    d.deja = nomsExistants.some(n => n.length > 2 && (n.includes(nom) || nom.includes(n)));
    if (d.deja) d.coche = false;
  });

  const jours = Math.round((fin - debut) / JOUR);
  let texte = `${operations.length} opérations lues, du ${dateLongue.format(debut)} au ${dateLongue.format(fin)}. `;
  texte += detections.length
    ? `${detections.length} paiement${detections.length > 1 ? "s" : ""} régulier${detections.length > 1 ? "s" : ""} trouvé${detections.length > 1 ? "s" : ""} : coche ceux que tu veux ajouter, et corrige le nom si besoin.`
    : "Aucun paiement régulier trouvé.";
  if (jours < 55) texte += " Astuce : avec au moins 3 mois d'opérations, la détection est bien plus fiable.";
  messageImport(texte, detections.length ? "" : "erreur");

  afficherDetections();
}

function afficherDetections() {
  const liste = el("detections");
  liste.innerHTML = "";
  el("importResultats").hidden = detections.length === 0;

  detections.forEach(d => {
    const ligne = el("modeleDetection").content.firstElementChild.cloneNode(true);
    ligne.classList.toggle("deja", d.deja);

    const choisir = ligne.querySelector(".det-choisir");
    choisir.checked = d.coche;
    choisir.addEventListener("change", () => { d.coche = choisir.checked; compterSelection(); });

    const nom = ligne.querySelector(".det-nom");
    nom.value = d.nom;
    nom.addEventListener("input", () => d.nom = nom.value);   // la catégorie est devinée à l'ajout

    const confiance = CONFIANCES[d.deja ? "deja" : d.confiance];
    const badge = ligne.querySelector(".badge");
    badge.textContent = confiance.label;
    badge.style.setProperty("--couleur", confiance.couleur);

    const quand = { semaine: "toutes les semaines", mois: "tous les mois", an: "tous les ans" }[d.frequence];
    const cat = CATEGORIES[d.categorie];
    const service = `${cat.emoji} ${cat.label}${d.offre ? ` · offre ${d.offre}` : ""} · `;
    ligne.querySelector(".det-details").textContent = service + (d.nombre > 1
      ? `${d.nombre} paiements, ${quand} · dernier le ${jourMois.format(new Date(d.date + "T00:00:00"))}`
      : `1 seul paiement le ${jourMois.format(new Date(d.date + "T00:00:00"))} · vérifie la fréquence`);
    ligne.querySelector(".det-libelle").textContent = d.libelle;
    ligne.querySelector(".det-libelle").title = d.libelle;

    const frequence = ligne.querySelector(".det-frequence");
    Object.entries(FREQUENCES).forEach(([cle, f]) => frequence.add(new Option(`${euros.format(d.prix)} ${f.label}`, cle)));
    frequence.value = d.frequence;
    frequence.addEventListener("change", () => d.frequence = frequence.value);

    const usage = ligne.querySelector(".det-usage");
    Object.entries(USAGES).forEach(([cle, u]) => usage.add(new Option(u.label, cle)));
    usage.value = d.usage || USAGE_PAR_DEFAUT;
    usage.addEventListener("change", () => d.usage = usage.value);

    liste.append(ligne);
  });
  compterSelection();
}

function compterSelection() {
  const nombre = detections.filter(d => d.coche).length;
  el("boutonImporter").disabled = nombre === 0;
  el("boutonImporter").textContent = nombre
    ? `Ajouter ${nombre} abonnement${nombre > 1 ? "s" : ""}`
    : "Coche au moins un abonnement";
}

el("boutonImporter").addEventListener("click", () => {
  const choisis = detections.filter(d => d.coche);
  choisis.forEach(d => abonnements.push({
    id: nouvelId(),
    nom: d.nom.trim().slice(0, 40) || "Abonnement",
    prix: d.prix,
    frequence: d.frequence,
    categorie: devinerCategorie(d.nom) ?? d.categorie,
    date: d.date,
    usage: d.usage || USAGE_PAR_DEFAUT,
    offre: d.offre,
  }));
  sauvegarder();
  afficher();
  detections = [];
  el("importResultats").hidden = true;
  messageImport(`${choisis.length} abonnement${choisis.length > 1 ? "s" : ""} ajouté${choisis.length > 1 ? "s" : ""} à ta liste ✓ ` +
    "Pense à dire si tu t'en sers vraiment (bouton ✏️), pour voir combien tu peux économiser.", "succes");
});

el("boutonFermerImport").addEventListener("click", () => {
  detections = [];
  el("importResultats").hidden = true;
  messageImport("");
});

// Choisir le fichier, ou le glisser-déposer sur la zone
const depot = el("depot");
el("fichierReleve").addEventListener("change", e => {
  importerFichiers(e.target.files);
  e.target.value = "";                      // pour pouvoir redéposer le même fichier
});
["dragenter", "dragover"].forEach(type => depot.addEventListener(type, e => {
  e.preventDefault();
  depot.classList.add("survol");
}));
["dragleave", "drop"].forEach(type => depot.addEventListener(type, () => depot.classList.remove("survol")));
depot.addEventListener("drop", e => {
  e.preventDefault();
  importerFichiers(e.dataTransfer.files);
});
