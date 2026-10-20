// Aide pour résilier : le lien vers la bonne page, les étapes, et une lettre toute prête.
// Le site ne peut pas résilier à la place de la personne : il faut être connecté à son compte.

// ---------- RÉGLAGES ----------

// Pages vérifiées sur l'aide officielle en octobre 2026 (Netflix, Spotify, YouTube, PlayStation, Apple,
// Google Play, ChatGPT). Pour Disney+, Amazon, Deezer et Nintendo, c'est la page du compte, d'après
// des guides : à vérifier. Elles changent parfois : corrige-les ici si besoin.
// lien = page où l'on résilie (ou page d'aide officielle si texteLien le dit)
const APPLE = {
  lien: "https://support.apple.com/fr-fr/HT202039",
  texteLien: "Voir l'aide Apple",
  etapes: [
    "Sur iPhone ou iPad : Réglages → touche ton nom → Abonnements.",
    "Choisis l'abonnement, puis « Annuler l'abonnement ».",
  ],
  note: "Pas de bouton « Annuler » ? L'abonnement est sans doute déjà résilié.",
};

const MICROSOFT = {
  lien: "https://account.microsoft.com/services",
  etapes: [
    "Connecte-toi avec ton compte Microsoft (celui de ta Xbox pour le Game Pass).",
    "Clique sur « Gérer » à côté de l'abonnement, puis « Annuler l'abonnement ».",
    "Refuse les offres pour rester, puis confirme.",
  ],
};

const RESILIATIONS = {
  "Netflix": {
    lien: "https://www.netflix.com/cancelplan",
    etapes: ["Connecte-toi à ton compte Netflix.", "Clique sur « Terminer l'annulation »."],
    note: "Tu gardes Netflix jusqu'à la fin de la période déjà payée. Supprimer l'appli ne résilie pas.",
  },
  "Spotify": {
    lien: "https://www.spotify.com/account/subscription/manage/",
    etapes: ["Connecte-toi à ton compte Spotify.", "Clique sur « Annuler l'abonnement » et confirme."],
    note: "Premium reste actif jusqu'à la prochaine date de paiement, puis le compte repasse en gratuit. " +
      "Dans un Duo ou un Famille, seul le gestionnaire peut résilier.",
  },
  "Disney+": {
    lien: "https://www.disneyplus.com/account",
    texteLien: "Ouvrir mon compte Disney+",
    etapes: ["Connecte-toi, puis ouvre « Compte » (ton profil, en haut à droite).", "Clique sur ton abonnement, puis « Annuler l'abonnement ».", "Confirme avec « Continuer la résiliation »."],
    note: "Abonnement pris avec Canal+ ou ta box : il se résilie chez eux.",
  },
  "Amazon Prime": {
    lien: "https://www.amazon.fr/gp/primecentral",
    texteLien: "Ouvrir mon abonnement Prime",
    etapes: ["Connecte-toi à ton compte Amazon.", "Clique sur « Mettre à jour, annuler et plus », puis « Mettre fin à l'abonnement et aux avantages »."],
    note: "Ton compte Amazon reste ouvert, tu peux toujours commander. Prime inclus dans ta Freebox : il se gère chez Free.",
  },
  "YouTube Premium": {
    lien: "https://www.youtube.com/paid_memberships",
    etapes: ["Clique sur ton abonnement.", "« Continuer pour annuler », choisis une raison et confirme."],
    note: "Tu peux aussi le mettre en pause. Annuler un abonnement Famille le coupe pour toute la famille.",
  },
  "Deezer": {
    lien: "https://www.deezer.com/",
    texteLien: "Ouvrir Deezer",
    etapes: ["Connecte-toi, puis ouvre « Paramètres du compte » (roue dentée).", "« Gérer mon abonnement » → annule et confirme."],
    note: "Fais-le au moins 48 h avant le renouvellement. Abonnement pris avec Orange : il se résilie chez Orange.",
  },
  "Xbox Game Pass": MICROSOFT,
  "Microsoft 365": MICROSOFT,
  "PlayStation Plus": {
    lien: "https://www.playstation.com/fr-fr/support/subscriptions/cancel-playstation-plus/",
    texteLien: "Voir l'aide PlayStation",
    etapes: [
      "Sur playstation.com, connecte-toi à « Gestion du compte ».",
      "Ouvre « Abonnement » dans le menu de gauche.",
      "Clique sur « Annuler l'abonnement » à côté de PlayStation Plus.",
    ],
    note: "Sur PS5 : Paramètres → Utilisateurs et comptes → Compte → Paiements et abonnements → Abonnements.",
  },
  "Nintendo Switch Online": {
    lien: "https://accounts.nintendo.com/",
    texteLien: "Ouvrir mon compte Nintendo",
    etapes: ["Connecte-toi à ton compte Nintendo.", "Ouvre « Abonnements ».", "Désactive le renouvellement automatique."],
    note: "Au moins 48 h avant la fin. Pas de remboursement, mais tu gardes l'accès jusqu'à la fin de la période payée.",
  },
  "ChatGPT": {
    lien: "https://help.openai.com/fr-fr/articles/7232927",
    texteLien: "Voir l'aide ChatGPT",
    etapes: ["Sur chatgpt.com, ouvre les Paramètres.", "Dans la partie abonnement, clique sur « Annuler l'abonnement »."],
    note: "Au moins 24 h avant le prochain paiement. Payé depuis l'appli iPhone ou Android : résilie depuis le téléphone.",
  },
  "iCloud": APPLE,
  "Apple Music": APPLE,
  "Apple TV+": APPLE,
  "Apple (iCloud, App Store…)": APPLE,
};

// Téléphone et internet : on peut garder son numéro en changeant d'opérateur
const TELECOM = {
  etapes: [
    "Dans ton espace client, cherche « Résilier mon contrat » (ou « Mon offre » → « Résilier »).",
    "Pour garder ton numéro en changeant d'opérateur, appelle le 3179 depuis ton mobile : tu reçois ton code RIO, " +
      "et le nouvel opérateur résilie l'ancien pour toi.",
  ],
  note: "Vérifie s'il te reste une période d'engagement : elle peut coûter des frais.",
};

// Tous les autres : bouton en ligne si l'abonnement a été pris sur internet, sinon la lettre
const GENERIQUE = {
  etapes: [
    "Connecte-toi à ton espace client sur leur site ou leur appli.",
    "Cherche un bouton « Résilier mon contrat » : s'il a été souscrit en ligne, il doit être facile à trouver.",
    "Pas de bouton ? Envoie la lettre ci-dessous.",
  ],
};

// ---------- FENÊTRE ----------

let aboAResilier = null;
let lettreModifiee = false;                 // la personne a modifié la lettre à la main

function guideResiliation(abo) {
  const service = reconnaitreService(abo.nom);
  if (service && RESILIATIONS[service.nom]) return RESILIATIONS[service.nom];
  if (abo.categorie === "telecom") return TELECOM;
  return GENERIQUE;
}

function ouvrirResiliation(abo) {
  aboAResilier = abo;
  lettreModifiee = false;
  const guide = guideResiliation(abo);

  el("resTitre").textContent = `Résilier ${abo.nom}`;

  el("resLien").hidden = !guide.lien;
  if (guide.lien) {
    el("resLien").href = guide.lien;
    el("resLien").textContent = (guide.texteLien || "Ouvrir la page de résiliation") + " ↗";
  }
  el("resEtapes").innerHTML = "";
  guide.etapes.forEach(etape => {
    const li = document.createElement("li");
    li.textContent = etape;
    el("resEtapes").append(li);
  });
  el("resNote").textContent = guide.note || "";
  el("resNote").hidden = !guide.note;

  // La lettre est ouverte d'office quand il n'y a pas de page officielle
  el("resLettre").open = !guide.lien;
  const identite = lireIdentite();
  el("resIdentite").value = identite.nom || "";
  el("resAdresse").value = identite.adresse || "";
  el("resNumero").value = "";
  majLettre();

  el("fenetreResiliation").showModal();
}

function fermerResiliation() {
  el("fenetreResiliation").close();
  aboAResilier = null;
}

// ---------- LETTRE ----------

// Nom et adresse gardés dans le navigateur pour la prochaine lettre
function lireIdentite() {
  try { return JSON.parse(localStorage.getItem("abonnements-identite")) || {}; } catch { return {}; }
}

function sauverIdentite() {
  try {
    localStorage.setItem("abonnements-identite", JSON.stringify({ nom: el("resIdentite").value, adresse: el("resAdresse").value }));
  } catch {}
}

function texteLettre() {
  const abo = aboAResilier;
  const nom = el("resIdentite").value.trim() || "[Prénom Nom]";
  const adresse = el("resAdresse").value.trim() || "[Adresse]";
  const numero = el("resNumero").value.trim();
  const aujourdhuiLong = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());

  return `${nom}
${adresse}
${numero ? `Référence client : ${numero}\n` : ""}
À l'attention du service clients de ${abo.nom}

Objet : résiliation de mon abonnement ${abo.nom}

Le ${aujourdhuiLong},

Madame, Monsieur,

Je vous informe de ma décision de résilier mon abonnement ${abo.nom}${numero ? ` (référence ${numero})` : ""}.

Je vous remercie de prendre en compte cette résiliation à la première échéance possible, de cesser tout prélèvement à partir de cette date et de m'envoyer une confirmation écrite de la résiliation.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

${nom}`;
}

function majLettre() {
  if (!lettreModifiee) el("resTexte").value = texteLettre();
  const abo = aboAResilier;
  el("resEmail").href = `mailto:?subject=${encodeURIComponent(`Résiliation de mon abonnement ${abo.nom}`)}` +
    `&body=${encodeURIComponent(el("resTexte").value)}`;
}

["resIdentite", "resAdresse", "resNumero"].forEach(id => el(id).addEventListener("input", () => {
  sauverIdentite();
  majLettre();
}));
el("resTexte").addEventListener("input", () => {
  lettreModifiee = true;
  majLettre();
});

el("resCopier").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(el("resTexte").value);
  } catch {
    el("resTexte").select();
    document.execCommand("copy");
  }
  el("resCopier").textContent = "Copiée ✓";
  setTimeout(() => el("resCopier").textContent = "Copier", 2000);
});

// Imprimer : on ouvre la lettre seule dans une nouvelle fenêtre
el("resImprimer").addEventListener("click", () => {
  const fenetre = window.open("", "_blank");
  if (!fenetre) return;
  const pre = fenetre.document.createElement("pre");
  pre.textContent = el("resTexte").value;
  pre.style.cssText = "font: 12pt/1.6 Georgia, serif; white-space: pre-wrap; margin: 2.5cm;";
  fenetre.document.title = el("resTitre").textContent;
  fenetre.document.body.append(pre);
  fenetre.print();
});

// ---------- BOUTONS DE LA FENÊTRE ----------

el("resFait").addEventListener("click", () => {
  aboAResilier.resilie = aujourdhui().toLocaleDateString("sv");     // format AAAA-MM-JJ
  sauvegarder();
  afficher();
  fermerResiliation();
});
el("resPlusTard").addEventListener("click", fermerResiliation);
el("resFermer").addEventListener("click", fermerResiliation);
el("fenetreResiliation").addEventListener("close", () => aboAResilier = null);   // touche Échap
