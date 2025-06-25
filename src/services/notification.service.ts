import * as admin from 'firebase-admin';
import { NotificationPayload } from '../types/job.types';

class NotificationService {
  private firebaseApp: admin.app.App;

  constructor() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        // You can also use service account key file:
        // credential: admin.credential.cert(require('../path/to/serviceAccountKey.json')),
      });
    } else {
      this.firebaseApp = admin.app();
    }
  }

  /**
   * Send notification to a specific device using FCM token
   */
  async sendToDevice(token: string, payload: NotificationPayload): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'handyman_jobs',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.firebaseApp.messaging().send(message);
      console.log('Successfully sent notification:', response);
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple devices
   */
  async sendToMultipleDevices(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<admin.messaging.BatchResponse> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'handyman_jobs',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.firebaseApp.messaging().sendEachForMulticast(message);
      console.log('Successfully sent notifications:', response);
      return response;
    } catch (error) {
      console.error('Error sending notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(topic: string, payload: NotificationPayload): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'handyman_jobs',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.firebaseApp.messaging().send(message);
      console.log('Successfully sent topic notification:', response);
      return response;
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }

  /**
   * Subscribe a device to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      const response = await this.firebaseApp.messaging().subscribeToTopic(tokens, topic);
      console.log('Successfully subscribed to topic:', response);
      return response;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe a device from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      const response = await this.firebaseApp.messaging().unsubscribeFromTopic(tokens, topic);
      console.log('Successfully unsubscribed from topic:', response);
      return response;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  /**
   * Send job notification to artisans
   */
  async sendJobNotification(
    artisanTokens: string[],
    jobData: {
      jobId: string;
      serviceName: string;
      description: string;
      distanceKm: number;
      estimatedCost?: number;
    }
  ): Promise<admin.messaging.BatchResponse> {
    const payload: NotificationPayload = {
      title: `New ${jobData.serviceName} Job Available`,
      body: `${jobData.description.substring(0, 100)}${jobData.description.length > 100 ? '...' : ''} • ${jobData.distanceKm.toFixed(1)}km away`,
      data: {
        jobId: jobData.jobId,
        serviceName: jobData.serviceName,
        distanceKm: jobData.distanceKm.toString(),
        estimatedCost: jobData.estimatedCost?.toString() || '',
        type: 'new_job',
      },
    };

    return this.sendToMultipleDevices(artisanTokens, payload);
  }

  /**
   * Send cost estimate notification
   */
  async sendCostEstimateNotification(
    token: string,
    estimateData: {
      serviceName: string;
      minCost: number;
      maxCost: number;
      currency: string;
    }
  ): Promise<string> {
    const payload: NotificationPayload = {
      title: `${estimateData.serviceName} Cost Estimate`,
      body: `Estimated cost: ${estimateData.currency}${estimateData.minCost} - ${estimateData.currency}${estimateData.maxCost}`,
      data: {
        serviceName: estimateData.serviceName,
        minCost: estimateData.minCost.toString(),
        maxCost: estimateData.maxCost.toString(),
        currency: estimateData.currency,
        type: 'cost_estimate',
      },
    };

    return this.sendToDevice(token, payload);
  }
}

export default new NotificationService(); 