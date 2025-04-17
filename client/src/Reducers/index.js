import {combineReducers} from "redux";
import authreducer from "./auth";
import currentuserreducer from "./currentuser";
import chanelreducer from "./chanel";
import videoreducer from "./video";
import commentreducer from "./comment";
import historyreducer from "./history";
import likedvideoreducer from "./likedvideo";
import watchlaterreducer from "./watchlater";
import downloadedvideoreducer from "./downloadedvideo";
import groups from "./groupsReducer";
import messages from "./messagesReducer";
import subscription from "./subscriptionReducer";

export default combineReducers({
    authreducer,
    currentuserreducer,
    videoreducer,
    chanelreducer,
    commentreducer,
    historyreducer,
    likedvideoreducer,
    watchlaterreducer,
    downloadedvideoreducer,
    groups,
    messages,
    subscription
});
