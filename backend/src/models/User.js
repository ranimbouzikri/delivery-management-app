const mongoose = require('mongoose');




const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  phoneNumber: { 
    type: String, 
    required: false, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'planificateur', 'chauffeur', 'client'], 
    default: 'client' 
  },
   lat: { // latitude GPS (optionnel, uniquement pour chauffeurs)
    type: Number,
    required: function() { return this.role === 'chauffeur'; }
  },
  lon: { // longitude GPS (optionnel, uniquement pour chauffeurs)
    type: Number,
    required: function() { return this.role === 'chauffeur'; }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', UserSchema);
