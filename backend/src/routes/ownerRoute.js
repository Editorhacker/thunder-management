const express = require('express');
const router = express.Router();
const {getOwnerDashboardStats,
    getRevenueFlow,
    getRecentTransactions,
    getRevenueByMachine,
} =require('../controllers/ownerDashboardController')

router.get('/ownerstat', getOwnerDashboardStats);
router.get('/revenueflow', getRevenueFlow);
router.get('/transactions', getRecentTransactions);
router.get('/revenue-by-machine', getRevenueByMachine);

module.exports = router;