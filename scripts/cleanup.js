const fetch = require('node-fetch');
require('dotenv').config();

const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
const TABLE_NAME = 'Produits';

async function cleanup() {
    console.log("🧹 Début du nettoyage de la base Airtable...");
    
    try {
        // 1. Récupérer tous les enregistrements
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`, {
            headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        });
        const data = await response.json();
        const records = data.records || [];

        if (records.length === 0) {
            console.log("✅ La base est déjà vide.");
            return;
        }

        console.log(`🗑 Suppression de ${records.length} enregistrements...`);

        // 2. Supprimer par paquets de 10
        for (let i = 0; i < records.length; i += 10) {
            const batch = records.slice(i, i + 10).map(r => r.id);
            const query = batch.map(id => `records[]=${id}`).join('&');
            
            await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}?${query}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
            });
            console.log(`  - ${batch.length} supprimés...`);
        }

        console.log("\n✨ Base nettoyée avec succès !");
    } catch (e) {
        console.error("❌ Erreur :", e.message);
    }
}

cleanup();
