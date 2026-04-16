const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
  const TABLE_NAME = 'Produits';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Variables environnement manquantes (Vercel)' });
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}?sort%5B0%5D%5Bfield%5D=Categorie&sort%5B0%5D%5Bdirection%5D=asc`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
    if (!response.ok) throw new Error(`Airtable Error: ${response.status}`);
    
    const data = await response.json();

    const products = (data.records || []).filter(r => r.fields.Nom).map(record => {
      const f = record.fields;
      const photo = f.Photo || f.Image;
      
      // LOGIQUE O(1) : On construit le chemin local si une pièce jointe existe
      // L'utilisateur doit simplement uploader dans static/images avec le même nom
      let imageUrl = '/images/facade.jpg'; 
      if (Array.isArray(photo) && photo[0]) {
        imageUrl = `/images/${photo[0].filename}`;
      } else if (typeof photo === 'string') {
        imageUrl = photo.startsWith('http') ? photo : `/images/${photo}`;
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
