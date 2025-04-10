import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { joinGroup } from '../../action/groupActions';
import * as api from '../../Api';
import './GroupPage.css';

const SearchGroup = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Search for groups when the search term changes
    useEffect(() => {
        const searchGroups = async () => {
            if (!searchTerm.trim()) {
                setSearchResults([]);
                return;
            }

            setIsLoading(true);
            setError('');

            try {
                const { data } = await api.searchGroups(searchTerm);
                setSearchResults(data);
            } catch (error) {
                console.error('Error searching groups:', error);
                setError('Failed to search groups. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce search to avoid too many API calls
        const timeoutId = setTimeout(() => {
            searchGroups();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleJoinGroup = async (groupId) => {
        try {
            await dispatch(joinGroup(groupId, navigate));
        } catch (error) {
            console.error('Error joining group:', error);
            setError('Failed to join group. Please try again.');
        }
    };

    return (
        <div className="search-group-container">
            <div className="search-group-card">
                <h2>Search Groups</h2>
                
                <div className="search-input-container">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for groups..."
                        className="search-input"
                    />
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <div className="search-results">
                    {isLoading ? (
                        <div className="loading-message">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        <ul className="group-list">
                            {searchResults.map(group => (
                                <li key={group._id} className="group-item">
                                    <div className="group-info">
                                        <h3>{group.name}</h3>
                                        <p>{group.description}</p>
                                        <p className="member-count">{group.members.length} members</p>
                                    </div>
                                    <button 
                                        className="join-button"
                                        onClick={() => handleJoinGroup(group._id)}
                                    >
                                        Join
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : searchTerm.trim() ? (
                        <div className="no-results">No groups found matching "{searchTerm}"</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default SearchGroup;
