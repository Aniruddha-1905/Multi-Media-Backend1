import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VOIPButton.css';

const VOIPButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const navigate = useNavigate();

  // Generate a random room ID
  const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // Handle creating a new call
  const handleCreateCall = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setIsCreatingRoom(true);
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
    setIsCreatingRoom(false);
  };

  return (
    <>
      <button className="voip-button" onClick={toggleModal}>
        <i className="fas fa-phone"></i> Voice Call
        <span className="voip-tooltip">Start or join an audio-only call</span>
      </button>

      {showModal && (
        <div className="voip-modal-overlay">
          <div className="voip-modal">
            <div className="voip-modal-header">
              <h3>Start a Voice Call</h3>
              <button className="close-button" onClick={toggleModal}>×</button>
            </div>
            <div className="voip-modal-body">
              <div className="voip-option" onClick={handleCreateCall}>
                <i className="fas fa-plus-circle"></i>
                <span>Create a new call</span>
              </div>
              <div className="voip-divider">OR</div>
              <form onSubmit={handleJoinCall}>
                <div className="voip-join-form">
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

export default VOIPButton;
