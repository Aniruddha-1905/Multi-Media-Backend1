import { FETCH_MESSAGES, SEND_MESSAGE } from './types';
import * as api from '../Api';

// Fetch Messages for a Group
export const fetchMessages = (groupId) => async (dispatch) => {
    try {
        // Get the auth token
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return;
        }

        const { data } = await api.getMessages(groupId);
        dispatch({ type: FETCH_MESSAGES, payload: { groupId, messages: data } });
        return data;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { error: error.response?.data?.message || 'Failed to fetch messages' };
    }
};

// Send Message to a Group
export const sendMessage = (groupId, messageBody) => async (dispatch) => {
    try {
        // Get the auth token
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return { error: 'You must be logged in to send messages' };
        }

        const { data } = await api.sendMessage(groupId, messageBody);
        dispatch({ type: SEND_MESSAGE, payload: { groupId, message: data } });
        return data;
    } catch (error) {
        console.error("Error sending message:", error);
        return { error: error.response?.data?.message || 'Failed to send message' };
    }
};
