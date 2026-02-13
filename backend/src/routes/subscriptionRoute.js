const express = require('express');
const router = express.Router();
const {createSubscription, getSubscriptions} = require ('../controllers/subscriptionController');

router.post('/subscriptions', createSubscription);
router.get('/subscriptions', getSubscriptions);

module.exports = router;