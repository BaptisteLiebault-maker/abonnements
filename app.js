// ---------- RÉGLAGES ----------

const CATEGORIES = {
  streaming: { label: "Streaming", emoji: "🎬", color: "#ef4444" },
  musique:   { label: "Musique", emoji: "🎵", color: "#22c55e" },
  jeux:      { label: "Jeux vidéo", emoji: "🎮", color: "#8b5cf6" },
  logiciels: { label: "Logiciels & cloud", emoji: "☁️", color: "#3b82f6" },
  sport:     { label: "Sport", emoji: "🏋️", color: "#f97316" },
  presse:    { label: "Presse & livres", emoji: "📰", color: "#eab308" },
  telecom:   { label: "Téléphone & internet", emoji: "📱", color: "#0ea5e9" },
  autre:     { label: "Autre", emoji: "📦", color: "#64748b" },
};

// Combien de fois on paie par mois selon la fréquence
const FREQUENCES = {
  semaine: { label: "/ sem.", parMois: 52 / 12 },
  mois:    { label: "/ mois", parMois: 1 },
  an:      { label: "/ an", parMois: 1 / 12 },
};

// Ce que la personne veut faire de l'abonnement.
// "Le diminuer" = le garder mais payer moins (offre moins chère ou prix visé).
const USAGES = {
  garder:   { label: "Le garder", couleur: "var(--vert)", ordre: 2 },
  diminuer: { label: "Le diminuer", couleur: "var(--orange)", ordre: 1 },
  enlever:  { label: "L'enlever", couleur: "var(--rouge)", ordre: 0 },
};
const USAGE_PAR_DEFAUT = "garder";

// Les anciennes réponses (avant les changements de boutons) sont converties
const ANCIENS_USAGES = {
  souvent: "garder", parfois: "garder", rarement: "diminuer", jamais: "enlever",
  indispensable: "garder", necessaire: "garder", utile: "diminuer", inutile: "enlever",
};

// Services connus : catégorie et offres (de la moins chère à la plus chère).
// Prix indicatifs en France : ils changent souvent, corrige-les ici si besoin.
// reservee: true = offre que tout le monde ne peut pas prendre (étudiants…) : on ne la conseille pas.
const SERVICES = {
  "Netflix": { categorie: "streaming", offres: [
    { nom: "Standard avec pub", prix: 7.99, frequence: "mois" },
    { nom: "Standard", prix: 14.99, frequence: "mois" },
    { nom: "Premium", prix: 21.99, frequence: "mois" },
  ] },
  "Disney+": { categorie: "streaming", offres: [
    { nom: "Standard avec pub", prix: 5.99, frequence: "mois" },
    { nom: "Standard", prix: 9.99, frequence: "mois" },
    { nom: "Premium", prix: 13.99, frequence: "mois" },
  ] },
  "Amazon Prime": { categorie: "streaming", offres: [
    { nom: "Prime au mois", prix: 6.99, frequence: "mois" },
    { nom: "Prime à l'année", prix: 69.9, frequence: "an" },
  ] },
  "YouTube Premium": { categorie: "streaming", offres: [
    { nom: "Premium Lite", prix: 7.99, frequence: "mois" },
    { nom: "Individuel", prix: 12.99, frequence: "mois" },
    { nom: "Famille", prix: 25.99, frequence: "mois" },
  ] },
  "Spotify": { categorie: "musique", offres: [
    { nom: "Étudiants", prix: 6.07, frequence: "mois", reservee: true },
    { nom: "Personnel", prix: 12.14, frequence: "mois" },
    { nom: "Duo", prix: 16.99, frequence: "mois" },
    { nom: "Famille", prix: 21.99, frequence: "mois" },
  ] },
  "Deezer": { categorie: "musique", offres: [
    { nom: "Premium", prix: 11.99, frequence: "mois" },
    { nom: "Duo", prix: 15.99, frequence: "mois" },
    { nom: "Famille", prix: 19.99, frequence: "mois" },
  ] },
  "Xbox Game Pass": { categorie: "jeux", offres: [
    { nom: "Essential", prix: 9.99, frequence: "mois" },
    { nom: "Premium", prix: 14.99, frequence: "mois" },
    { nom: "Ultimate", prix: 26.99, frequence: "mois" },
  ] },
  "PlayStation Plus": { categorie: "jeux", offres: [
    { nom: "Essential", prix: 8.99, frequence: "mois" },
    { nom: "Extra", prix: 13.99, frequence: "mois" },
    { nom: "Premium", prix: 16.99, frequence: "mois" },
  ] },
  "Nintendo Switch Online": { categorie: "jeux", offres: [
    { nom: "Individuel", prix: 19.99, frequence: "an" },
    { nom: "+ Pack additionnel", prix: 39.99, frequence: "an" },
  ] },
  "iCloud": { categorie: "logiciels", offres: [
    { nom: "50 Go", prix: 0.99, frequence: "mois" },
    { nom: "200 Go", prix: 2.99, frequence: "mois" },
    { nom: "2 To", prix: 9.99, frequence: "mois" },
  ] },
  "ChatGPT": { categorie: "logiciels", offres: [
    { nom: "Plus", prix: 23, frequence: "mois" },
    { nom: "Pro", prix: 229, frequence: "mois" },
  ] },
};

// Abonnements reconnus dans un nom ou dans un libellé de banque : [règle, nom, catégorie].
// L'ordre compte : la première ligne qui correspond gagne (Xbox avant Microsoft, etc.)
const MARCHANDS = [
  [/\bNETFLIX\b/, "Netflix", "streaming"],
  [/\bDISNEY ?(PLUS|\+)|\bDISNEYPLUS\b/, "Disney+", "streaming"],
  [/\bPRIME VIDEO\b|\bAMAZON PRIME\b|\bAMZN PRIME\b|\bPRIME MEMBER/, "Amazon Prime", "streaming"],
  [/\bYOUTUBE\b/, "YouTube Premium", "streaming"],
  [/\bCANAL ?(PLUS|\+)|\bMYCANAL\b|\bGROUPE CANAL\b/, "Canal+", "streaming"],
  [/\bPARAMOUNT\b/, "Paramount+", "streaming"],
  [/\bHBO\b|\bMAX COM\b/, "Max", "streaming"],
  [/\bCRUNCHYROLL\b/, "Crunchyroll", "streaming"],
  [/\bOCS\b/, "OCS", "streaming"],
  [/\bMOLOTOV\b/, "Molotov", "streaming"],
  [/\bDAZN\b/, "DAZN", "streaming"],
  [/\bTWITCH\b/, "Twitch", "streaming"],
  [/\bAPPLE ?TV\b/, "Apple TV+", "streaming"],
  [/\bSPOTIFY\b/, "Spotify", "musique"],
  [/\bDEEZER\b/, "Deezer", "musique"],
  [/\bAPPLE ?MUSIC\b/, "Apple Music", "musique"],
  [/\bTIDAL\b/, "Tidal", "musique"],
  [/\bQOBUZ\b/, "Qobuz", "musique"],
  [/\bXBOX\b|\bGAME ?PASS\b/, "Xbox Game Pass", "jeux"],
  [/\bPLAYSTATION\b|\bSONY INTERACTIVE\b|\bPSN\b/, "PlayStation Plus", "jeux"],
  [/\bNINTENDO\b/, "Nintendo Switch Online", "jeux"],
  [/\bEA PLAY\b/, "EA Play", "jeux"],
  [/\bUBISOFT\b/, "Ubisoft+", "jeux"],
  [/\bAPPLE COM\b|\bITUNES\b|\bAPPLE BILL\b/, "Apple (iCloud, App Store…)", "logiciels"],
  [/\bICLOUD\b/, "iCloud", "logiciels"],
  [/\bGOOGLE ONE\b|\bGOOGLE STORAGE\b/, "Google One", "logiciels"],
  [/\bMICROSOFT\b|\bMSFT\b|\bOFFICE 365\b/, "Microsoft 365", "logiciels"],
  [/\bADOBE\b/, "Adobe", "logiciels"],
  [/\bDROPBOX\b/, "Dropbox", "logiciels"],
  [/\bOPENAI\b|\bCHATGPT\b/, "ChatGPT", "logiciels"],
  [/\bANTHROPIC\b|\bCLAUDE AI\b/, "Claude", "logiciels"],
  [/\bNOTION\b/, "Notion", "logiciels"],
  [/\bCANVA\b/, "Canva", "logiciels"],
  [/\bNORD ?VPN\b/, "NordVPN", "logiciels"],
  [/\bDUOLINGO\b/, "Duolingo", "logiciels"],
  [/\bBASIC ?FIT\b/, "Basic-Fit", "sport"],
  [/\bFITNESS PARK\b/, "Fitness Park", "sport"],
  [/\bNEONESS\b/, "Neoness", "sport"],
  [/\bKEEP ?COOL\b/, "Keepcool", "sport"],
  [/\bL ?ORANGE BLEUE\b/, "L'Orange Bleue", "sport"],
  [/\bON AIR FITNESS\b/, "On Air", "sport"],
  [/\bSTRAVA\b/, "Strava", "sport"],
  [/\bSALLE DE SPORT\b/, "Salle de sport", "sport"],
  [/\bAUDIBLE\b/, "Audible", "presse"],
  [/\bKINDLE\b/, "Kindle Unlimited", "presse"],
  [/\bLE MONDE\b/, "Le Monde", "presse"],
  [/\bFIGARO\b/, "Le Figaro", "presse"],
  [/\bL ?EQUIPE\b/, "L'Équipe", "presse"],
  [/\bMEDIAPART\b/, "Mediapart", "presse"],
  [/\bLIBERATION\b/, "Libération", "presse"],
  [/\bLE PARISIEN\b/, "Le Parisien", "presse"],
  [/\bCAFEYN\b/, "Cafeyn", "presse"],
  [/\bFREE MOBILE\b/, "Free Mobile", "telecom"],
  [/\bFREE TELECOM\b|\bFREEBOX\b/, "Freebox", "telecom"],
  [/\bRED BY SFR\b/, "RED by SFR", "telecom"],
  [/\bSFR\b/, "SFR", "telecom"],
  [/\bSOSH\b/, "Sosh", "telecom"],
  [/\bORANGE\b/, "Orange", "telecom"],
  [/\bBOUYGUES\b|\bB YOU\b/, "Bouygues Telecom", "telecom"],
  [/\bLA POSTE MOBILE\b/, "La Poste Mobile", "telecom"],
  [/\bPRIXTEL\b/, "Prixtel", "telecom"],
  [/\bUBER ONE\b/, "Uber One", "autre"],
  [/\bDELIVEROO PLUS\b/, "Deliveroo Plus", "autre"],
  [/\bTINDER\b/, "Tinder", "autre"],
];

// Boutons d'ajout rapide
const SUGGESTIONS = [
  "Netflix", "Disney+", "Amazon Prime", "YouTube Premium", "Spotify", "Deezer",
  "Xbox Game Pass", "PlayStation Plus", "Nintendo Switch Online", "iCloud", "Salle de sport",
];

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const jourMois = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

// ---------- DONNÉES ----------
// La liste est gardée dans le navigateur (rien n'est envoyé sur Internet)

let abonnements = charger();
let idEnModification = null;

function charger() {
  let liste;
  try { liste = JSON.parse(localStorage.getItem("abonnements")) || []; } catch { liste = []; }
  liste.forEach(abo => {
    if (!USAGES[abo.usage]) abo.usage = ANCIENS_USAGES[abo.usage] || USAGE_PAR_DEFAUT;
  });
  return liste;
}

function sauvegarder() {
  try { localStorage.setItem("abonnements", JSON.stringify(abonnements)); } catch {}
}

function nouvelId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ---------- RECONNAÎTRE UN SERVICE ----------

// "Prélèvement NETFLIX.COM" → "PRELEVEMENT NETFLIX COM"
function normaliser(texte) {
  return String(texte).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase().replace(/[^A-Z0-9+]+/g, " ").trim();
}

// "netflix", "Netflix Premium", "PRLV NETFLIX.COM" → { nom: "Netflix", categorie, offres }
function reconnaitreService(texte) {
  const compact = t => normaliser(t).replace(/[^A-Z0-9]/g, "");
  const cherche = compact(texte);
  if (!cherche) return null;
  const exact = Object.keys(SERVICES).find(nom => compact(nom) === cherche);
  if (exact) return { nom: exact, ...SERVICES[exact] };
  const marchand = MARCHANDS.find(([regle]) => regle.test(normaliser(texte)));
  if (!marchand) return null;
  const [, nom, categorie] = marchand;
  return { nom, categorie, offres: SERVICES[nom]?.offres };
}

// Mots qui donnent la catégorie d'un service qu'on ne connaît pas ("Ma salle de yoga" → sport)
const MOTS_CATEGORIES = [
  [/\b(SALLE|SPORT|FITNESS|GYM|YOGA|PISCINE|CLUB|DANSE|BOXE|ESCALADE|TENNIS|FOOT)\b/, "sport"],
  [/\b(FORFAIT|MOBILE|BOX|INTERNET|FIBRE|TELEPHONE|ADSL|5G|4G|FREE)\b/, "telecom"],
  [/\b(JOURNAL|MAGAZINE|PRESSE|LIVRES?|LECTURE|BD|MANGA|PODCAST)\b/, "presse"],
  [/\b(JEUX?|GAME|GAMING|CONSOLE)\b/, "jeux"],
  [/\b(MUSIQUE|MUSIC|RADIO)\b/, "musique"],
  [/\b(TV|TELE|FILMS?|SERIES?|STREAMING|VIDEO|CINEMA|ANIME)\b/, "streaming"],
  [/\b(CLOUD|STOCKAGE|LOGICIEL|APPLI|APP|VPN|ANTIVIRUS|IA|AI)\b/, "logiciels"],
];

// La catégorie d'un abonnement, devinée avec son nom (null si on ne sait pas)
function devinerCategorie(nom) {
  const service = reconnaitreService(nom);
  if (service) return service.categorie;
  const texte = normaliser(nom);
  return MOTS_CATEGORIES.find(([regle]) => regle.test(texte))?.[1] ?? null;
}

// ---------- CALCULS ----------

function prixParMois(abo) {
  return abo.prix * FREQUENCES[abo.frequence].parMois;
}

function aujourdhui() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Prochain paiement : si la date est passée, on avance d'une période jusqu'à aujourd'hui
function prochainPaiement(abo) {
  if (!abo.date) return null;
  const d = new Date(abo.date + "T00:00:00");
  const today = aujourdhui();
  let securite = 0;
  while (d < today && securite++ < 1000) {
    if (abo.frequence === "semaine") d.setDate(d.getDate() + 7);
    else if (abo.frequence === "mois") d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
  }
  return d;
}

function joursAvant(date) {
  return Math.round((date - aujourdhui()) / 86400000);
}

function texteJours(jours) {
  if (jours === 0) return "aujourd'hui";
  if (jours === 1) return "demain";
  return `dans ${jours} jours`;
}

// Combien on économise par mois, et comment :
// - "L'enlever" → tout le prix
// - "Le diminuer" → passer à l'offre la moins chère du service (Netflix…),
//   sinon au prix visé que la personne a écrit
// Renvoie null pour "Le garder".
function conseil(abo) {
  if (abo.usage === "enlever") return { type: "enlever", economie: prixParMois(abo) };
  if (abo.usage !== "diminuer") return null;

  const offres = reconnaitreService(abo.nom)?.offres?.filter(o => !o.reservee);
  if (offres?.length) {
    const moinsChere = offres.reduce((a, b) => prixParMois(b) < prixParMois(a) ? b : a);
    const economie = prixParMois(abo) - prixParMois(moinsChere);
    if (economie >= 0.5) return { type: "offre", offre: moinsChere, economie };
  }
  if (abo.prixVise > 0 && abo.prixVise < abo.prix) {
    return { type: "prixVise", economie: (abo.prix - abo.prixVise) * FREQUENCES[abo.frequence].parMois };
  }
  // On ne sait pas encore de combien : déjà l'offre la moins chère, ou pas de prix visé
  return { type: offres?.length ? "dejaMoinsChere" : "sansPrix", economie: 0 };
}

function aRevoir(abo) {
  return abo.usage !== "garder";
}

// Les abonnements résiliés ne comptent plus dans les totaux : on les garde à part
function actifs() {
  return abonnements.filter(abo => !abo.resilie);
}

function resilies() {
  return abonnements.filter(abo => abo.resilie);
}

// ---------- AFFICHAGE ----------

const el = id => document.getElementById(id);

function afficher() {
  afficherResume();
  afficherListe();
  afficherCategories();
}

function afficherResume() {
  const totalMois = actifs().reduce((total, abo) => total + prixParMois(abo), 0);
  const conseils = actifs().map(abo => ({ abo, ...conseil(abo) })).filter(c => c.type);
  const parAn = liste => liste.reduce((total, c) => total + c.economie * 12, 0);
  const aEnlever = conseils.filter(c => c.type === "enlever");
  const aDiminuer = conseils.filter(c => c.type !== "enlever");
  const economies = parAn(conseils);

  el("totalMois").textContent = euros.format(totalMois);
  el("totalAn").textContent = euros.format(totalMois * 12);
  el("nombre").textContent = actifs().length;
  el("economies").textContent = euros.format(economies);

  // Ce qui est déjà économisé grâce aux résiliations
  const finis = resilies();
  el("carteEconomise").hidden = finis.length === 0;
  el("economise").textContent = euros.format(finis.reduce((total, abo) => total + prixParMois(abo) * 12, 0));
  el("economiseDetail").textContent = `par an · ${finis.length} abonnement${finis.length > 1 ? "s" : ""} résilié${finis.length > 1 ? "s" : ""}`;

  // Sous le chiffre : d'où viennent les économies
  const morceaux = [];
  if (aEnlever.length) morceaux.push(`${euros.format(parAn(aEnlever))} en enlevant`);
  if (parAn(aDiminuer) > 0) morceaux.push(`${euros.format(parAn(aDiminuer))} en diminuant`);
  el("economiesDetail").textContent = morceaux.length ? `par an · ${morceaux.join(" + ")}` : "par an";

  // Conseils, un par ligne
  const phrases = [];
  if (aEnlever.length) {
    phrases.push(`En enlevant ${aEnlever.map(c => c.abo.nom).join(", ")}, tu économiserais ${euros.format(parAn(aEnlever))} par an.`);
  }
  aDiminuer.forEach(c => {
    const nom = c.abo.nom + (c.abo.offre ? ` (${c.abo.offre})` : "");
    if (c.type === "offre") {
      phrases.push(`Pour garder ${nom} en payant moins, passe à l'offre ${c.offre.nom} à ` +
        `${euros.format(c.offre.prix)} ${FREQUENCES[c.offre.frequence].label} : ${euros.format(c.economie * 12)} de moins par an.`);
    } else if (c.type === "prixVise") {
      phrases.push(`En passant ${nom} à ${euros.format(c.abo.prixVise)} ${FREQUENCES[c.abo.frequence].label}, ` +
        `tu économiserais ${euros.format(c.economie * 12)} par an.`);
    } else if (c.type === "dejaMoinsChere") {
      phrases.push(`${nom} est déjà à l'offre la moins chère : pour payer moins, il faudrait l'enlever.`);
    } else {
      phrases.push(`Pour ${nom}, écris le prix que tu vises (bouton ✏️) pour calculer ce que tu économiserais.`);
    }
  });
  el("alerte").hidden = phrases.length === 0;
  el("alerteTexte").textContent = phrases.join("\n");
}

function trier(liste) {
  const tri = el("tri").value;
  const copie = [...liste];
  if (tri === "prix") copie.sort((a, b) => prixParMois(b) - prixParMois(a));
  if (tri === "nom") copie.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  if (tri === "usage") copie.sort((a, b) => USAGES[a.usage].ordre - USAGES[b.usage].ordre);
  if (tri === "date") {
    const temps = abo => prochainPaiement(abo)?.getTime() ?? Infinity;
    copie.sort((a, b) => temps(a) - temps(b));
  }
  return copie;
}

function afficherListe() {
  const liste = el("liste");
  liste.innerHTML = "";

  let visibles = actifs();
  if (el("filtreARevoir").checked) visibles = visibles.filter(aRevoir);

  el("vide").hidden = visibles.length > 0;
  el("vide").querySelector("p:last-child").innerHTML = actifs().length
    ? "Aucun abonnement à revoir. Bravo ! 🎉"
    : "Aucun abonnement pour l'instant.<br>Ajoute ton premier avec le formulaire !";

  trier(visibles).forEach(abo => liste.append(creerLigne(abo)));

  // Les abonnements résiliés, en bas
  const finis = resilies().sort((a, b) => b.resilie.localeCompare(a.resilie));
  el("blocResilies").hidden = finis.length === 0;
  el("listeResilies").innerHTML = "";
  finis.forEach(abo => el("listeResilies").append(creerLigneResiliee(abo)));
}

// Copie le modèle de ligne et le remplit (avec textContent, pour la sécurité)
function creerLigne(abo) {
  const ligne = el("modeleLigne").content.firstElementChild.cloneNode(true);
  const categorie = CATEGORIES[abo.categorie];
  const usage = USAGES[abo.usage];

  const astuce = conseil(abo);
  ligne.classList.toggle("a-revoir", aRevoir(abo));

  const icone = ligne.querySelector(".abo-icone");
  icone.textContent = categorie.emoji;
  icone.style.background = categorie.color + "22";

  ligne.querySelector(".abo-nom").textContent = abo.nom;

  const details = ligne.querySelector(".abo-details");
  details.textContent = categorie.label + (abo.offre ? ` · ${abo.offre}` : "");
  const date = prochainPaiement(abo);
  if (date) {
    const jours = joursAvant(date);
    const quand = document.createElement("span");
    quand.textContent = ` · paiement ${texteJours(jours)} (${jourMois.format(date)})`;
    if (jours <= 3) quand.className = "bientot";
    details.append(quand);
  }
  if (astuce?.economie > 0) {
    const texte = document.createElement("span");
    texte.className = "astuce";
    const comment = { enlever: "En l'enlevant", offre: `En passant à ${astuce.offre?.nom}`, prixVise: `En passant à ${euros.format(abo.prixVise)}` }[astuce.type];
    texte.textContent = `💡 ${comment} : ${euros.format(astuce.economie * 12)} de moins par an`;
    details.append(texte);
  }

  const badge = ligne.querySelector(".badge");
  badge.textContent = usage.label;
  badge.style.setProperty("--couleur", usage.couleur);

  ligne.querySelector(".prix").textContent = `${euros.format(abo.prix)} ${FREQUENCES[abo.frequence].label}`;
  ligne.querySelector(".par-mois").textContent = abo.frequence === "mois"
    ? `${euros.format(abo.prix * 12)} / an`
    : `≈ ${euros.format(prixParMois(abo))} / mois`;

  ligne.querySelector(".modifier").addEventListener("click", () => commencerModification(abo));

  // "Résilier" : seulement pour ceux qu'on veut enlever (la fenêtre est dans resiliation.js)
  const resilier = ligne.querySelector(".resilier");
  resilier.hidden = abo.usage !== "enlever";
  resilier.addEventListener("click", () => ouvrirResiliation(abo));

  // Supprimer : il faut cliquer deux fois, pour éviter les accidents
  const supprimer = ligne.querySelector(".supprimer");
  supprimer.addEventListener("click", () => {
    if (supprimer.classList.contains("confirmer")) {
      abonnements = abonnements.filter(a => a.id !== abo.id);
      if (idEnModification === abo.id) annulerModification();
      sauvegarder();
      afficher();
    } else {
      supprimer.classList.add("confirmer");
      supprimer.textContent = "Sûr ?";
      setTimeout(() => {
        supprimer.classList.remove("confirmer");
        supprimer.textContent = "🗑️";
      }, 3000);
    }
  });

  return ligne;
}

// Ligne d'un abonnement résilié : grisée, avec ce qu'il fait économiser
function creerLigneResiliee(abo) {
  const ligne = document.createElement("li");
  ligne.className = "abo resilie";
  ligne.innerHTML = `
    <div class="abo-icone">✓</div>
    <div class="abo-info"><p class="abo-nom"></p><p class="abo-details"></p></div>
    <div class="abo-prix"><p class="prix"></p><p class="par-mois">économisés par an</p></div>
    <div class="abo-actions"><button class="petit-bouton" title="Je ne l'ai pas résilié finalement">Annuler</button></div>`;
  ligne.querySelector(".abo-nom").textContent = abo.nom;
  ligne.querySelector(".abo-details").textContent = `Résilié le ${jourMois.format(new Date(abo.resilie + "T00:00:00"))}`;
  ligne.querySelector(".prix").textContent = euros.format(prixParMois(abo) * 12);
  ligne.querySelector("button").addEventListener("click", () => {
    delete abo.resilie;
    sauvegarder();
    afficher();
  });
  return ligne;
}

function afficherCategories() {
  const totaux = {};
  actifs().forEach(abo => {
    totaux[abo.categorie] = (totaux[abo.categorie] || 0) + prixParMois(abo);
  });
  const lignes = Object.entries(totaux).sort((a, b) => b[1] - a[1]);
  const max = lignes.length ? lignes[0][1] : 0;

  const conteneur = el("categories");
  conteneur.innerHTML = "";
  if (!lignes.length) {
    conteneur.innerHTML = '<p class="rien">Rien pour l\'instant.</p>';
    return;
  }

  lignes.forEach(([cle, montant]) => {
    const cat = CATEGORIES[cle];
    const bloc = document.createElement("div");
    bloc.className = "categorie";
    bloc.innerHTML = `
      <div class="categorie-haut">
        <span>${cat.emoji} ${cat.label}</span>
        <span class="categorie-montant">${euros.format(montant)} / mois</span>
      </div>
      <div class="barre-fond"><div class="barre-remplie"></div></div>`;
    const barre = bloc.querySelector(".barre-remplie");
    barre.style.width = `${(montant / max) * 100}%`;
    barre.style.background = cat.color;
    conteneur.append(bloc);
  });
}

// ---------- FORMULAIRE ----------

const formulaire = el("formulaire");

let serviceAffiche = null;          // service reconnu dans le champ "Nom"

function remplirChoix() {
  // Boutons "Le garder / Le diminuer / L'enlever"
  Object.entries(USAGES).forEach(([cle, usage]) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="radio" name="usage" value="${cle}"><span>${usage.label}</span>`;
    label.querySelector("span").style.setProperty("--couleur", usage.couleur);
    el("usages").append(label);
  });

  // Ajout rapide
  SUGGESTIONS.forEach(nom => {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "suggestion";
    bouton.textContent = nom;
    bouton.addEventListener("click", () => {
      el("nom").value = nom;
      majService();
      (el("champOffre").hidden ? el("prix") : el("offre")).focus();
    });
    el("suggestions").append(bouton);
  });
}

// Quand le nom correspond à un service connu (Netflix…), on propose ses offres avec leur prix.
// garderPrix = ne pas toucher au prix déjà écrit.
function majService({ offre, garderPrix = false } = {}) {
  const service = reconnaitreService(el("nom").value);
  majPrixVise();

  const offres = service?.offres;
  el("champOffre").hidden = !offres;
  if (!offres) { serviceAffiche = null; return; }
  if (service.nom === serviceAffiche && !garderPrix && offre === undefined) return;
  serviceAffiche = service.nom;

  const menu = el("offre");
  menu.innerHTML = "";
  offres.forEach((o, i) => menu.add(new Option(`${o.nom} — ${euros.format(o.prix)} ${FREQUENCES[o.frequence].label}`, i)));
  menu.add(new Option("Autre prix", ""));

  if (garderPrix) {
    const i = offres.findIndex(o => o.nom === offre);
    menu.value = i >= 0 ? i : "";
  } else {
    menu.value = Math.min(1, offres.length - 1);     // l'offre "du milieu" par défaut
    appliquerOffre();
  }
}

// "Le diminuer" sur un service dont on ne connaît pas les offres : on demande le prix visé
function majPrixVise() {
  const offres = reconnaitreService(el("nom").value)?.offres;
  el("champPrixVise").hidden = formulaire.usage.value !== "diminuer" || Boolean(offres);
}

function appliquerOffre() {
  const o = serviceAffiche && el("offre").value !== "" ? SERVICES[serviceAffiche].offres[el("offre").value] : null;
  if (!o) return;
  el("prix").value = o.prix;
  el("frequence").value = o.frequence;
}

function offreChoisie() {
  if (el("champOffre").hidden || el("offre").value === "") return undefined;
  return SERVICES[serviceAffiche].offres[el("offre").value].nom;
}

function viderFormulaire() {
  formulaire.reset();
  el("date").value = aujourdhui().toLocaleDateString("sv");   // format AAAA-MM-JJ
  formulaire.usage.value = USAGE_PAR_DEFAUT;
  serviceAffiche = null;
  majService();
}

function commencerModification(abo) {
  idEnModification = abo.id;
  el("nom").value = abo.nom;
  el("prix").value = abo.prix;
  el("frequence").value = abo.frequence;
  el("date").value = abo.date || "";
  formulaire.usage.value = abo.usage;
  el("prixVise").value = abo.prixVise || "";
  majService({ offre: abo.offre, garderPrix: true });
  el("titreFormulaire").textContent = `Modifier « ${abo.nom} »`;
  el("boutonValider").textContent = "Enregistrer";
  el("boutonAnnuler").hidden = false;
  el("carteFormulaire").scrollIntoView({ behavior: "smooth", block: "start" });
  el("nom").focus({ preventScroll: true });
}

function annulerModification() {
  idEnModification = null;
  viderFormulaire();
  el("titreFormulaire").textContent = "Ajouter un abonnement";
  el("boutonValider").textContent = "Ajouter";
  el("boutonAnnuler").hidden = true;
}

formulaire.addEventListener("submit", e => {
  e.preventDefault();
  const donnees = {
    nom: el("nom").value.trim(),
    prix: Number(el("prix").value),
    frequence: el("frequence").value,
    date: el("date").value,
    usage: formulaire.usage.value,
    offre: offreChoisie(),
    prixVise: !el("champPrixVise").hidden && Number(el("prixVise").value) > 0 ? Number(el("prixVise").value) : undefined,
  };
  if (!donnees.nom || !(donnees.prix > 0)) return;

  // Catégorie devinée avec le nom. Si on ne sait pas, on garde l'ancienne (modification) ou "Autre"
  const ancien = abonnements.find(a => a.id === idEnModification);
  donnees.categorie = devinerCategorie(donnees.nom) ?? ancien?.categorie ?? "autre";

  if (idEnModification) {
    const abo = abonnements.find(a => a.id === idEnModification);
    Object.assign(abo, donnees);
    annulerModification();
  } else {
    abonnements.push({ id: nouvelId(), ...donnees });
    viderFormulaire();
  }
  sauvegarder();
  afficher();
});

el("nom").addEventListener("input", () => majService());
el("offre").addEventListener("change", appliquerOffre);
el("usages").addEventListener("change", majPrixVise);
// Si on écrit un autre prix à la main, ce n'est plus l'offre affichée
el("prix").addEventListener("input", () => { if (!el("champOffre").hidden) el("offre").value = ""; });
el("boutonAnnuler").addEventListener("click", annulerModification);
el("tri").addEventListener("change", afficherListe);
el("filtreARevoir").addEventListener("change", afficherListe);

// ---------- DÉMARRAGE ----------
remplirChoix();
viderFormulaire();
afficher();
