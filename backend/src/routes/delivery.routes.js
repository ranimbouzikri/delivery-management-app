const express = require('express');
const Delivery = require('../models/Delivery');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Créer une livraison
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { client, chauffeur, address, deliveryDate, lat ,lon } = req.body;

    if (!client || !address || !deliveryDate || lat === undefined || lon === undefined) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const delivery = new Delivery({ client, chauffeur, address, deliveryDate,lat,lon });
    await delivery.save();

    res.status(201).json(delivery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Lister toutes les livraisons (admin, planificateur)
router.get('/', authMiddleware, roleMiddleware('admin', 'planificateur'), async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate('client', 'username email')
      .populate('chauffeur', 'username email');
    res.json(deliveries);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir une livraison par id (utilisateur concerné ou admin)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('client', 'username email')
      .populate('chauffeur', 'username email');

    if (!delivery) return res.status(404).json({ message: 'Livraison non trouvée' });

    // Vérifier droits d'accès: client, chauffeur concerné ou admin
    const userId = req.user.id;
    if (
      req.user.role !== 'admin' &&
      delivery.client._id.toString() !== userId &&
      (delivery.chauffeur && delivery.chauffeur._id.toString() !== userId)
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(delivery);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier une livraison (admin ou planificateur)
router.put('/:id', authMiddleware, roleMiddleware('admin', 'planificateur'), async (req, res) => {
  try {
    const updateData = req.body;
    const delivery = await Delivery.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!delivery) return res.status(404).json({ message: 'Livraison non trouvée' });

    res.json(delivery);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une livraison (admin uniquement)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Livraison non trouvée' });

    res.json({ message: 'Livraison supprimée' });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// Modifier le statut de la livraison
router.put('/:id/status', authMiddleware, roleMiddleware('admin', 'planificateur', 'chauffeur'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatus = ['à planifier', 'en cours', 'livrée', 'annulée'];

    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const delivery = await Delivery.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!delivery) return res.status(404).json({ message: 'Livraison non trouvée' });

    res.json(delivery);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Reporter un incident
router.put('/:id/incident', authMiddleware, roleMiddleware('admin', 'planificateur', 'chauffeur'), async (req, res) => {
  try {
    const { incident } = req.body;

    const delivery = await Delivery.findByIdAndUpdate(req.params.id, { incident }, { new: true });
    if (!delivery) return res.status(404).json({ message: 'Livraison non trouvée' });

    res.json(delivery);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter une preuve de livraison
router.put('/:id/proof', authMiddleware, roleMiddleware('admin', 'chauffeur'), async (req, res) => {
  try {
    const { signature, photoURL, qrCode } = req.body;

    const proof = { signature, photoURL, qrCode };
    const delivery = await Delivery.findByIdAndUpdate(req.params.id, { proof }, { new: true });

    if (!delivery) return res.status(404).json({ message: 'Livraison non trouvée' });

    res.json(delivery);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


module.exports = router;
