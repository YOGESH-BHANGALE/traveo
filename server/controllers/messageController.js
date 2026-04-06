const Message = require('../models/Message');
const Ride = require('../models/Ride');
const { body, validationResult } = require('express-validator');

const sendMessageValidation = [
  body('rideId').notEmpty().withMessage('Ride ID is required'),
  body('text').trim().notEmpty().withMessage('Message text is required'),
];

/** POST /api/messages */
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { rideId, text } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    const isParticipant = ride.users.some((u) => u.user.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (['completed', 'cancelled'].includes(ride.status))
      return res.status(403).json({ success: false, message: 'Chat is closed for this ride' });

    const message = await Message.create({ ride: rideId, sender: req.user._id, text, readBy: [req.user._id] });
    await message.populate('sender', 'name email profilePhoto');
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** GET /api/messages/:rideId */
const getMessages = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { page = 1, limit = 100 } = req.query;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    const isParticipant = ride.users.some((u) => u.user.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not authorized' });

    const messages = await Message.find({
      ride: rideId,
      deletedForEveryone: { $ne: true },
      deletedFor: { $nin: [req.user._id] },  // fix: $nin for array field
    })
      .populate('sender', 'name email profilePhoto')
      .sort({ createdAt: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ ride: rideId, deletedForEveryone: { $ne: true }, deletedFor: { $nin: [req.user._id] } });

    await Message.updateMany(
      { ride: rideId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true, messages, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** DELETE /api/messages/:messageId  body: { deleteFor: 'me' | 'everyone' } */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteFor } = req.body; // 'me' or 'everyone'

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    // Verify user is in the ride
    const ride = await Ride.findById(message.ride);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    const isParticipant = ride.users.some((u) => u.user.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not authorized' });

    if (deleteFor === 'everyone') {
      // Only sender can delete for everyone
      if (message.sender.toString() !== req.user._id.toString())
        return res.status(403).json({ success: false, message: 'Only the sender can delete for everyone' });
      message.deletedForEveryone = true;
      message.text = 'This message was deleted';
    } else {
      // Delete just for this user
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
      }
    }

    await message.save();

    // Notify other participants via socket if delete for everyone
    const io = req.app.get('io');
    if (io && deleteFor === 'everyone') {
      io.to(`ride:${message.ride}`).emit('message_deleted', {
        messageId: message._id,
        deleteFor: 'everyone',
      });
    }

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { sendMessage, getMessages, deleteMessage, sendMessageValidation };
