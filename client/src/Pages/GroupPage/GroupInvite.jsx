import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { joinGroup } from '../../action/groupActions';
import * as api from '../../Api';
import './GroupPage.css';

const GroupInvite = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [groupInfo, setGroupInfo] = useState(null);
    
    useEffect(() => {
        const fetchGroupInfo = async () => {
            try {
                setIsLoading(true);
                const { data } = await api.getGroupByInviteCode(inviteCode);
                setGroupInfo(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching group info:', error);
                setError('Invalid or expired invite link');
                setIsLoading(false);
            }
        };
        
        if (inviteCode) {
            fetchGroupInfo();
        }
    }, [inviteCode]);
    
    const handleJoinGroup = async () => {
        try {
            setIsLoading(true);
            const result = await dispatch(joinGroup(inviteCode, navigate));
            
            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
            }
            // If successful, the action will handle navigation to the group page
        } catch (error) {
            console.error('Error joining group:', error);
            setError('Failed to join group. Please try again.');
            setIsLoading(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="invite-container">
                <div className="invite-card">
                    <div className="loading-spinner"></div>
                    <p>Loading group information...</p>
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
                    <button onClick={() => navigate('/')} className="back-button">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="invite-container">
            <div className="invite-card">
                <h2>Group Invitation</h2>
                {groupInfo && (
                    <div className="group-preview">
                        <h3>{groupInfo.name}</h3>
                        <p className="group-description">{groupInfo.description}</p>
                        <p className="member-count">{groupInfo.members.length} members</p>
                    </div>
                )}
                <div className="invite-actions">
                    <button onClick={handleJoinGroup} className="join-button">
                        Join Group
                    </button>
                    <button onClick={() => navigate('/')} className="cancel-button">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupInvite;
