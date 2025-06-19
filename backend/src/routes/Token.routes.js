const express = require('express');
const jwt = require('jsonwebtoken');
const Token = require('../models/Token');
require('dotenv').config();

const router = express.Router();

// Route pour renouveler le access token
router.post('/token', async (req, res) => {
  const { refreshToken } = req.body;

  // Vérifier que le refreshToken est bien présent
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token manquant' });
  }

  // Vérifier que le refreshToken est bien en base
  const storedToken = await Token.findOne({ token: refreshToken });
  if (!storedToken) {
    return res.status(403).json({ message: 'Refresh token invalide' });
  }

  try {
    // Vérifier que le refresh token est valide (non expiré)
    const userData = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Créer un nouveau access token valable 15 minutes
    const newAccessToken = jwt.sign(
      { id: userData.id, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // 15 minutes
    );

    res.json({ accessToken: newAccessToken });

  } catch (error) {
    console.error(error);
    res.status(403).json({ message: 'Refresh token expiré ou invalide' });
  }
});

module.exports = router;
