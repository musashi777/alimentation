const fetch = require('node-fetch');

// Utilitaire de réponse standardisée
const send = (res, status, data) => res.status(status).json(data);

module.exports = async (req, res) => {
  // Sécurité : Méthode POST uniquement
  if (req.method !== 'POST') return send(res, 405, { error: 'Method Not Allowed' });

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, WHATSAPP_NUMBER } = process.env;
  const { cart, total, orderType, address, isDrive } = req.body;

  // Validation des entrées
  if (!cart || !total || !orderType) return send(res, 400, { error: 'Données de commande incomplètes' });

  try {
    // Étape 1 : Validation de l'intégrité financière (Sécurité anti-fraude)
    // On recalcule le total côté serveur. Complexité O(cart.length)
    const computedTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Tolérance de 0.01 pour les arrondis flottants
    if (Math.abs(computedTotal - parseFloat(total)) > 0.01) {
      return send(res, 400, { error: 'Incohérence de prix détectée' });
    }

    // Étape 2 : Construction du message WhatsApp (Structure Opérationnelle)
    const orderId = Math.random().toString(36).substr(2, 6).toUpperCase();
    let message = `📦 *COMMANDE #${orderId}* ${isDrive ? '🚗 [EN VOITURE]' : ''}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👤 *Client :* [Nom]\n`;
    message += `🕒 *Heure :* ${new Date().toLocaleTimeString('fr-FR', {hour: '2d', minute:'2d'})}\n`;
    message += `📍 *Type :* ${orderType === 'delivery' ? '🚚 LIVRAISON' : '🏃 RETRAIT (38 Goums)'}\n`;
    if (orderType === 'delivery') message += `🏠 *Adresse :* ${address}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    message += cart.map(item => 
      `✅ ${item.quantity}x ${item.name}`
    ).join('\n');

    message += `\n\n💰 *TOTAL À PAYER : ${computedTotal.toFixed(2)}€*`;
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `⚠️ _Paiement à la réception_`;

    // Étape 3 : Archivage Airtable (Optionnel mais sécurisé)
    let airtableRecordId = 'OFFLINE';
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Commandes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: [{
              fields: {
                Contenu: JSON.stringify(cart),
                Total: computedTotal,
                Type: orderType,
                Adresse: address || 'N/A',
                Date: new Date().toISOString()
              }
            }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        airtableRecordId = data.records[0].id;
      }
    }

    // Étape 4 : Génération de l'URL finale
    const finalMessage = message + `\n\n*Ref :* ${airtableRecordId}`;
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`;

    return send(res, 200, { whatsappUrl, reference: airtableRecordId });

  } catch (error) {
    console.error('API Order Error:', error);
    return send(res, 500, { error: 'Une erreur est survenue lors du traitement' });
  }
};
