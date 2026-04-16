const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
  const TABLE_NAME = 'Produits';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Configuration API manquante' });
  }

  try {
    // Tentative de récupération avec filtre, sinon sans filtre
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    const data = await response.json();

    if (!data.records || data.records.length === 0) {
      console.error('Aucun enregistrement trouvé dans Airtable');
      return res.status(200).json([]);
    }
    
    const products = data.records
      .filter(record => record.fields.Nom) // On ignore les lignes vides
      .map(record => {
        const f = record.fields;
        // Détection flexible de l'image (Photo ou Image)
        const imageField = f.Photo || f.Image;
        const imageUrl = (imageField && imageField[0]) ? imageField[0].url : '/images/facade.jpg';

        return {
          id: record.id,
          name: f.Nom,
          price: f.Prix || 0,
          unite: f.Unite || 'unité',
          category: f.Categorie || 'Général',
          tag: f.Tag || '',
          description: f.Description || '',
          image: imageUrl
        };
      });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
