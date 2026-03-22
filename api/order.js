/**
 * =============================================================================
 * API SERVERLESS - ORDER.JS
 * =============================================================================
 * Cette fonction serverless Vercel gère la création des commandes.
 * Elle effectue deux actions principales :
 * 1. Enregistre la commande dans Airtable (table 'Commandes')
 * 2. Génère l'URL WhatsApp avec le message formaté
 * 
 * La commande est ensuite finalisée par le client via WhatsApp.
 * =============================================================================
 */

// Import de node-fetch pour faire des requêtes HTTP
const fetch = require('node-fetch');

/**
 * Handler principal de la fonction serverless
 * @param {Object} req - Requête HTTP entrante
 * @param {Object} res - Réponse HTTP à retourner
 */
module.exports = async (req, res) => {
  
  // ===========================================================================
  // VÉRIFICATION DE LA MÉTHODE HTTP
  // Cette API n'accepte que les requêtes POST
  // ===========================================================================
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  // ===========================================================================
  // RÉCUPÉRATION DES VARIABLES D'ENVIRONNEMENT
  // ===========================================================================
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;    // Clé API Airtable
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;    // ID de la base
  const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER;      // Numéro WhatsApp (format: 33612345678)
  const AIRTABLE_TABLE_NAME = 'Commandes';                  // Nom de la table

  // ===========================================================================
  // RÉCUPÉRATION DES DONNÉES DE LA REQUÊTE
  // ===========================================================================
  const { cart, total } = req.body;

  // Validation des données
  if (!cart || !total) {
    return res.status(400).json({ error: 'Données de commande manquantes (cart, total).' });
  }

  // ===========================================================================
  // TRAITEMENT DE LA COMMANDE
  // ===========================================================================
  try {
    let airtableRecordId = null;  // Pour stocker l'ID de la commande créée

    // =========================================================================
    // ÉTAPE 1 : ENREGISTREMENT DANS AIRTABLE (optionnel mais recommandé)
    // Cela permet de garder un historique des commandes
    // =========================================================================
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: [
              {
                fields: {
                  // Contenu du panier au format JSON
                  Contenu: JSON.stringify(cart),
                  // Montant total converti en nombre
                  Total: parseFloat(total),
                  // Statut initial
                  Statut: 'En attente',
                  // Date et heure de la commande (format ISO)
                  Date: new Date().toISOString(),
                },
              },
            ],
          }),
        }
      );

      // Si l'enregistrement réussit, on récupère l'ID
      if (response.ok) {
        const data = await response.json();
        airtableRecordId = data.records[0].id;
        console.log('Commande enregistrée dans Airtable:', airtableRecordId);
      } else {
        console.warn('Échec de l\'enregistrement Airtable, mais on continue vers WhatsApp');
      }
    }

    // =========================================================================
    // ÉTAPE 2 : GÉNÉRATION DU MESSAGE WHATSAPP
    // Construction du message avec le récapitulatif de la commande
    // =========================================================================
    let message = "Bonjour, je souhaite passer une commande :\n\n";
    
    // Ajout de chaque article au message
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      message += `- ${item.name} x${item.quantity} : ${itemTotal}€\n`;
    });
    
    // Ajout du total
    message += `\nTotal : ${total}€`;
    
    // Ajout de la référence si la commande a été enregistrée dans Airtable
    if (airtableRecordId) {
      message += `\nRéférence : ${airtableRecordId}`;
    }

    // =========================================================================
    // ÉTAPE 3 : CONSTRUCTION DE L'URL WHATSAPP
    // Format : https://wa.me/<numero>?text=<message_encode>
    // =========================================================================
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    // =========================================================================
    // RÉPONSE AU CLIENT
    // Retourne l'URL WhatsApp pour redirection côté client
    // =========================================================================
    res.status(200).json({ 
      whatsappUrl: whatsappUrl,
      reference: airtableRecordId  // Optionnel : pour affichage côté client
    });
    
  } catch (error) {
    // Gestion des erreurs
    console.error('Erreur API order:', error);
    res.status(500).json({ error: error.message });
  }
};
