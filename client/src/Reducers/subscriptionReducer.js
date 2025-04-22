import {
    FETCH_SUBSCRIPTION_PLANS,
    FETCH_CURRENT_SUBSCRIPTION,
    SUBSCRIBE_TO_PLAN,
    CANCEL_SUBSCRIPTION,
    CHECK_WATCH_TIME,
    UPDATE_WATCH_TIME_STATUS
} from '../action/subscriptionActions';

const initialState = {
    plans: [],
    currentSubscription: null,
    currentPlan: null,
    watchTimeLimit: 300, // Default 5 minutes
    subscriptionExpiry: null,
    loading: false,
    error: null,
    isBlocked: false,
    blockTimeRemaining: 0,
    watchTimeLimitReached: false,
    watchTimeLimitReachedAt: null
};

const subscriptionReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_SUBSCRIPTION_PLANS:
            return {
                ...state,
                plans: action.payload,
                loading: false
            };

        case FETCH_CURRENT_SUBSCRIPTION:
            return {
                ...state,
                currentSubscription: action.payload.subscription,
                currentPlan: action.payload.currentPlan,
                watchTimeLimit: action.payload.watchTimeLimit,
                subscriptionExpiry: action.payload.subscriptionExpiry,
                loading: false
            };

        case SUBSCRIBE_TO_PLAN:
            return {
                ...state,
                currentSubscription: action.payload.subscription,
                watchTimeLimit: action.payload.watchTimeLimit,
                subscriptionExpiry: action.payload.subscriptionExpiry,
                loading: false
            };

        case CANCEL_SUBSCRIPTION:
            return {
                ...state,
                currentSubscription: null,
                currentPlan: state.plans.find(plan => plan.id === 'free') || null,
                watchTimeLimit: 300, // Reset to 5 minutes
                subscriptionExpiry: null,
                loading: false
            };

        case CHECK_WATCH_TIME:
            return {
                ...state,
                watchTimeLimit: action.payload.watchTimeLimit,
                subscriptionExpiry: action.payload.subscriptionExpiry,
                isBlocked: action.payload.isBlocked,
                blockTimeRemaining: action.payload.blockTimeRemaining,
                watchTimeLimitReached: action.payload.watchTimeLimitReached,
                watchTimeLimitReachedAt: action.payload.watchTimeLimitReachedAt,
                loading: false
            };

        case UPDATE_WATCH_TIME_STATUS:
            return {
                ...state,
                watchTimeLimitReached: action.payload.watchTimeLimitReached,
                watchTimeLimitReachedAt: action.payload.watchTimeLimitReachedAt,
                isBlocked: true,
                blockTimeRemaining: 24,
                loading: false
            };

        default:
            return state;
    }
};

export default subscriptionReducer;
