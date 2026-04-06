const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/chatbotController');

// Public route - no authentication required for chatbot
router.post('/chat', chatWithAI);

module.exports = router;
