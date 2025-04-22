const currentuserreducer=(state=null,action)=>{
    switch (action.type) {
        case "FETCH_CURRENT_USER":
            return action.payload
        case "UPDATE_PREMIUM_STATUS":
            if (state && state.result) {
                return {
                    ...state,
                    result: {
                        ...state.result,
                        isPremium: action.payload.isPremium,
                        premiumExpiry: action.payload.premiumExpiry
                    }
                }
            }
            return state
        default:
            return state;
    }
}
export default currentuserreducer;