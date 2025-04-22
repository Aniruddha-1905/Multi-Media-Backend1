import { FETCH_MESSAGES, SEND_MESSAGE } from '../action/types';

const initialState = {};

const messagesReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_MESSAGES:
            return { ...state, [action.payload.groupId]: action.payload.messages };
        case SEND_MESSAGE:
            return {
                ...state,
                [action.payload.groupId]: [
                    ...(state[action.payload.groupId] || []),
                    action.payload.message
                ]
            };
        default:
            return state;
    }
};

export default messagesReducer;
