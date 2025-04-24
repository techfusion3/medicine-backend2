const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const EmailLog = require('../models/EmailLog');
const sendReminderEmail = require('../utils/email');

// Runs every minute (for testing). Change to '0 * * * *' for hourly in production.
cron.schedule('* * * * *', async () => {
  try {
    console.log('[⏰ CRON] Checking reminders...');

    const now = new Date();
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const hours = istTime.getHours().toString().padStart(2, '0');
    const minutes = istTime.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    const reminders = await Reminder.find({}).lean();

    for (const reminder of reminders) {
      const { times, medicineName, userId } = reminder;

      if (!Array.isArray(times) || times.length === 0) continue;

      if (times.includes(currentTime)) {
        // Check if email already sent for this reminder at this time
        const alreadySent = await EmailLog.findOne({
          userId,
          medicineName,
          timeSent: currentTime,
        });

        if (alreadySent) {
          console.log(`[⏳ Already sent] Skipping duplicate email to user ${userId} for ${medicineName} at ${currentTime}`);
          continue;
        }

        const user = await User.findById(userId).lean();

        if (user && user.email) {
          const timeIndex = times.findIndex(time => time === currentTime);
          const dosage = reminder.dosages?.[timeIndex] || 'Not specified';

          const subject = `⏰ Medicine Reminder: ${medicineName}`;
          const text = `Hi ${user.name || 'User'}, it's time to take your medicine: ${medicineName}\nScheduled time: ${currentTime}\nDosage: ${dosage}`;

          const html = `
            <div style="font-family: Arial, sans-serif; padding: 10px;">
              <p>Hi <strong>${user.name || 'User'}</strong>,</p>
              <p>It's time to take your medicine:</p>
              <ul>
                <li><strong>Medicine:</strong> ${medicineName}</li>
                <li><strong>Scheduled Time:</strong> ${currentTime}</li>
                <li><strong>Dosage:</strong> ${dosage}</li>
              </ul>
              <p style="color: #28a745;">💊 Stay healthy!</p>
            </div>
          `;
          console.log('📧 HTML content being sent:', html);
          await sendReminderEmail(user.email, subject, html);
          

          await EmailLog.create({
            userId: user._id,
            email: user.email,
            medicineName,
            timeSent: currentTime,
          });

          console.log(`[📧 Email sent] to ${user.email} for ${medicineName} at ${currentTime}`);
        } else {
          console.log(`[⚠️ No email found] for userId: ${userId}`);
        }
      }
    }
  } catch (err) {
    console.error('[❌ CRON ERROR]', err.message || err);
  }
});
