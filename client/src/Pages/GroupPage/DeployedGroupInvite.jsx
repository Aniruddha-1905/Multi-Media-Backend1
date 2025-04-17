import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { joinGroupViaInvite } from '../../action/deployedGroupActions';
import './GroupInvite.css';

const DeployedGroupInvite = () => {
  const { inviteLink } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentuser = useSelector(state => state.currentuserreducer);
  
  const [status, setStatus] = useState('loading'); // loading, joining, success, error
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    if (!currentuser?.result?._id) {
      setStatus('error');
      setError('You must be logged in to join a group');
      return;
    }

    // Auto-join the group when component mounts
    handleJoinGroup();
  }, [currentuser, inviteLink, dispatch, navigate]);

  const handleJoinGroup = async () => {
    try {
      setStatus('joining');
      setMessage('Joining group using deployed API...');

      console.log(`Attempting to join group with invite link: ${inviteLink} (deployed)`);
      const result = await dispatch(joinGroupViaInvite(inviteLink, navigate));
      
      if (result.error) {
        setStatus('error');
        setError(result.error);
      } else {
        setStatus('success');
        setMessage('Successfully joined the group! Redirecting...');
        
        // Redirect to the group page after a short delay
        setTimeout(() => {
          navigate(`/group/${result.group._id}`);
        }, 2000);
      }
    } catch (error) {
      setStatus('error');
      setError('An unexpected error occurred. Please try again.');
      console.error('Error joining group (deployed):', error);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <div className="loading-spinner"></div>;
      
      case 'joining':
        return (
          <>
            <div className="loading-spinner"></div>
            <p>{message}</p>
          </>
        );
      
      case 'success':
        return (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            <p>{message}</p>
          </div>
        );
      
      case 'error':
        return (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
            {!currentuser?.result?._id && (
              <button onClick={() => navigate('/auth')} className="login-button">
                Login to Join
              </button>
            )}
            <button onClick={() => navigate('/')} className="home-button">
              Go to Home
            </button>
          </div>
        );
      
      default:
        return <div className="loading-spinner"></div>;
    }
  };

  return (
    <div className="group-invite-container">
      <div className="group-invite-card">
        <h2>Group Invitation (Deployed)</h2>
        {renderContent()}
      </div>
    </div>
  );
};

export default DeployedGroupInvite;
