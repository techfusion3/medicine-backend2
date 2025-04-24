const express = require('express');
const webpush = require('web-push');
const router = express.Router();
const User = require('../models/User');

webpush.setVapidDetails(
  'mailto:your-email@example.com', 
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Save push subscription to the database
router.post('/', async (req, res) => {
  const { userId, subscription } = req.body;

  if (!userId || !subscription) {
    return res.status(400).send('Missing userId or subscription');
  }

  try {
    const user = await User.findById(userId);
    if (user) {
      user.pushSubscription = subscription;
      await user.save();
      res.status(200).send('Subscribed to Push Notifications');
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error('[❌ Subscription Save Error]', err);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
