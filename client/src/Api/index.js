import axios from "axios"
const API=axios.create({baseURL:`https://multi-media-backend1.onrender.com/`})

API.interceptors.request.use((req)=>{
    if(localStorage.getItem("Profile")){
        req.headers.Authorization=`Bearer ${JSON.parse(localStorage.getItem("Profile")).token}`
    }
    return req;
})


export const login=(authdata)=>API.post("/user/login",authdata);
export const updatechaneldata=(id,updatedata)=>API.patch(`/user/update/${id}`,updatedata)
export const fetchallchannel=()=>API.get("/user/getallchannel");

export const uploadvideo=(filedata,fileoption)=>API.post("/video/uploadvideo",filedata,fileoption)
export const getvideos=()=>API.get("/video/getvideos");
export const likevideo=(id,Like)=>API.patch(`/video/like/${id}`,{Like});
export const viewsvideo=(id)=>API.patch(`/video/view/${id}`);

export const postcomment=(commentdata)=>API.post('/comment/post',commentdata)
export const deletecomment=(id)=>API.delete(`/comment/delete/${id}`)
export const editcomment=(id,commentbody)=>API.patch(`/comment/edit/${id}`,{commentbody})
export const getallcomment=()=>API.get('/comment/get')
export const likeComment = (id) => API.patch(`/comment/like/${id}`)
export const dislikeComment = (id) => API.patch(`/comment/dislike/${id}`)

export const addtohistory=(historydata)=>API.post("/video/history",historydata)
export const getallhistory=()=>API.get('/video/getallhistory')
export const deletehistory=(userid)=>API.delete(`/video/deletehistory/${userid}`)

export const addtolikevideo=(likedvideodata)=>API.post('/video/likevideo',likedvideodata)
export const getalllikedvideo=()=>API.get('/video/getalllikevide')
export const deletelikedvideo=(videoid,viewer)=>API.delete(`/video/deletelikevideo/${videoid}/${viewer}`)

export const addtowatchlater=(watchlaterdata)=>API.post('/video/watchlater',watchlaterdata)
export const getallwatchlater=()=>API.get('/video/getallwatchlater')
export const deletewatchlater=(videoid,viewer)=>API.delete(`/video/deletewatchlater/${videoid}/${viewer}`)

// Download API functions
export const checkDownloadEligibility=()=>API.get('/download/check-eligibility')
export const downloadVideo=(videoid)=>API.post(`/download/video/${videoid}`)
export const getUserDownloadedVideos=()=>API.get('/download/user-videos')
export const upgradeToPremium=()=>API.post('/download/upgrade-premium')
export const cancelPremium=()=>API.post('/download/cancel-premium')

// Subscription API functions
export const getSubscriptionPlans = () => API.get('/subscription/plans');
export const getCurrentSubscription = () => API.get('/subscription/current');
export const subscribeToPlan = (planId, paymentId) => API.post('/subscription/subscribe', { planId, paymentId });
export const cancelSubscription = () => API.post('/subscription/cancel');
export const checkWatchTimeEligibility = () => API.get('/subscription/check-watch-time');
export const updateWatchTimeStatus = (limitReached) => API.post('/subscription/update-watch-time-status', { limitReached });

// Group API functions
export const testAuth = () => API.get('/groups/test-auth');
export const createGroup = (groupData) => API.post('/groups/create', groupData);
export const getUserGroups = (userId) => API.get(`/groups/user/${userId}`);
export const getGroupById = (groupId) => API.get(`/groups/${groupId}`);
export const joinGroup = (inviteLink) => API.post(`/groups/join/${inviteLink}`);
export const leaveGroup = (groupId) => API.post(`/groups/leave/${groupId}`);
export const searchGroups = async (query) => {
    try {
        // Use a timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await API.get(`/groups/search?q=${encodeURIComponent(query || ' ')}`, {
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

// Message API functions
export const sendMessage = (groupId, messageBody) => API.post(`/groups/message/${groupId}`, { messageBody });
export const getMessages = (groupId) => API.get(`/groups/messages/${groupId}`);