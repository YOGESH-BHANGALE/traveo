const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      maxlength: 1000,
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Per-user soft delete
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Hard delete for everyone
    deletedForEveryone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ ride: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
