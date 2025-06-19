const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
  chauffeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' }], // liste ordonnée des livraisons
  date: { type: Date, required: true }, // jour de la tournée
  status: { type: String, enum: ['planifiée', 'en cours', 'terminée'], default: 'planifiée' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Route', RouteSchema);
