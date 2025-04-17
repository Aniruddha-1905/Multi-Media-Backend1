import { JOIN_GROUP, FETCH_GROUPS, SEARCH_GROUPS } from './types';
import * as deployedApi from '../Api/deployedApi';

// Action to join a group via invite link in the deployed environment
export const joinGroupViaInvite = (inviteLink, navigate) => async (dispatch) => {
  try {
    // Get the auth token
    const token = JSON.parse(localStorage.getItem('Profile'))?.token;
    if (!token) {
      console.error("No auth token found");
      return { error: 'You must be logged in to join a group' };
    }

    console.log(`Joining group with invite link: ${inviteLink} (deployed API)`);
    
    const { data } = await deployedApi.joinGroupViaInvite(inviteLink);
    dispatch({ type: JOIN_GROUP, payload: data.group });

    // Redirect to the group page if navigate is provided
    if (navigate) {
      navigate(`/group/${data.group._id}`);
    }
    return data;
  } catch (error) {
    console.error("Error joining group (deployed):", error);
    return { error: error.response?.data?.message || 'Failed to join group' };
  }
};

// Action to fetch user groups in the deployed environment
export const fetchGroupsDeployed = (userId) => async (dispatch) => {
  try {
    // Get the auth token
    const token = JSON.parse(localStorage.getItem('Profile'))?.token;
    if (!token) {
      console.error("No auth token found");
      return;
    }

    const { data } = await deployedApi.getUserGroupsDeployed(userId);
    dispatch({ type: FETCH_GROUPS, payload: data });
    return data;
  } catch (error) {
    console.error("Error fetching groups (deployed):", error);
    return { error: error.response?.data?.message || 'Failed to fetch groups' };
  }
};

// Action to search for groups in the deployed environment
export const searchGroupsDeployed = (query) => async (dispatch) => {
  try {
    // Get the auth token - but don't fail if not found
    const token = JSON.parse(localStorage.getItem('Profile'))?.token;
    if (!token) {
      console.log("No auth token found, but continuing with search");
    }

    console.log(`Searching for groups with query: "${query}" (deployed API)`);

    // Use our improved API call that handles errors
    const result = await deployedApi.searchGroupsDeployed(query);
    const data = result?.data || [];

    console.log('Search results from deployed server:', data);

    // Ensure we have an array
    const validData = Array.isArray(data) ? data : [];

    // Log group names if any
    if (validData.length > 0) {
      console.log('All group names (deployed):', validData.map(g => g.name || 'unnamed'));
    } else {
      console.log('No groups returned from deployed server');
    }

    // Always dispatch a valid array
    dispatch({ type: SEARCH_GROUPS, payload: validData });
    return validData;
  } catch (error) {
    console.error("Error in searchGroups action (deployed):", error);
    // Always return an empty array on error
    dispatch({ type: SEARCH_GROUPS, payload: [] });
    return [];
  }
};
