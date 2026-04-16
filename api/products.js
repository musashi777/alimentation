const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
  const TABLE_NAME = 'Produits';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('ERREUR : AIRTABLE_API_KEY ou AIRTABLE_BASE_ID non définis dans Vercel.');
    return res.status(500).json({ error: 'Configuration API manquante' });
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`;
    console.log(`Tentative d'accès à Airtable : ${url}`);
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Airtable a renvoyé une erreur (${response.status}) : ${errText}`);
      throw new Error(`Airtable API error: ${response.status}`);
    }

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
        let imageUrl = '/images/facade.jpg';

        if (imageField) {
          if (Array.isArray(imageField) && imageField[0] && imageField[0].url) {
            // C'est un attachement Airtable (URL temporaire)
            imageUrl = imageField[0].url;
          } else if (typeof imageField === 'string') {
            // C'est un nom de fichier local (ex: 'briquet.png')
            imageUrl = imageField.startsWith('/') ? imageField : `/images/${imageField}`;
          }
        }

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
