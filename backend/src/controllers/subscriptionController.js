const { db } = require('../config/firebase');

/**
 * ➕ Create subscription
 */
const createSubscription = async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const subscription = {
      name,
      startDate,
      endDate,
      createdAt: new Date().toISOString()
    };

    const ref = await db.collection('subscriptions').add(subscription);

    res.status(201).json({
      id: ref.id,
      ...subscription
    });

  } catch (err) {
    console.error('❌ createSubscription error:', err);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
};

/**
 * 📥 Get all subscriptions
 */
const getSubscriptions = async (req, res) => {
  try {
    const snapshot = await db
      .collection('subscriptions')
      .orderBy('createdAt', 'desc')
      .get();

    const subscriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(subscriptions);

  } catch (err) {
    console.error('❌ getSubscriptions error:', err);
    res.status(500).json({ message: 'Failed to fetch subscriptions' });
  }
};

module.exports = {
  createSubscription,
  getSubscriptions
};