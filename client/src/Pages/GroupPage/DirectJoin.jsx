import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { joinGroup } from '../../action/groupActions';
import * as api from '../../Api';
import './GroupPage.css';

const DirectJoin = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [groupInfo, setGroupInfo] = useState(null);
    const [joining, setJoining] = useState(false);
    
    // Automatically attempt to join when component mounts
    useEffect(() => {
        const fetchAndJoin = async () => {
            try {
                setIsLoading(true);
                
                // First, get the group info
                const { data } = await api.getGroupByInviteCode(inviteCode);
                setGroupInfo(data);
                
                // Then automatically try to join
                setJoining(true);
                const result = await dispatch(joinGroup(inviteCode, navigate));
                
                if (result?.error) {
                    // If there's an error (like already a member), show it
                    setError(result.error);
                    setJoining(false);
                    setIsLoading(false);
                }
                // If successful, the action will handle navigation to the group page
                
            } catch (error) {
                console.error('Error joining group:', error);
                setError('Failed to join group. Please try again.');
                setIsLoading(false);
                setJoining(false);
            }
        };
        
        if (inviteCode) {
            fetchAndJoin();
        }
    }, [inviteCode, dispatch, navigate]);
    
    const handleManualJoin = async () => {
        try {
            setJoining(true);
            const result = await dispatch(joinGroup(inviteCode, navigate));
            
            if (result?.error) {
                setError(result.error);
                setJoining(false);
            }
            // If successful, the action will handle navigation
        } catch (error) {
            console.error('Error joining group:', error);
            setError('Failed to join group. Please try again.');
            setJoining(false);
        }
    };
    
    if (isLoading || joining) {
        return (
            <div className="invite-container">
                <div className="invite-card">
                    <div className="loading-spinner"></div>
                    <p>{joining ? 'Joining group...' : 'Loading group information...'}</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="invite-container">
                <div className="invite-card error">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <div className="invite-actions">
                        <button onClick={handleManualJoin} className="join-button">
                            Try Again
                        </button>
                        <button onClick={() => navigate('/')} className="back-button">
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="invite-container">
            <div className="invite-card">
                <h2>Joining Group...</h2>
                {groupInfo && (
                    <div className="group-preview">
                        <h3>{groupInfo.name}</h3>
                        <p className="group-description">{groupInfo.description}</p>
                        <p className="member-count">{groupInfo.members.length} members</p>
                    </div>
                )}
                <div className="loading-spinner"></div>
                <p>Please wait while we add you to the group...</p>
            </div>
        </div>
    );
};

export default DirectJoin;
