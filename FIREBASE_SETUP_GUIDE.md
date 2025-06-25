# Firebase Cloud Messaging Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in the HandyMan backend.

## Prerequisites

1. A Google account
2. Node.js and npm installed
3. Access to Firebase Console

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "handyman-app")
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

## Step 2: Add Android App to Firebase

1. In your Firebase project, click the Android icon to add an Android app
2. Enter your Android package name (e.g., `com.handyman.app`)
3. Enter app nickname (optional)
4. Click "Register app"
5. Download the `google-services.json` file
6. Place it in your Android app's `app/` directory

## Step 3: Add iOS App to Firebase (if applicable)

1. In your Firebase project, click the iOS icon to add an iOS app
2. Enter your iOS bundle ID (e.g., `com.handyman.app`)
3. Enter app nickname (optional)
4. Click "Register app"
5. Download the `GoogleService-Info.plist` file
6. Add it to your iOS project

## Step 4: Generate Service Account Key

1. In Firebase Console, go to Project Settings (gear icon)
2. Click on the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely (this contains sensitive credentials)
5. **Important**: Never commit this file to version control

## Step 5: Configure Backend Environment

1. Create a `.env` file in your backend root directory (if not exists)
2. Add the following environment variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url
```

## Step 6: Update Notification Service

The notification service is already configured to use Firebase Admin SDK. You can choose between two authentication methods:

### Method 1: Environment Variables (Recommended)

The service will automatically use the environment variables you set in Step 5.

### Method 2: Service Account File

If you prefer to use the service account JSON file:

1. Place the downloaded service account JSON file in a secure location
2. Update the notification service to use the file:

```typescript
// In src/services/notification.service.ts
this.firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(require('../path/to/serviceAccountKey.json')),
});
```

## Step 7: Mobile App Integration

### Android Setup

1. Add Firebase SDK to your Android app:

```gradle
// app/build.gradle
dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
    implementation 'com.google.firebase:firebase-analytics:21.0.0'
}
```

2. Create a service to handle FCM messages:

```kotlin
// MyFirebaseMessagingService.kt
class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Send token to your backend
        sendTokenToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        // Handle notification
        showNotification(remoteMessage)
    }
}
```

3. Register the service in AndroidManifest.xml:

```xml
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### iOS Setup

1. Add Firebase SDK to your iOS app using CocoaPods:

```ruby
# Podfile
pod 'Firebase/Messaging'
pod 'Firebase/Analytics'
```

2. Initialize Firebase in your AppDelegate:

```swift
import Firebase

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        return true
    }
}
```

3. Implement UNUserNotificationCenterDelegate:

```swift
extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.alert, .badge, .sound])
    }
}
```

## Step 8: Token Management

### Storing FCM Tokens

You'll need to store FCM tokens in your database. Add a field to your User model:

```sql
-- Add to your database schema
ALTER TABLE users ADD COLUMN fcm_token VARCHAR(255);
```

### Updating Tokens

Implement an endpoint to update FCM tokens:

```typescript
// In your user routes
router.post('/fcm-token', authMiddleware, async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;
  
  await prisma.user.update({
    where: { id: userId },
    data: { fcmToken: token }
  });
  
  res.json({ success: true });
});
```

## Step 9: Testing Notifications

1. Start your backend server
2. Create a test job using the API
3. Check the console logs for notification sending status
4. Verify notifications appear on your mobile device

## Step 10: Production Considerations

### Security

1. **Never commit service account keys to version control**
2. Use environment variables in production
3. Set up proper Firebase Security Rules
4. Implement token validation

### Performance

1. Use topic messaging for broadcast notifications
2. Implement token cleanup for inactive users
3. Monitor FCM quotas and limits
4. Set up error handling and retry logic

### Monitoring

1. Enable Firebase Analytics
2. Monitor notification delivery rates
3. Set up alerts for failed notifications
4. Track user engagement with notifications

## Troubleshooting

### Common Issues

1. **"Invalid registration token"**: Token is outdated or invalid
2. **"NotRegistered"**: App was uninstalled or token expired
3. **"MismatchSenderId"**: Wrong Firebase project configuration

### Debug Steps

1. Check Firebase Console for error logs
2. Verify service account credentials
3. Test with Firebase Console's "Send test message"
4. Check mobile app logs for FCM errors

## API Endpoints

The following endpoints are available for notification management:

- `POST /api/jobs` - Creates job and sends notifications to matching artisans
- `GET /api/estimate` - Returns cost estimates
- `GET /api/jobs/:jobId/matches` - Shows matching artisans for a job

## Support

For additional help:

1. [Firebase Documentation](https://firebase.google.com/docs)
2. [FCM Best Practices](https://firebase.google.com/docs/cloud-messaging/android/client)
3. [Firebase Console](https://console.firebase.google.com/)

## Environment Variables Reference

```env
# Required for Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Optional
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
``` 