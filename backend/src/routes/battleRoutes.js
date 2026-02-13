const express = require('express');
const router = express.Router();
const {
    startBattle,
    getActiveBattles,
    updateScore,
    finishBattle,
    getCompletedBattles,
    getThunderLeaderboard,
    getThunderPlayer
} = require('../controllers/battleController');

router.post('/start', startBattle);
router.get('/active', getActiveBattles);
router.get('/completed', getCompletedBattles);
router.post('/score/:id', updateScore);
router.post('/finish/:id', finishBattle);

router.get('/thunder-leaderboard', getThunderLeaderboard);
router.get('/thunder-player', getThunderPlayer);


module.exports = router;

