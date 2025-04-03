import { FETCH_GROUPS, CREATE_GROUP, JOIN_GROUP, LEAVE_GROUP } from './types';
import * as api from '../Api';

// Action to fetch user groups
export const fetchGroups = (userId) => async (dispatch) => {
    try {
        // Get the auth token
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return;
        }

        const { data } = await api.getUserGroups(userId);
        dispatch({ type: FETCH_GROUPS, payload: data });
        return data;
    } catch (error) {
        console.error("Error fetching groups:", error);
        return { error: error.response?.data?.message || 'Failed to fetch groups' };
    }
};

// Action to create a new group
export const createGroup = (groupData, navigate) => async (dispatch) => {
    try {
        // Get the auth token
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return { error: 'You must be logged in to create a group' };
        }

        console.log('Creating group with data:', groupData);
        console.log('Using token:', token);

        try {
            const { data } = await api.createGroup(groupData);
            console.log('Group created successfully:', data);

            dispatch({ type: CREATE_GROUP, payload: data });

            // Redirect to the new group page
            navigate(`/group/${data._id}`);
            return data;
        } catch (apiError) {
            console.error("API Error creating group:", apiError);
            console.error("Response data:", apiError.response?.data);
            return { error: apiError.response?.data?.message || 'Failed to create group' };
        }
    } catch (error) {
        console.error("Error in createGroup action:", error);
        return { error: 'An unexpected error occurred' };
    }
};

// Action to join a group
export const joinGroup = (groupIdOrInviteLink, navigate) => async (dispatch) => {
    try {
        // Get the auth token
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return { error: 'You must be logged in to join a group' };
        }

        let data;

        // Check if it's a group ID or invite link
        if (groupIdOrInviteLink.length === 24) { // MongoDB ObjectId is 24 characters
            // It's a group ID
            const response = await api.joinGroupById(groupIdOrInviteLink);
            data = response.data;
        } else {
            // It's an invite link
            const response = await api.joinGroup(groupIdOrInviteLink);
            data = response.data;
        }

        dispatch({ type: JOIN_GROUP, payload: data.group });

        // Redirect to the group page
        navigate(`/group/${data.group._id}`);
        return data;
    } catch (error) {
        console.error("Error joining group:", error);
        return { error: error.response?.data?.message || 'Failed to join group' };
    }
};

// Action to leave a group
export const leaveGroup = (groupId, navigate) => async (dispatch) => {
    try {
        // Get the auth token
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return { error: 'You must be logged in to leave a group' };
        }

        await api.leaveGroup(groupId);
        dispatch({ type: LEAVE_GROUP, payload: groupId });

        // Redirect to home page
        navigate('/');
        return { success: true };
    } catch (error) {
        console.error("Error leaving group:", error);
        return { error: error.response?.data?.message || 'Failed to leave group' };
    }
};
