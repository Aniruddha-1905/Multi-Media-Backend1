import React,{useEffect, useState} from 'react'
import {BsThreeDots} from "react-icons/bs"
import {AiFillDislike,AiFillLike,AiOutlineDislike,AiOutlineLike} from"react-icons/ai"
import {MdPlaylistAddCheck, MdFileDownload, MdOutlineFileDownload} from "react-icons/md"
import {RiHeartAddFill,RiPlayListAddFill,RiShareForwardLine, RiVipCrownLine} from "react-icons/ri"
import "./Likewatchlatersavebtn.css"
import { useSelector,useDispatch } from 'react-redux'
import { likevideo } from '../../action/video'
import {addtolikedvideo,deletelikedvideo} from "../../action/likedvideo"
import { addtowatchlater,deletewatchlater } from '../../action/watchlater'
import { checkDownloadEligibility, downloadVideo, upgradeToPremium } from '../../action/downloadedvideo'

const Likewatchlatersavebtns = ({vv,vid}) => {
  const dispatch=useDispatch()
  const [savevideo,setsavevideo]=useState(false)
  const [dislikebtn,setdislikebtn]=useState(false)
  const [likebtn,setlikebtn]=useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [downloadEligibility, setDownloadEligibility] = useState(null)

  const currentuser=useSelector(state => state.currentuserreducer);
  const likedvideolist=useSelector((state)=>state.likedvideoreducer)
  const watchlaterlist=useSelector((s)=>s.watchlaterreducer)
  const downloadedVideos=useSelector((s)=>s.downloadedvideoreducer)
  useEffect(()=>{
    if (currentuser?.result?._id) {
      likedvideolist?.data.filter(
        (q)=>q.videoid ===vid && q.viewer ===currentuser.result._id
      )
      .map((m)=>setlikebtn(true));
      watchlaterlist?.data.filter(
        (q)=>q.videoid ===vid && q.viewer ===currentuser.result._id
      )
      .map((m)=>setsavevideo(true));

      // Check download eligibility
      checkUserDownloadEligibility();
    }
  }, [currentuser]);
const togglesavedvideo=()=>{
  if(currentuser){
      if(savevideo){
        setsavevideo(false);
        dispatch(deletewatchlater({videoid:vid,viewer:currentuser?.result?._id}))
      }else{
        setsavevideo(true);
        dispatch(addtowatchlater({videoid:vid,viewer:currentuser?.result?._id}))
      }
  }else{
    alert("please login to save video")
  }
}
// console.log(vid,vv.Like)
const togglelikevideo=(e,lk)=>{
  if(currentuser){
      if(likebtn){
        setlikebtn(false);

        dispatch(likevideo({id:vid,Like:lk-1}))
        dispatch(deletelikedvideo({videoid:vid,viewer:currentuser?.result?._id}))
      }else{
        setlikebtn(true);
        dispatch(likevideo({id:vid,Like:lk+1}))
        dispatch(addtolikedvideo({videoid:vid,viewer:currentuser?.result?._id}))
        setdislikebtn(false)
      }
  }else{
    alert("please login to save video")
  }
}
const toggledislikevideo=(e,lk)=>{
  if(currentuser){
      if(dislikebtn){
        setdislikebtn(false);
      }else{
        setdislikebtn(true);
        if(likebtn){
          dispatch(likevideo({id:vid,Like:lk-1}))
          dispatch(deletelikedvideo({videoid:vid,viewer:currentuser?.result?._id}))
        }
        setlikebtn(false)
      }
  }else{
    alert("please login to save video")
  }
}

// Check if user can download videos
const checkUserDownloadEligibility = async () => {
  if (currentuser?.result?._id) {
    try {
      const eligibility = await dispatch(checkDownloadEligibility());
      setDownloadEligibility(eligibility);
    } catch (error) {
      console.error('Error checking download eligibility:', error);
    }
  }
};

// Handle video download
const handleDownload = async () => {
  if (!currentuser?.result?._id) {
    alert("Please login to download videos");
    return;
  }

  // Check eligibility first
  const eligibility = await dispatch(checkDownloadEligibility());
  setDownloadEligibility(eligibility);

  if (eligibility.canDownload) {
    setDownloading(true);
    try {
      const result = await dispatch(downloadVideo(vid));

      if (result.success) {
        // Create a temporary link to download the video
        const link = document.createElement('a');
        link.href = `http://localhost:5000/${result.videoPath}`;
        link.download = result.videoTitle || 'video';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert("Video added to your downloads!");
      } else {
        alert(result.message || "Error downloading video");
      }
    } catch (error) {
      console.error('Error downloading video:', error);
      alert("Error downloading video");
    } finally {
      setDownloading(false);
    }
  } else {
    // Show premium upgrade modal
    setShowPremiumModal(true);
  }
};

// Handle premium upgrade
const handleUpgradeToPremium = async () => {
  if (!currentuser?.result?._id) {
    alert("Please login to upgrade to premium");
    return;
  }

  try {
    const result = await dispatch(upgradeToPremium());

    if (result.success) {
      alert("Successfully upgraded to premium! You can now download unlimited videos.");
      setShowPremiumModal(false);
      checkUserDownloadEligibility();
    } else {
      alert(result.message || "Error upgrading to premium");
    }
  } catch (error) {
    console.error('Error upgrading to premium:', error);
    alert("Error upgrading to premium");
  }
}
  return (
    <>
      {showPremiumModal && (
        <div className="premium-modal-overlay" onClick={() => setShowPremiumModal(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upgrade to Premium</h2>
            <p>You've reached your daily download limit.</p>
            <p>Upgrade to premium to download unlimited videos!</p>
            <div className="premium-features">
              <div className="premium-feature">
                <RiVipCrownLine size={24} />
                <span>Unlimited video downloads</span>
              </div>
              <div className="premium-feature">
                <MdFileDownload size={24} />
                <span>Download in high quality</span>
              </div>
            </div>
            <div className="premium-buttons">
              <button className="premium-upgrade-btn" onClick={handleUpgradeToPremium}>
                Upgrade Now
              </button>
              <button className="premium-cancel-btn" onClick={() => setShowPremiumModal(false)}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="btns_cont_videoPage">
        <div className="btn_VideoPage">
          <BsThreeDots/>
        </div>
      <div className="btn_VideoPage">
        <div className="like_videoPage" onClick={(e)=>togglelikevideo(e,vv.Like)}>
          {likebtn? (
            <>
            <AiFillLike size={22} className='btns_videoPage'/>
            </>
          ):(
            <>
            <AiOutlineLike size={22} className='btns_videoPage' />
            </>
          )}
          <b>{vv.Like}</b>
        </div>
        <div className="like_videoPage" onClick={(e)=>toggledislikevideo(e,vv.Like)}>
          {dislikebtn?(<>
            <AiFillDislike size={22} className='btns_videoPage'/>
          </>):(
            <>
              <AiOutlineDislike size={22} className='btns_videoPage'/>
            </>
          )}
          <b>DISLIKE</b>
        </div>
        <div className="like_videoPage" onClick={(e)=>togglesavedvideo(e)}>
          {savevideo?(<>
            <MdPlaylistAddCheck size={22} className='btns_videoPage'/>
            <b>Saved</b>
          </>):(
            <>
              <RiPlayListAddFill size={22} className='btns_videoPage'/>
              <b>Save</b>
            </>
          )}
        </div>
        <div className="like_videoPage">
          <>
            <RiHeartAddFill size={22} className="btns_videoPage" />
            <b>Thanks</b>
          </>
        </div>
        <div className="like_videoPage" onClick={handleDownload}>
          <>
            {downloading ? (
              <>
                <div className="download-spinner"></div>
                <b>Downloading...</b>
              </>
            ) : (
              <>
                <MdFileDownload size={22} className='btns_videoPage'/>
                <b>Download</b>
              </>
            )}
          </>
        </div>
        <div className="like_videoPage">
          <>
          <RiShareForwardLine size={22} className='btns_videoPage'/>
          <b>Share</b>
          </>
        </div>
      </div>
    </div>
    </>
  )
}

export default Likewatchlatersavebtns