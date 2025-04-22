const downloadedVideoReducer = (state = { data: [], eligibility: null }, action) => {
    switch (action.type) {
        case "FETCH_USER_DOWNLOADED_VIDEOS":
            return { ...state, data: action.payload };
        case "DOWNLOAD_VIDEO":
            return { ...state, lastDownloaded: action.payload };
        case "CHECK_DOWNLOAD_ELIGIBILITY":
            return { ...state, eligibility: action.payload };
        case "UPDATE_PREMIUM_STATUS":
            return { ...state, premiumStatus: action.payload };
        default:
            return state;
    }
};

export default downloadedVideoReducer;
