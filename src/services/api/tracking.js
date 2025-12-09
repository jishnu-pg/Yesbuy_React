import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Track order shipment status
 * @param {number|string} orderId - Cart item ID
 * @returns {Promise<{status: boolean, message: string, data: Array}>}
 */
export const trackOrder = async (orderId) => {
    const response = await get(endpoints.shiprocket.trackOrder(orderId));
    return response;
};
