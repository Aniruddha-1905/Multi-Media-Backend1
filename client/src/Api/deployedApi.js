import axios from "axios";

// Create a new API instance for the deployed backend
const DeployedAPI = axios.create({
  baseURL: `http://localhost:5000/`
});

// Add the same interceptor for authentication
DeployedAPI.interceptors.request.use((req) => {
  if (localStorage.getItem("Profile")) {
    req.headers.Authorization = `Bearer ${JSON.parse(localStorage.getItem("Profile")).token}`;
  }
  return req;
});

// Group API functions for deployed environment
export const joinGroupViaInvite = (inviteLink) => DeployedAPI.post(`/groups/join/${inviteLink}`);
export const getGroupByIdDeployed = (groupId) => DeployedAPI.get(`/groups/${groupId}`);
export const getUserGroupsDeployed = (userId) => DeployedAPI.get(`/groups/user/${userId}`);
export const searchGroupsDeployed = async (query) => {
  try {
    // Use a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await DeployedAPI.get(`/groups/search?q=${encodeURIComponent(query || ' ')}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    console.error('Error in searchGroups API call:', error);
    // Return a resolved promise with empty data to prevent UI errors
    return { data: [] };
  }
};
