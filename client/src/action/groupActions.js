import { FETCH_GROUPS, CREATE_GROUP, JOIN_GROUP, LEAVE_GROUP, SEARCH_GROUPS } from './types';
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
export const joinGroup = (inviteLink, navigate) => async (dispatch) => {
    try {
        // Get the auth token
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.error("No auth token found");
            return { error: 'You must be logged in to join a group' };
        }

        const { data } = await api.joinGroup(inviteLink);
        dispatch({ type: JOIN_GROUP, payload: data.group });

        // Redirect to the group page if navigate is provided
        if (navigate) {
            navigate(`/group/${data.group._id}`);
        }
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

// Action to search for groups
export const searchGroups = (query) => async (dispatch) => {
    try {
        // Get the auth token - but don't fail if not found
        const token = JSON.parse(localStorage.getItem('Profile'))?.token;
        if (!token) {
            console.log("No auth token found, but continuing with search");
        }

        console.log(`Searching for groups with query: "${query}"`);

        // Use our improved API call that handles errors
        const result = await api.searchGroups(query);
        const data = result?.data || [];

        console.log('Search results from server:', data);

        // Ensure we have an array
        const validData = Array.isArray(data) ? data : [];

        // Log group names if any
        if (validData.length > 0) {
            console.log('All group names:', validData.map(g => g.name || 'unnamed'));
        } else {
            console.log('No groups returned from server');
        }

        // Always dispatch a valid array
        dispatch({ type: SEARCH_GROUPS, payload: validData });
        return validData;
    } catch (error) {
        console.error("Error in searchGroups action:", error);
        // Always return an empty array on error
        dispatch({ type: SEARCH_GROUPS, payload: [] });
        return [];
    }
};
