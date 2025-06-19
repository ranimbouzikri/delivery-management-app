const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const tokenRoutes = require('./routes/Token.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const routeRoutes = require('./routes/route.routes');


const app = express();

// connexion DB
connectDB();

// middlewares
app.use(express.json());
app.use('/api/deliveries', deliveryRoutes);


// routes
// Routes utilisateurs

const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/routes', routeRoutes);





app.get("/", (req, res) => {
  res.status(200).send("<h1>Welcome  </h1>");
});

module.exports = app;
