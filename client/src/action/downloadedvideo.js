import * as api from "../Api";

export const checkDownloadEligibility = () => async (dispatch) => {
    try {
        const { data } = await api.checkDownloadEligibility();
        dispatch({ type: "CHECK_DOWNLOAD_ELIGIBILITY", payload: data });
        return data;
    } catch (error) {
        console.log(error);
        return { canDownload: false, message: error.response?.data?.message || "Error checking download eligibility" };
    }
};

export const downloadVideo = (videoId) => async (dispatch) => {
    try {
        const { data } = await api.downloadVideo(videoId);
        dispatch({ type: "DOWNLOAD_VIDEO", payload: data });
        dispatch(getUserDownloadedVideos());
        return data;
    } catch (error) {
        console.log(error);
        return { success: false, message: error.response?.data?.message || "Error downloading video" };
    }
};

export const getUserDownloadedVideos = () => async (dispatch) => {
    try {
        const { data } = await api.getUserDownloadedVideos();
        dispatch({ type: "FETCH_USER_DOWNLOADED_VIDEOS", payload: data });
        return data;
    } catch (error) {
        console.log(error);
        return [];
    }
};

export const upgradeToPremium = () => async (dispatch) => {
    try {
        const { data } = await api.upgradeToPremium();

        // Update the current user with premium status
        dispatch({
            type: "UPDATE_PREMIUM_STATUS",
            payload: {
                isPremium: true,
                premiumExpiry: data.premiumExpiry
            }
        });

        return data;
    } catch (error) {
        console.log(error);
        return { success: false, message: error.response?.data?.message || "Error upgrading to premium" };
    }
};

export const cancelPremium = () => async (dispatch) => {
    try {
        const { data } = await api.cancelPremium();

        // Update the current user to remove premium status
        dispatch({
            type: "UPDATE_PREMIUM_STATUS",
            payload: {
                isPremium: false,
                premiumExpiry: null
            }
        });

        return data;
    } catch (error) {
        console.log(error);
        return { success: false, message: error.response?.data?.message || "Error cancelling premium membership" };
    }
};
