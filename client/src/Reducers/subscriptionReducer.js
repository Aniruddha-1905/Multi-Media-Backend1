import { 
    FETCH_SUBSCRIPTION_PLANS, 
    FETCH_CURRENT_SUBSCRIPTION, 
    SUBSCRIBE_TO_PLAN, 
    CANCEL_SUBSCRIPTION,
    CHECK_WATCH_TIME
} from '../action/subscriptionActions';

const initialState = {
    plans: [],
    currentSubscription: null,
    currentPlan: null,
    watchTimeLimit: 300, // Default 5 minutes
    subscriptionExpiry: null,
    loading: false,
    error: null
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
                loading: false
            };
        
        default:
            return state;
    }
};

export default subscriptionReducer;
