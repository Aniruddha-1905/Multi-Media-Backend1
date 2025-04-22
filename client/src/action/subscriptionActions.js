import * as api from "../Api";

// Action Types
export const FETCH_SUBSCRIPTION_PLANS = 'FETCH_SUBSCRIPTION_PLANS';
export const FETCH_CURRENT_SUBSCRIPTION = 'FETCH_CURRENT_SUBSCRIPTION';
export const SUBSCRIBE_TO_PLAN = 'SUBSCRIBE_TO_PLAN';
export const CANCEL_SUBSCRIPTION = 'CANCEL_SUBSCRIPTION';
export const CHECK_WATCH_TIME = 'CHECK_WATCH_TIME';
export const UPDATE_WATCH_TIME_STATUS = 'UPDATE_WATCH_TIME_STATUS';

// Fetch all subscription plans
export const fetchSubscriptionPlans = () => async (dispatch) => {
    try {
        const { data } = await api.getSubscriptionPlans();
        dispatch({ type: FETCH_SUBSCRIPTION_PLANS, payload: data });
        return data;
    } catch (error) {
        console.error("Error fetching subscription plans:", error);
        return { error: error.response?.data?.message || 'Failed to fetch subscription plans' };
    }
};

// Fetch current user's subscription
export const fetchCurrentSubscription = () => async (dispatch) => {
    try {
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return { error: 'You must be logged in to view subscription details' };
        }

        const { data } = await api.getCurrentSubscription();
        dispatch({ type: FETCH_CURRENT_SUBSCRIPTION, payload: data });
        return data;
    } catch (error) {
        console.error("Error fetching current subscription:", error);

        // Check if it's an authentication error
        if (error.response?.status === 401) {
            // Clear the invalid token
            localStorage.removeItem('Profile');
            return { error: 'Your session has expired. Please log in again.' };
        }

        return { error: error.response?.data?.message || 'Failed to fetch subscription details' };
    }
};

// Subscribe to a plan
export const subscribeToPlan = (planId, paymentId) => async (dispatch) => {
    try {
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return { error: 'You must be logged in to subscribe' };
        }

        const { data } = await api.subscribeToPlan(planId, paymentId);
        dispatch({ type: SUBSCRIBE_TO_PLAN, payload: data });
        return data;
    } catch (error) {
        console.error("Error subscribing to plan:", error);

        // Check if it's an authentication error
        if (error.response?.status === 401) {
            // Clear the invalid token
            localStorage.removeItem('Profile');
            return { error: 'Your session has expired. Please log in again.' };
        }

        return { error: error.response?.data?.message || 'Failed to subscribe to plan' };
    }
};

// Cancel subscription
export const cancelSubscription = () => async (dispatch) => {
    try {
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return { error: 'You must be logged in to cancel subscription' };
        }

        const { data } = await api.cancelSubscription();
        dispatch({ type: CANCEL_SUBSCRIPTION, payload: data });
        return data;
    } catch (error) {
        console.error("Error cancelling subscription:", error);

        // Check if it's an authentication error
        if (error.response?.status === 401) {
            // Clear the invalid token
            localStorage.removeItem('Profile');
            return { error: 'Your session has expired. Please log in again.' };
        }

        return { error: error.response?.data?.message || 'Failed to cancel subscription' };
    }
};

// Check watch time eligibility
export const checkWatchTimeEligibility = () => async (dispatch) => {
    try {
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return { error: 'You must be logged in to check watch time' };
        }

        const { data } = await api.checkWatchTimeEligibility();
        dispatch({ type: CHECK_WATCH_TIME, payload: data });
        return data;
    } catch (error) {
        console.error("Error checking watch time:", error);

        // Check if it's an authentication error
        if (error.response?.status === 401) {
            // Clear the invalid token
            localStorage.removeItem('Profile');
            return { error: 'Your session has expired. Please log in again.' };
        }

        return { error: error.response?.data?.message || 'Failed to check watch time' };
    }
};

// Update watch time limit status
export const updateWatchTimeStatus = (limitReached) => async (dispatch) => {
    try {
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return { error: 'You must be logged in to update watch time status' };
        }

        const { data } = await api.updateWatchTimeStatus(limitReached);
        dispatch({ type: UPDATE_WATCH_TIME_STATUS, payload: data });
        return data;
    } catch (error) {
        console.error("Error updating watch time status:", error);

        // Check if it's an authentication error
        if (error.response?.status === 401) {
            // Clear the invalid token
            localStorage.removeItem('Profile');
            return { error: 'Your session has expired. Please log in again.' };
        }

        return { error: error.response?.data?.message || 'Failed to update watch time status' };
    }
};
