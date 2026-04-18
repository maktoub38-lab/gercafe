// ════════════════════════════════════════════════════════════
//  CONFIGURATION FIREBASE
//  ⚠️ REMPLACEZ LES VALEURS CI-DESSOUS PAR LES VÔTRES
// ════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyCW7p8-mXaAcMBkXTTEFKHbay_lzI8tL18",
  authDomain: "gercafe-hmfr.firebaseapp.com",
  databaseURL: "https://gercafe-hmfr-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gercafe-hmfr",
  storageBucket: "gercafe-hmfr.firebasestorage.app",
  messagingSenderId: "791896470488",
  appId: "1:791896470488:web:6442b5a16ffbefe7b1b8ad"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ════════════════════════════════════════════════════════════
//  VARIABLES GLOBALES
// ════════════════════════════════════════════════════════════
let numeroTable = 0;
let nbPersonnes = 1;
let produits = {};
let panier = {};
let commandeRef = null;
let ecouteurCommande = null;

// ════════════════════════════════════════════════════════════
//  DÉMARRAGE
// ════════════════════════════════════════════════════════════
window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  numeroTable = parseInt(urlParams.get('table')) || 0;

  if (numeroTable === 0) {
    document.getElementById('bienvenue-table').textContent =
      'Scannez le QR code de votre table';
    afficherEcran('ecran-accueil');
    return;
  }

  chargerProduits();
};

// ════════════════════════════════════════════════════════════
//  CHARGER LES PRODUITS DEPUIS FIREBASE
// ════════════════════════════════════════════════════════════
function chargerProduits() {
  db.ref('produits').once('value', (snapshot) => {
    produits = snapshot.val() || {};

    document.getElementById('bienvenue-table').textContent =
      `Table ${numeroTable} — Bienvenue !`;
    document.getElementById('info-table-commande').textContent =
      `Table ${numeroTable}`;
    document.getElementById('info-table-recap').textContent =
      `Table ${numeroTable}`;
    document.getElementById('table-affichee').textContent =
      `Table ${numeroTable}`;

    afficherEcran('ecran-accueil');
    construireMenu();
    construireListeCommande();
  });
}

// ════════════════════════════════════════════════════════════
//  CONSTRUIRE LE MENU (lecture seule)
// ════════════════════════════════════════════════════════════
function construireMenu() {
  const container = document.getElementById('liste-menu');
  container.innerHTML = '';

  const categories = {};
  Object.entries(produits).forEach(([id, produit]) => {
    const cat = produit.categorie || 'Autre';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ id, ...produit });
  });

  Object.entries(categories).forEach(([cat, items]) => {
    const titreEl = document.createElement('div');
    titreEl.className = 'categorie-titre';
    titreEl.textContent = cat;
    container.appendChild(titreEl);

    items.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'produit-item';
      el.innerHTML = `
        <span class="produit-icone">${item.icone || '☕'}</span>
        <div class="produit-info">
          <div class="produit-nom">${item.nom}</div>
          <div class="produit-prix">${item.prix.toFixed(2)} Dh</div>
        </div>
      `;
      container.appendChild(el);
    });
  });
}

// ════════════════════════════════════════════════════════════
//  CONSTRUIRE LA LISTE DE COMMANDE
// ════════════════════════════════════════════════════════════
function construireListeCommande() {
  const container = document.getElementById('liste-commande');
  container.innerHTML = '';
  panier = {};

  const categories = {};
  Object.entries(produits).forEach(([id, produit]) => {
    const cat = produit.categorie || 'Autre';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ id, ...produit });
  });

  Object.entries(categories).forEach(([cat, items]) => {
    const titreEl = document.createElement('div');
    titreEl.className = 'categorie-titre';
    titreEl.textContent = cat;
    container.appendChild(titreEl);

    items.forEach((item) => {
      panier[item.id] = 0;

      const el = document.createElement('div');
      el.className = 'produit-item';
      el.innerHTML = `
        <span class="produit-icone">${item.icone || '☕'}</span>
        <div class="produit-info">
          <div class="produit-nom">${item.nom}</div>
          <div class="produit-prix">${item.prix.toFixed(2)} Dh</div>
        </div>
        <div class="produit-compteur">
          <button class="btn-compteur" onclick="modifierQte('${item.id}', -1)">−</button>
          <span class="qte-affichage" id="qte-${item.id}">0</span>
          <button class="btn-compteur" onclick="modifierQte('${item.id}', 1)">+</button>
        </div>
      `;
      container.appendChild(el);
    });
  });
}

// ════════════════════════════════════════════════════════════
//  MODIFIER QUANTITÉ
// ════════════════════════════════════════════════════════════
function modifierQte(produitId, delta) {
  panier[produitId] = Math.max(0, (panier[produitId] || 0) + delta);
  document.getElementById(`qte-${produitId}`).textContent = panier[produitId];
  mettreAJourTotal();
}

function mettreAJourTotal() {
  let total = 0;
  Object.entries(panier).forEach(([id, qte]) => {
    if (qte > 0 && produits[id]) {
      total += produits[id].prix * qte;
    }
  });
  document.getElementById('total-commande').textContent = total.toFixed(2) + ' Dh';
  return total;
}

// ════════════════════════════════════════════════════════════
//  NOMBRE DE PERSONNES
// ════════════════════════════════════════════════════════════
function modifierPersonnes(delta) {
  nbPersonnes = Math.max(1, Math.min(20, nbPersonnes + delta));
  document.getElementById('nb-personnes').textContent = nbPersonnes;

  let icones = '';
  for (let i = 0; i < Math.min(nbPersonnes, 10); i++) {
    icones += '👤';
  }
  if (nbPersonnes > 10) icones += `+${nbPersonnes - 10}`;
  document.getElementById('icones-personnes').textContent = icones;
}

// ════════════════════════════════════════════════════════════
//  AFFICHER LE RÉCAPITULATIF
// ════════════════════════════════════════════════════════════
function afficherRecap() {
  const hasItems = Object.values(panier).some((qte) => qte > 0);
  if (!hasItems) {
    alert('Veuillez sélectionner au moins un produit');
    return;
  }

  const container = document.getElementById('liste-recap');
  container.innerHTML = '';
  let total = 0;

  Object.entries(panier).forEach(([id, qte]) => {
    if (qte > 0 && produits[id]) {
      const produit = produits[id];
      const sousTotal = produit.prix * qte;
      total += sousTotal;

      const el = document.createElement('div');
      el.className = 'recap-item';
      el.innerHTML = `
        <div>
          <div class="recap-nom">${produit.icone} ${produit.nom}</div>
          <div class="recap-detail">x${qte} × ${produit.prix.toFixed(2)} Dh</div>
        </div>
        <div class="recap-prix">${sousTotal.toFixed(2)} Dh</div>
      `;
      container.appendChild(el);
    }
  });

  document.getElementById('total-recap').textContent = total.toFixed(2) + ' Dh';
  afficherEcran('ecran-recap');
}

// ════════════════════════════════════════════════════════════
//  CONFIRMER LA COMMANDE → FIREBASE
// ════════════════════════════════════════════════════════════
function confirmerCommande() {
  commandeRef = Math.floor(100000 + Math.random() * 900000).toString();

  let total = 0;
  const produitsCommande = {};

  Object.entries(panier).forEach(([id, qte]) => {
    if (qte > 0 && produits[id]) {
      const produit = produits[id];
      total += produit.prix * qte;
      produitsCommande[id] = {
        nom: produit.nom,
        qte: qte,
        prix: produit.prix,
      };
    }
  });

  const maintenant = new Date();
  const heure = maintenant.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const date = maintenant.toLocaleDateString('fr-FR');

  const commande = {
    ref: commandeRef,
    table: numeroTable,
    nb_personnes: nbPersonnes,
    produits: produitsCommande,
    total: total,
    heure: heure,
    date: date,
    statut: 'en_attente',
    appel_serveur: false,
  };

  db.ref(`commandes/${commandeRef}`)
    .set(commande)
    .then(() => {
      return db.ref(`tables/${numeroTable}/statut`).set('en_attente');
    })
    .then(() => {
      document.getElementById('ref-affichee').textContent = commandeRef;
      afficherEcran('ecran-attente');
      ecouterStatutCommande();
    })
    .catch((error) => {
      alert('Erreur lors de la commande: ' + error.message);
    });
}

// ════════════════════════════════════════════════════════════
//  ÉCOUTER LE STATUT EN TEMPS RÉEL
// ════════════════════════════════════════════════════════════
function ecouterStatutCommande() {
  if (ecouteurCommande) {
    db.ref(`commandes/${commandeRef}/statut`).off('value', ecouteurCommande);
  }

  ecouteurCommande = db.ref(`commandes/${commandeRef}/statut`).on('value', (snapshot) => {
    const statut = snapshot.val();

    if (statut === 'servie') {
      db.ref(`tables/${numeroTable}/statut`).set('servie');
      afficherEcran('ecran-servie');
      afficherEcran('ecran-servie');
    } else if (statut === 'payee') {
      afficherEcran('ecran-merci');
      setTimeout(recommencer, 5000);
    }
  });
}

// ════════════════════════════════════════════════════════════
//  APPEL SERVEUR
// ════════════════════════════════════════════════════════════
function appelServeur() {
  db.ref(`tables/${numeroTable}`)
    .update({
      statut: 'appel_serveur',
      appel_serveur: true,
    })
    .then(() => {
      alert('✅ Le serveur a été appelé !');
    })
    .catch((error) => {
      alert('Erreur: ' + error.message);
    });
}

// ════════════════════════════════════════════════════════════
//  DEMANDER LE PAIEMENT
// ════════════════════════════════════════════════════════════
function demanderPaiement() {
  db.ref(`commandes/${commandeRef}`)
    .update({
      statut: 'demande_paiement',
      demande_paiement: true,
    })
    .then(() => {
      db.ref(`tables/${numeroTable}/statut`).set('demande_paiement');
      afficherEcran('ecran-paiement');
    });
}

// ════════════════════════════════════════════════════════════
//  NOUVELLE COMMANDE
// ════════════════════════════════════════════════════════════
function nouvelleCommande() {
  commandeRef = null;
  panier = {};
  nbPersonnes = 1;
  document.getElementById('nb-personnes').textContent = '1';
  document.getElementById('icones-personnes').textContent = '👤';
  construireListeCommande();
  mettreAJourTotal();
  afficherEcran('ecran-personnes');
}

// ════════════════════════════════════════════════════════════
//  RECOMMENCER (nouvelle session)
// ════════════════════════════════════════════════════════════
function recommencer() {
  commandeRef = null;
  panier = {};
  nbPersonnes = 1;
  document.getElementById('nb-personnes').textContent = '1';
  document.getElementById('icones-personnes').textContent = '👤';
  construireListeCommande();
  mettreAJourTotal();
  afficherEcran('ecran-accueil');
}

// ════════════════════════════════════════════════════════════
//  NAVIGATION ENTRE ÉCRANS
// ════════════════════════════════════════════════════════════
function afficherEcran(idEcran) {
  document.querySelectorAll('.ecran').forEach((ecran) => {
    ecran.classList.remove('actif');
  });

  const ecranCible = document.getElementById(idEcran);
  if (ecranCible) {
    ecranCible.classList.add('actif');
  }
}
