/**
 * AI Chatbot Controller
 * Handles chatbot conversations using OpenAI or Claude API
 */

/**
 * Chat with AI assistant
 * POST /api/chatbot/chat
 */
const chatWithAI = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // System prompt for Traveo context
    const systemPrompt = `You are a helpful AI assistant for Traveo, a ride-sharing and travel matching platform. 

Traveo helps users:
- Find travel companions going to the same destination
- Share rides and split costs (save up to 50%)
- Reduce traffic congestion and carbon footprint
- Travel safely with verified users

Key Features:
1. Post a Trip: Users enter pickup location, destination, date, time, and seats
2. Smart Matching: Algorithm finds buddies within 1km destination, 30min time difference
3. Cost Splitting: Automatic fare calculation and equal split
4. Real-time Chat: Instant messaging between matched users
5. Safety: Verified profiles, ratings (1-5 stars), emergency contacts, report system
6. Ride Management: Start, complete, and rate rides

Contact Information:
- Email: bhangaley214@gmail.com
- Phone: +91 8605651090
- Address: DR.D.Y.Patil Institute of Technology, Pimpri, Pune

Be friendly, helpful, and provide accurate information about Traveo. If asked about features not mentioned above, politely say it's not currently available but may be added in future updates.`;

    // Choose AI provider based on environment variable
    const aiProvider = process.env.AI_PROVIDER || 'openai'; // 'openai' or 'claude'

    let aiResponse;

    if (aiProvider === 'openai') {
      aiResponse = await chatWithOpenAI(message, conversationHistory, systemPrompt);
    } else if (aiProvider === 'claude') {
      aiResponse = await chatWithClaude(message, conversationHistory, systemPrompt);
    } else {
      // Fallback to rule-based responses
      aiResponse = getFallbackResponse(message);
    }

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    
    // Return fallback response on error
    const fallbackResponse = getFallbackResponse(req.body.message);
    
    res.json({
      success: true,
      response: fallbackResponse,
      fallback: true,
    });
  }
};

/**
 * Chat with OpenAI (ChatGPT)
 */
const chatWithOpenAI = async (message, conversationHistory, systemPrompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo', // or 'gpt-4' for better responses
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('OpenAI API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

/**
 * Chat with Claude (Anthropic)
 */
const chatWithClaude = async (message, conversationHistory, systemPrompt) => {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  // Build conversation history for Claude
  let conversationText = systemPrompt + '\n\n';
  conversationHistory.forEach(msg => {
    conversationText += `${msg.sender === 'user' ? 'Human' : 'Assistant'}: ${msg.text}\n\n`;
  });
  conversationText += `Human: ${message}\n\nAssistant:`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229', // or 'claude-3-opus-20240229' for best quality
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: conversationText,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Claude API request failed');
  }

  const data = await response.json();
  return data.content[0].text;
};

/**
 * Fallback response when AI is not available
 */
const getFallbackResponse = (message) => {
  const msg = message.toLowerCase();

  // Post a trip
  if (msg.includes('post') || msg.includes('create trip')) {
    return "To post a trip:\n\n1. Click 'Post a Trip' from dashboard\n2. Enter pickup location (e.g., DR.D.Y.Patil Institute)\n3. Enter destination\n4. Select date and time\n5. Choose number of seats\n6. Click 'Post Trip & Find Matches'\n\nThe system will automatically find travel buddies for you! 🚗";
  }

  // Matching
  if (msg.includes('match') || msg.includes('find')) {
    return "Our smart matching algorithm finds travel buddies based on:\n\n✅ Similar destination (within 1km)\n✅ Similar time (within 30 minutes)\n✅ Nearby pickup location\n\nYou'll see a match score (0-100%) for each potential buddy. Higher score = better match! 🎯";
  }

  // Safety
  if (msg.includes('safe') || msg.includes('security')) {
    return "Your safety is our priority! 🛡️\n\nSafety features:\n• Verified user profiles\n• Rating system (1-5 stars)\n• Emergency contact storage\n• Report user option\n• Complete trip history\n• Real-time chat for coordination";
  }

  // Cost
  if (msg.includes('cost') || msg.includes('price') || msg.includes('fare')) {
    return "Cost splitting is automatic! 💰\n\nHow it works:\n1. System calculates total fare based on distance\n2. Fare is split equally among riders\n3. You see your share before accepting\n\nExample: Total fare ₹200 → Your share ₹100 (50% savings!)";
  }

  // Contact
  if (msg.includes('contact') || msg.includes('support')) {
    return "Need help? Contact us! 📞\n\n📧 Email: bhangaley214@gmail.com\n📱 Phone: +91 8605651090\n📍 Address: DR.D.Y.Patil Institute of Technology, Pimpri\n\nWe're here to help 24/7!";
  }

  // Default
  return "I'm your Traveo assistant! 😊\n\nI can help you with:\n• Posting trips and finding travel buddies\n• Understanding how matching works\n• Safety features and cost splitting\n• Account setup and ride management\n\nWhat would you like to know?";
};

module.exports = {
  chatWithAI,
};
