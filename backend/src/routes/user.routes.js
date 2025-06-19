const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Token = require('../models/Token');

const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
require('dotenv').config();

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, phoneNumber, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, phoneNumber, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ message: 'Compte créé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Nom d’utilisateur et mot de passe requis' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Mot de passe invalide' });

    
    // Générer l'access token (15min)
    const accessToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Générer le refresh token (7j)
    const refreshToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Sauvegarder le refresh token en base
    const newToken = new Token({
      userId: user._id,
      token: refreshToken
    });
    await newToken.save();

    // Répondre avec les 2 tokens
    res.status(200).json({
      accessToken,
      refreshToken
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer profil (protégé)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier profil (protégé)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { username, email, phoneNumber } = req.body;
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Désactiver compte (admin uniquement)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json({ message: 'Compte désactivé' });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
