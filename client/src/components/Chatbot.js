'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiUser, FiHelpCircle } from 'react-icons/fi';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! 👋 I'm your Traveo assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Quick reply suggestions
  const quickReplies = [
    { id: 1, text: 'How to post a trip?', icon: '🚗' },
    { id: 2, text: 'How does matching work?', icon: '🎯' },
    { id: 3, text: 'Is it safe?', icon: '🛡️' },
    { id: 4, text: 'How to chat?', icon: '💬' },
  ];

  // Bot responses based on keywords
  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();

    // Post a trip
    if (message.includes('post') || message.includes('create trip') || message.includes('add trip')) {
      return {
        text: "To post a trip:\n\n1. Click 'Post a Trip' from dashboard\n2. Enter pickup location (e.g., DR.D.Y.Patil Institute)\n3. Enter destination\n4. Select date and time\n5. Choose number of seats\n6. Click 'Post Trip & Find Matches'\n\nThe system will automatically find travel buddies for you! 🚗",
        suggestions: ['How does matching work?', 'What is cost split?'],
      };
    }

    // Matching
    if (message.includes('match') || message.includes('find') || message.includes('buddy')) {
      return {
        text: "Our smart matching algorithm finds travel buddies based on:\n\n✅ Similar destination (within 1km)\n✅ Similar time (within 30 minutes)\n✅ Nearby pickup location\n\nYou'll see a match score (0-100%) for each potential buddy. Higher score = better match! 🎯",
        suggestions: ['How to accept a match?', 'What is match score?'],
      };
    }

    // Safety
    if (message.includes('safe') || message.includes('security') || message.includes('trust')) {
      return {
        text: "Your safety is our priority! 🛡️\n\nSafety features:\n• Verified user profiles\n• Rating system (1-5 stars)\n• Emergency contact storage\n• Report user option\n• Complete trip history\n• Real-time chat for coordination\n\nAlways verify your travel buddy's details before the trip!",
        suggestions: ['How to report a user?', 'How ratings work?'],
      };
    }

    // Chat
    if (message.includes('chat') || message.includes('message') || message.includes('talk')) {
      return {
        text: "Real-time chat is available after ride confirmation! 💬\n\nFeatures:\n• Instant messaging\n• Typing indicators\n• Online/offline status\n• Message history\n\nUse chat to coordinate:\n- Exact pickup point\n- Contact details\n- Any special instructions",
        suggestions: ['How to start a ride?', 'How to complete ride?'],
      };
    }

    // Cost/Payment
    if (message.includes('cost') || message.includes('price') || message.includes('payment') || message.includes('fare')) {
      return {
        text: "Cost splitting is automatic! 💰\n\nHow it works:\n1. System calculates total fare based on distance\n2. Fare is split equally among riders\n3. You see your share before accepting\n\nExample:\nTotal fare: ₹200\nYour share: ₹100 (50% savings!)\n\nPayment is coordinated between riders.",
        suggestions: ['How to post a trip?', 'Is it safe?'],
      };
    }

    // Registration
    if (message.includes('register') || message.includes('signup') || message.includes('account')) {
      return {
        text: "Creating an account is easy! 👤\n\n1. Click 'Sign Up' button\n2. Enter your details:\n   - Name\n   - Email\n   - Phone number\n   - Password\n3. Or use 'Continue with Google'\n\nThat's it! You're ready to find travel buddies.",
        suggestions: ['How to post a trip?', 'How does matching work?'],
      };
    }

    // Rating
    if (message.includes('rating') || message.includes('review') || message.includes('rate')) {
      return {
        text: "Rating system helps build trust! ⭐\n\nAfter completing a ride:\n1. Click 'Rate Companion'\n2. Give 1-5 stars\n3. Add optional comment\n4. Submit\n\nYour rating helps other users make informed decisions. Be honest and fair!",
        suggestions: ['How to complete ride?', 'Is it safe?'],
      };
    }

    // Contact
    if (message.includes('contact') || message.includes('support') || message.includes('help')) {
      return {
        text: "Need more help? Contact us! 📞\n\n📧 Email: bhangaley214@gmail.com\n📱 Phone: +91 8605651090\n📍 Address: DR.D.Y.Patil Institute of Technology, Pimpri\n\nWe're here to help 24/7!",
        suggestions: ['How to post a trip?', 'How does matching work?'],
      };
    }

    // Default response
    return {
      text: "I'm here to help! 😊\n\nI can assist you with:\n• Posting trips\n• Finding travel buddies\n• Understanding matching\n• Safety features\n• Cost splitting\n• Chat features\n• Account setup\n\nWhat would you like to know?",
      suggestions: ['How to post a trip?', 'Is it safe?', 'How does matching work?'],
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Call backend AI API
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          conversationHistory: messages.slice(-10), // Send last 10 messages for context
        }),
      });

      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: messages.length + 2,
          text: data.response,
          sender: 'bot',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Fallback response
      const botMessage = {
        id: messages.length + 2,
        text: "I'm having trouble connecting right now. Please try again or contact support at bhangaley214@gmail.com 📧",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (text) => {
    setInputMessage(text);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-full shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 flex items-center justify-center group"
          >
            <FiMessageCircle size={28} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FiHelpCircle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Traveo Assistant</h3>
                  <p className="text-xs text-white/80 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                    Online 24/7
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        message.sender === 'user'
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-primary-200' : 'text-gray-400'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-2 ml-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickReply(suggestion)}
                          className="text-xs bg-white text-primary-600 px-3 py-1.5 rounded-full border border-primary-200 hover:bg-primary-50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length === 1 && (
              <div className="p-4 bg-white border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply.text)}
                      className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-colors text-left flex items-center space-x-2"
                    >
                      <span>{reply.icon}</span>
                      <span>{reply.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
