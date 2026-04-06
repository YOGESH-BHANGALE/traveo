const express = require('express');
const router = express.Router();
const { getDriverDashboard, setDriverMode, submitVerification } = require('../controllers/driverController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', getDriverDashboard);
router.put('/mode', setDriverMode);
router.post('/verify', submitVerification);

module.exports = router;
