import React from 'react'
import './Describechannel.css'
import {FaEdit,FaUpload} from "react-icons/fa"
import { useSelector } from 'react-redux'
const Describechannel = ({setvideouploadpage,cid,seteditcreatechanelbtn}) => {
  // const channel=[
  //   {
  //       _id:1,
  //       name:"abcjabsc",
  //       email:"abcd@gmail.com",
  //       joinedon:"222-07-134",
  //       desc:"bithead"
  //   }
  // ]
const channel = useSelector(state => state.chanelreducer || [])

// Add null check to handle case when channel is undefined or empty
const currentchannel = Array.isArray(channel) ? channel.filter((c) => c?._id === cid)[0] : undefined
const currentuser = useSelector(state => state.currentuserreducer);
// console.log('Current channel:', currentchannel)
  return (
    <div className="container3_chanel">
      <div className="chanel_logo_chanel">
        <b>{currentchannel?.name ? currentchannel.name.charAt(0).toUpperCase() : '?'}</b>
      </div>
      <div className="description_chanel">
        <b>{currentchannel?.name || 'Unknown Channel'}</b>
        <p>{currentchannel?.desc || 'No description available'}</p>
      </div>
      {currentuser?.result?._id && currentchannel?._id && currentuser.result._id === currentchannel._id && (
        <>
        <p className="editbtn_chanel" onClick={()=>seteditcreatechanelbtn(true)}>
          <FaEdit/>
          <b>Edit Channel</b>
        </p>
        <p className="uploadbtn_chanel" onClick={()=>setvideouploadpage(true)}>
          <FaUpload/>
          <b>Upload Video</b>
        </p>
        </>
      )}
    </div>
  )
}

export default Describechannel