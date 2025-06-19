const express = require('express');
const Route = require('../models/Route');
const User = require('../models/User'); 
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const { validateRoute } = require('../middlewares/validation');

const router = express.Router();






// Calcul de la distance entre deux points GPS (formule de Haversine)
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371; // rayon Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

















// Fonction de calcul fictive (à améliorer)
function optimizeRoute(deliveries, startPoint) {
  if (deliveries.length === 0) return [];

  const ordered = [];
  const visited = new Set();

  let current = { lat: startPoint.lat, lon: startPoint.lon };
  
  while (ordered.length < deliveries.length) {
    let nearest = null;
    let minDist = Infinity;

    for (const d of deliveries) {
      if (!visited.has(d._id.toString())) {
        const dist = distance(current.lat, current.lon, d.lat, d.lon);
        if (dist < minDist) {
          minDist = dist;
          nearest = d;
        }
      }
    }

    ordered.push(nearest);
    visited.add(nearest._id.toString());
    current = nearest;
  }

  return ordered;
}


// Optimiser la tournée
router.put('/:id/optimize', authMiddleware, roleMiddleware('admin', 'planificateur'), async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate('deliveries');
    if (!route) return res.status(404).json({ message: 'Tournée non trouvée' });
    
    const chauffeur = await User.findById(route.chauffeur);
    if (!chauffeur) return res.status(404).json({ message: 'Chauffeur non trouvé' });

    const startPoint = { lat: chauffeur.lat, lon: chauffeur.lon };

    const optimizedDeliveries = optimizeRoute(route.deliveries,startPoint);
    route.deliveries = optimizedDeliveries.map(d => d._id);
    await route.save();

    res.json({ message: 'Tournée optimisée avec succès', route });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une tournée
router.post('/', authMiddleware, roleMiddleware('admin', 'planificateur'), validateRoute, async (req, res) => {
  try {
    const { chauffeur, deliveries, date } = req.body;
    if (!chauffeur || !deliveries || !date) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const route = new Route({ chauffeur, deliveries, date });
    await route.save();

    console.log(`Notification : Nouvelle tournée planifiée pour le chauffeur ${chauffeur} le ${date}`);

    res.status(201).json(route);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Lister les tournées
router.get('/', authMiddleware, roleMiddleware('admin', 'planificateur'), async (req, res) => {
  try {
    const routes = await Route.find()
      .populate('chauffeur', 'username email')
      .populate({
        path: 'deliveries',
        populate: [
          { path: 'client', select: 'username email' },
          { path: 'chauffeur', select: 'username email' }
        ]
      });

    res.json(routes);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer une tournée
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('chauffeur', 'username email')
      .populate({
        path: 'deliveries',
        populate: [
          { path: 'client', select: 'username email' },
          { path: 'chauffeur', select: 'username email' }
        ]
      });

    if (!route) return res.status(404).json({ message: 'Tournée non trouvée' });

    const userId = req.user.id;
    if (req.user.role !== 'admin' && req.user.role !== 'planificateur' && route.chauffeur._id.toString() !== userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(route);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier une tournée
router.put('/:id', authMiddleware, roleMiddleware('admin', 'planificateur'), validateRoute, async (req, res) => {
  try {
    const updateData = req.body;
    const route = await Route.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!route) return res.status(404).json({ message: 'Tournée non trouvée' });

    console.log(`Notification : Tournée ${route._id} mise à jour.`);

    res.json(route);
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une tournée
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ message: 'Tournée non trouvée' });

    console.log(`Notification : Tournée ${route._id} supprimée.`);

    res.json({ message: 'Tournée supprimée' });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
