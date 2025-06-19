const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chauffeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // peut être assigné plus tard
  address: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['à planifier', 'en cours', 'livrée', 'annulée'],
    default: 'à planifier',
  lat: { type: Number, required: true },   // latitude
  lon: { type: Number, required: true },   // longitude
  },
  incident: { type: String, default: '' },

  proof: {
    signature: { type: String }, // URL ou base64
    photo: { type: String },     // URL ou base64
    comments: { type: String },
  },
  createdAt: { type: Date, default: Date.now },


proof: {
  signature: { type: String },
  photoURL: { type: String },
  qrCode: { type: String }
}

});

module.exports = mongoose.model('Delivery', DeliverySchema);
