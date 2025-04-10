import React from "react";
import LeftSidebar from "../../Component/Leftsidebar/Leftsidebar";
import VideoCall from "../../Component/VideoCall/Videocall.js";

function VideoCallPage() {
  return (
    <div className="container_Pages_App">
      <LeftSidebar />
      <div style={{marginLeft: '20px',width:'100%'}}>
        <VideoCall />
      </div>
    </div>
  );
}

export default VideoCallPage;
