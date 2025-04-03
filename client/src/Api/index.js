import axios from "axios"
const API=axios.create({baseURL:`http://localhost:5000/`})

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

// Group API functions
export const testAuth = () => API.get('/groups/test-auth');
export const createGroup = (groupData) => API.post('/groups/create', groupData);
export const getUserGroups = (userId) => API.get(`/groups/user/${userId}`);
export const getGroupById = (groupId) => API.get(`/groups/${groupId}`);
export const getGroupByInviteCode = (inviteCode) => API.get(`/groups/invite/${inviteCode}`);
export const joinGroup = (inviteLink) => API.post(`/groups/join/${inviteLink}`);
export const joinGroupById = (groupId) => API.post(`/groups/join/id/${groupId}`);
export const joinDirectWithInviteCode = (inviteCode) => API.get(`/groups/join-direct/${inviteCode}`);
export const leaveGroup = (groupId) => API.post(`/groups/leave/${groupId}`);
export const searchGroups = (searchTerm) => API.get(`/groups/search?q=${searchTerm}`);

// Message API functions
export const sendMessage = (groupId, messageBody) => API.post(`/groups/message/${groupId}`, { messageBody });
export const getMessages = (groupId) => API.get(`/groups/messages/${groupId}`);