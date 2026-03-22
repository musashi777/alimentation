const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
  const TABLE_NAME = 'Produits';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Configuration API manquante' });
  }

  try {
    // On ne récupère que les produits cochés "Actif"
    const filter = encodeURIComponent('({Actif} = 1)');
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}?filterByFormula=${filter}`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    const data = await response.json();
    
    // Transformation des données pour le front-end
    const products = data.records.map(record => ({
      id: record.id,
      name: record.fields.Nom,
      price: record.fields.Prix,
      unite: record.fields.Unite,
      category: record.fields.Categorie,
      tag: record.fields.Tag,
      description: record.fields.Description,
      image: record.fields.Image ? record.fields.Image[0].url : '/images/facade.jpg'
    }));

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
