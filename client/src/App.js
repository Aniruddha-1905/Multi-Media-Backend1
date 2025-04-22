// import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from "react";
import Navbar from './Component/Navbar/Navbar';
import { useDispatch, useSelector } from 'react-redux';
import Allroutes from "./Allroutes";
import { BrowserRouter as Router } from 'react-router-dom';
import Drawersliderbar from './Component/Leftsidebar/Drawersliderbar';
import Createeditchannel from './Pages/Channel/Createeditchannel';
import Videoupload from './Pages/Videoupload/Videoupload';
import MobileMenu from './Component/MobileMenu/MobileMenu';
import { useClerk } from '@clerk/clerk-react';

import { fetchallchannel } from './action/channeluser';
import { getallvideo } from './action/video';
import { getallcomment } from './action/comment';
import { getallhistory } from './action/history';
import { getalllikedvideo } from './action/likedvideo';
import { getallwatchlater } from './action/watchlater';

function App() {
  const [toggledrawersidebar, settogledrawersidebar] = useState({
    display: "none"
  });
  const [editcreatechanelbtn, seteditcreatechanelbtn] = useState(false);
  const [videouploadpage, setvideouploadpage] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchallchannel());
    dispatch(getallvideo());
    dispatch(getallcomment());
    dispatch(getallhistory());
    dispatch(getalllikedvideo());
    dispatch(getallwatchlater());
  }, [dispatch]);

  const toggledrawer = () => {
    if (toggledrawersidebar.display === "none") {
      settogledrawersidebar({
        display: "flex",
      });
    } else {
      settogledrawersidebar({
        display: "none",
      });
    }
  };



  const currentUser = useSelector(state => state.currentuserreducer);
  const { openSignIn } = useClerk();

  return (
    <Router>
      {videouploadpage && <Videoupload setvideouploadpage={setvideouploadpage} />}
      {editcreatechanelbtn && (
        <Createeditchannel seteditcreatechanelbtn={seteditcreatechanelbtn} />
      )}

      <Navbar seteditcreatechanelbtn={seteditcreatechanelbtn} toggledrawer={toggledrawer} />
      <Drawersliderbar toggledraw={toggledrawer} toggledrawersidebar={toggledrawersidebar} />
      <Allroutes seteditcreatechanelbtn={seteditcreatechanelbtn} setvideouploadpage={setvideouploadpage} />
      <MobileMenu currentUser={currentUser} openSignIn={openSignIn} />
    </Router>
  );
}

export default App;