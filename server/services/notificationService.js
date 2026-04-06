const webpush = require('web-push');

// Configure web push
const configurePush = () => {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@traveo.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
};

/**
 * Send push notification to a user
 * @param {object} subscription - Push subscription object
 * @param {object} payload - Notification payload
 */
const sendPushNotification = async (subscription, payload) => {
  if (!subscription) return;

  try {
    const notificationPayload = JSON.stringify({
      title: payload.title || 'Traveo',
      body: payload.body || '',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: payload.data || {},
    });

    await webpush.sendNotification(subscription, notificationPayload);
  } catch (error) {
    console.error('Push notification error:', error.message);
    // If subscription is expired or invalid, we should handle it
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('Push subscription has expired or is invalid');
    }
  }
};

/**
 * Notification types
 */
const NOTIFICATION_TYPES = {
  NEW_MATCH: 'new_match',
  RIDE_ACCEPTED: 'ride_accepted',
  RIDE_REJECTED: 'ride_rejected',
  NEW_MESSAGE: 'new_message',
  RIDE_STARTED: 'ride_started',
  RIDE_COMPLETED: 'ride_completed',
};

/**
 * Create notification payload based on type
 */
const createNotification = (type, data) => {
  switch (type) {
    case NOTIFICATION_TYPES.NEW_MATCH:
      return {
        title: 'New Travel Match!',
        body: `${data.userName} is traveling to a similar destination. Match score: ${data.matchScore}%`,
        data: { type, matchId: data.matchId },
      };
    case NOTIFICATION_TYPES.RIDE_ACCEPTED:
      return {
        title: 'Ride Accepted!',
        body: `${data.userName} has accepted your ride request.`,
        data: { type, rideId: data.rideId },
      };
    case NOTIFICATION_TYPES.RIDE_REJECTED:
      return {
        title: 'Ride Update',
        body: `${data.userName} has declined the ride request.`,
        data: { type, matchId: data.matchId },
      };
    case NOTIFICATION_TYPES.NEW_MESSAGE:
      return {
        title: `Message from ${data.userName}`,
        body: data.message.substring(0, 100),
        data: { type, rideId: data.rideId },
      };
    case NOTIFICATION_TYPES.RIDE_STARTED:
      return {
        title: 'Ride Started!',
        body: 'Your shared ride has begun. Stay safe!',
        data: { type, rideId: data.rideId },
      };
    case NOTIFICATION_TYPES.RIDE_COMPLETED:
      return {
        title: 'Ride Completed',
        body: 'Your ride has been completed. Please rate your travel companion.',
        data: { type, rideId: data.rideId },
      };
    default:
      return {
        title: 'Traveo',
        body: 'You have a new notification.',
        data: { type },
      };
  }
};

module.exports = {
  configurePush,
  sendPushNotification,
  createNotification,
  NOTIFICATION_TYPES,
};
