const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, deleteMessage, sendMessageValidation } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', sendMessageValidation, sendMessage);
router.get('/:rideId', getMessages);
router.delete('/:messageId', deleteMessage);

module.exports = router;
