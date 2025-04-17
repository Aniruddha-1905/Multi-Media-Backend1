import { FETCH_GROUPS, CREATE_GROUP, JOIN_GROUP, LEAVE_GROUP, SEARCH_GROUPS } from '../action/types';

const initialState = {
    userGroups: [],
    searchResults: []
};

const groupsReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_GROUPS:
            return { ...state, userGroups: action.payload };

        case CREATE_GROUP:
            return {
                ...state,
                userGroups: [...state.userGroups, action.payload]
            };

        case JOIN_GROUP:
            // Check if the group is already in the list
            const groupExists = state.userGroups.some(group => group._id === action.payload._id);
            if (groupExists) {
                return state;
            }
            return {
                ...state,
                userGroups: [...state.userGroups, action.payload]
            };

        case LEAVE_GROUP:
            return {
                ...state,
                userGroups: state.userGroups.filter(group => group._id !== action.payload)
            };

        case SEARCH_GROUPS:
            return {
                ...state,
                searchResults: action.payload
            };

        default:
            return state;
    }
};

export default groupsReducer;
