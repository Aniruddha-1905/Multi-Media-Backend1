import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useUser } from '@clerk/clerk-react';
import { createGroup } from '../../action/groupActions';
import * as api from '../../Api';
import './GroupPage.css';

const CreateGroup = () => {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useUser();

    // Test authentication when component mounts
    useEffect(() => {
        const testAuthentication = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('Profile'))?.token;
                if (!token) {
                    setError('You must be logged in to create a group');
                    return;
                }

                console.log('Testing authentication with token:', token);
                const { data } = await api.testAuth();
                console.log('Authentication test result:', data);
            } catch (error) {
                console.error('Authentication test failed:', error);
                setError('Authentication failed. Please log in again.');
            }
        };

        testAuthentication();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!groupName.trim() || !description.trim()) {
            setError('Group name and description are required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Get the auth token from localStorage
            const token = JSON.parse(localStorage.getItem('Profile'))?.token;
            if (!token) {
                setError('You must be logged in to create a group');
                setIsLoading(false);
                return;
            }

            console.log('Current user token:', token);
            console.log('Current user profile:', JSON.parse(localStorage.getItem('Profile')));

            const groupData = {
                name: groupName,
                description
            };

            console.log('Submitting group data:', groupData);

            // Dispatch the createGroup action
            const result = await dispatch(createGroup(groupData, navigate));
            console.log('Create group result:', result);

            if (result?.error) {
                console.error('Error from createGroup action:', result.error);
                setError(result.error);
                setIsLoading(false);
            }
            // If successful, the action will handle navigation
        } catch (error) {
            console.error('Exception in handleSubmit:', error);
            setIsLoading(false);
            setError('Failed to create group. Please try again.');
        }
    };

    return (
        <div className="create-group-container">
            <div className="create-group-card">
                <h2>Create a New Group</h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="groupName">Group Name</label>
                        <input
                            type="text"
                            id="groupName"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this group about?"
                            rows="4"
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate('/')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="create-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroup;
