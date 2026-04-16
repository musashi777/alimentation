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

    // Cache Vercel : 60s frais, 1h en arrière-plan (stale-while-revalidate)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=3600');

    const products = (data.records || []).filter(r => r.fields.Nom).map(record => {
      const f = record.fields;
      let img = f.Image || '/images/facade.jpg';
      
      // Si l'image est un ID Unsplash ou un chemin inconnu, on s'assure qu'elle pointe vers static/images
      // ou on utilise un fallback si le fichier n'est pas dans notre liste connue
      const knownImages = ['Briquet_Clipper.png', 'Mogu_Mogu_Fraise.png', 'Red_Bull_Original.png', 'pack-bleu.jpg', 'takis-blue-heat.png'];
      const fileName = img.split('/').pop();
      
      if (!img.startsWith('http') && !knownImages.includes(fileName) && fileName !== 'facade.jpg') {
        img = '/images/facade.jpg'; // Fallback de sécurité
      }

      return {
        id: record.id,
        name: f.Nom,
        price: f.Prix || 0,
        unite: f.Unite || 'unité',
        category: f.Categorie || 'Général',
        tag: f.Tag || '',
        description: f.Description || '',
        image: img
      };
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
