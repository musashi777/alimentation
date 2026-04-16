module.exports = async (req, res) => {
  const config = {
    whatsappNumber: process.env.WHATSAPP_NUMBER || "33600000000",
    storeHours: {
      weekday: { open: 10, close: 22 },
      weekend: { open: 10, close: 2 } // Samedi et Dimanche (Heure de fermeture décalée)
    },
    location: "38 Avenue des Goums, 13400 Aubagne",
    operationalModes: {
        nightMode: { start: 20, end: 5, banner: "🚀 MODE NUIT : Livraison Express Active sur Aubagne ⚡" }
    }
  };
  res.status(200).json(config);
};
