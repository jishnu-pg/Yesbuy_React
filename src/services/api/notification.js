// src/services/api/notification.js
import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get user notifications
 * @returns {Promise<{welcome_notification: Array, track_orders: Array}>}
 */
export const getUserNotifications = async () => {
  const response = await get(endpoints.notification.getUserNotifications);
  return response;
};

