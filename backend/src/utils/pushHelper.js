const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let isInitialized = false;

const initializeFirebase = () => {
  if (isInitialized) return true;

  try {
    const serviceAccountPath = path.join(__dirname, '../config/serviceAccountKey.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isInitialized = true;
      console.log('Firebase Admin initialized successfully.');
      return true;
    } else {
      console.warn('Push Notifications: serviceAccountKey.json missing. Actual push will be bypassed.');
      return false;
    }
  } catch (error) {
    console.error('Firebase Initialization Error:', error);
    return false;
  }
};

const sendPush = async (token, title, body, data = {}) => {
  if (!initializeFirebase()) {
    console.log('Skipping push: Firebase not configured.');
    return null;
  }

  const message = {
    notification: { title, body },
    token: token,
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK' // For Capacitor too
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent push message:', response);
    return response;
  } catch (error) {
    console.error('Error sending push message:', error);
    return null;
  }
};

module.exports = { sendPush };
