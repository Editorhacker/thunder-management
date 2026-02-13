const express = require('express');
require('dotenv').config();

// Initialize Firebase first
require('./config/firebase');

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const snackRoutes = require('./routes/snackRoutes');

const app = express();

/* ===============================
   MIDDLEWARE
================================ */

app.use(express.json());

/* ===============================
   ROUTES
================================ */

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/battles', require('./routes/battleRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/owner', require('./routes/ownerRoute'));
app.use('/api/subscription', require('./routes/subscriptionRoute'));
app.use('/api/snacks', snackRoutes);

/* ===============================
   HEALTH CHECK
================================ */

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Thunder Gaming Cafe API is Online',
    status: 'active'
  });
});

module.exports = app;
