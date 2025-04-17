import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiVideoAddLine } from "react-icons/ri";
import './VideoCallButton.css';

const VideoCallButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  // Generate a random room ID
  const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // Handle creating a new call
  const handleCreateCall = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    navigate(`/voip/${newRoomId}`);
  };

  // Handle joining an existing call
  const handleJoinCall = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/voip/${roomId}`);
    }
  };

  // Toggle the modal
  const toggleModal = () => {
    setShowModal(!showModal);
    setRoomId('');
  };

  return (
    <>
      <div className="video-call-button-wrapper">
        <RiVideoAddLine size={22} className="vid_bell_Navbar" onClick={toggleModal} />
        <span className="video-call-tooltip">Start or join a video call</span>
      </div>

      {showModal && (
        <div className="video-call-modal-overlay">
          <div className="video-call-modal">
            <div className="video-call-modal-header">
              <h3>Start a Video Call</h3>
              <button className="close-button" onClick={toggleModal}>×</button>
            </div>
            <div className="video-call-modal-body">
              <div className="video-call-option" onClick={handleCreateCall}>
                <RiVideoAddLine size={24} />
                <span>Create a new video call</span>
              </div>
              <div className="video-call-divider">OR</div>
              <form onSubmit={handleJoinCall}>
                <div className="video-call-join-form">
                  <input
                    type="text"
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    required
                  />
                  <button type="submit" className="join-button">Join Call</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoCallButton;
