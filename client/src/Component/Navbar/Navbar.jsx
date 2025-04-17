import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useClerk, useUser } from "@clerk/clerk-react";
import { jwtDecode } from "jwt-decode";
import { login } from "../../action/auth";
import { setcurrentuser } from "../../action/currentuser";
import logo from "./logo.ico";
import "./Navbar.css";
import { Link } from "react-router-dom";
import VideoCallButton from "../VideoCall/VideoCallButton";
import { IoMdNotificationsOutline } from "react-icons/io";
import { BiUserCircle } from "react-icons/bi";
import { FaUsers, FaSearch } from 'react-icons/fa'; // Group and Search Icons
import Searchbar from "./Searchbar/Searchbar";
import Auth from "../../Pages/Auth/Auth";
import { fetchGroups, searchGroups, joinGroup } from '../../action/groupActions';
import { joinGroupViaInvite } from '../../action/deployedGroupActions';


const Navbar = ({ toggledrawer, seteditcreatechanelbtn }) => {
  const [authbtn, setauthbtn] = useState(false);
  const [isGroupsOpen, setGroupsOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isJoiningViaLink, setIsJoiningViaLink] = useState(false);
  const [joinLinkError, setJoinLinkError] = useState('');


  const dispatch = useDispatch();
  const currentuser = useSelector((state) => state.currentuserreducer);
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const groups = useSelector(state => state.groups?.userGroups || []);
  const searchResults = useSelector(state => state.groups?.searchResults || []);

  useEffect(() => {
    if (currentuser?.result?._id) {
        dispatch(fetchGroups(currentuser.result._id));  // Fetch groups when user is logged in
    }
  }, [currentuser, dispatch]);

  // Load all groups when search panel is opened
  useEffect(() => {
    if (isSearchOpen && currentuser?.result?._id) {
      console.log('Search panel opened, loading all groups');
      setIsSearching(true);
      dispatch(searchGroups(' ')) // Send a space to get all groups
        .then((results) => {
          console.log('Initial search results loaded:', results);
          setIsSearching(false);
        })
        .catch(err => {
          console.error('Error loading initial search results:', err);
          setIsSearching(false);
        });
    }
  }, [isSearchOpen, currentuser, dispatch]);

  useEffect(() => {
    if (user) {
      const userEmail = user.primaryEmailAddress.emailAddress;
      dispatch(login({ email: userEmail }));
    }
  }, [user, dispatch]);

  const logout = useCallback(() => {
    dispatch(setcurrentuser(null));
    localStorage.clear();
  }, [dispatch]);

  useEffect(() => {
    const token = currentuser?.token;
    if (token) {
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < new Date().getTime()) {
        logout();
      }
    }
    const storedProfile = localStorage.getItem("Profile");
    if (storedProfile) {
      dispatch(setcurrentuser(JSON.parse(storedProfile)));
    }
  }, [currentuser?.token, dispatch, logout]);

  // Create a ref for the search timeout
  const searchTimeoutRef = React.useRef(null);

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);

    // Auto-search after typing (debounced)
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to search after 300ms of no typing
    searchTimeoutRef.current = setTimeout(() => {
      // Always search, even with empty query to show all groups
      console.log(`Initiating search for: "${e.target.value}"`);
      setIsSearching(true);

      // Use try/catch to handle any errors
      try {
        dispatch(searchGroups(e.target.value || ' ')) // Send a space if empty to trigger search
          .then((results) => {
            console.log('Search results received:', results);
            setIsSearching(false);
          })
          .catch(err => {
            console.error('Search error:', err);
            setIsSearching(false);
          });
      } catch (error) {
        console.error('Unexpected error in search:', error);
        setIsSearching(false);
      }
    }, 300);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Always search, even with empty query to show all groups
    setIsSearching(true);
    try {
      dispatch(searchGroups(searchQuery || ' ')) // Send a space if empty
        .then(results => {
          console.log('Search form submission results:', results);
          setIsSearching(false);
        })
        .catch(error => {
          console.error('Error in search form submission:', error);
          setIsSearching(false);
        });
    } catch (error) {
      console.error('Unexpected error in search form submission:', error);
      setIsSearching(false);
    }
  };

  // Handle clicking on a search result
  const handleJoinGroup = (group) => {
    try {
      console.log(`Joining group: ${group._id}`);
      // Use the joinGroup action with the group's invite link
      dispatch(joinGroup(group.inviteLink))
        .then(result => {
          if (result.error) {
            alert(`Failed to join group: ${result.error}`);
          } else {
            alert(`Successfully joined ${group.name}!`);
            // Refresh the user's groups
            if (currentuser?.result?._id) {
              dispatch(fetchGroups(currentuser.result._id));
            }
            // Close the search dropdown after joining
            setSearchOpen(false);
            setSearchQuery('');
          }
        })
        .catch(error => {
          console.error('Error joining group:', error);
          alert('An error occurred while trying to join the group.');
        });
    } catch (error) {
      console.error('Unexpected error joining group:', error);
      alert('An error occurred while trying to join the group.');
    }
  };

  // Handle joining a group via invite link
  const handleJoinViaLink = (e) => {
    e.preventDefault();

    if (!inviteLink.trim()) {
      setJoinLinkError('Please enter an invite link');
      return;
    }

    // Extract just the invite code if the user pasted a full URL
    let linkCode = inviteLink.trim();
    let isDeployedLink = false;

    // Check if it's a deployed link
    if (linkCode.includes('peppy-belekoy-71b433.netlify.app')) {
      isDeployedLink = true;
    }

    // Extract the invite code from the URL
    if (linkCode.includes('/join/')) {
      linkCode = linkCode.split('/join/')[1];
    } else if (linkCode.includes('/join-deployed/')) {
      linkCode = linkCode.split('/join-deployed/')[1];
      isDeployedLink = true;
    }

    setIsJoiningViaLink(true);
    setJoinLinkError('');

    try {
      console.log(`Joining group via invite link: ${linkCode} (Deployed: ${isDeployedLink})`);

      // Use the appropriate action based on whether it's a deployed link or not
      const joinAction = isDeployedLink ? joinGroupViaInvite : joinGroup;

      dispatch(joinAction(linkCode))
        .then(result => {
          setIsJoiningViaLink(false);

          if (result.error) {
            setJoinLinkError(`Failed to join group: ${result.error}`);

            // If local API fails, try the deployed API as a fallback
            if (!isDeployedLink) {
              console.log('Local API failed, trying deployed API as fallback...');
              setIsJoiningViaLink(true);

              dispatch(joinGroupViaInvite(linkCode))
                .then(deployedResult => {
                  setIsJoiningViaLink(false);

                  if (deployedResult.error) {
                    setJoinLinkError(`Failed to join group (both APIs): ${deployedResult.error}`);
                  } else {
                    // Success with deployed API
                    setInviteLink('');
                    setJoinLinkError('');
                    if (currentuser?.result?._id) {
                      dispatch(fetchGroups(currentuser.result._id));
                    }
                    alert('Successfully joined the group using deployed API!');
                  }
                })
                .catch(error => {
                  console.error('Error joining group via deployed API:', error);
                  setIsJoiningViaLink(false);
                  setJoinLinkError('Failed with both local and deployed APIs.');
                });
            }
          } else {
            // Success - clear the input and refresh groups
            setInviteLink('');
            setJoinLinkError('');
            if (currentuser?.result?._id) {
              dispatch(fetchGroups(currentuser.result._id));
            }
            // Show success message
            alert(`Successfully joined the group using ${isDeployedLink ? 'deployed' : 'local'} API!`);
          }
        })
        .catch(error => {
          console.error(`Error joining group via ${isDeployedLink ? 'deployed' : 'local'} link:`, error);
          setIsJoiningViaLink(false);

          // If local API fails with an exception, try the deployed API as a fallback
          if (!isDeployedLink) {
            console.log('Local API threw exception, trying deployed API as fallback...');
            setIsJoiningViaLink(true);

            dispatch(joinGroupViaInvite(linkCode))
              .then(deployedResult => {
                setIsJoiningViaLink(false);

                if (deployedResult.error) {
                  setJoinLinkError(`Failed to join group (both APIs): ${deployedResult.error}`);
                } else {
                  // Success with deployed API
                  setInviteLink('');
                  setJoinLinkError('');
                  if (currentuser?.result?._id) {
                    dispatch(fetchGroups(currentuser.result._id));
                  }
                  alert('Successfully joined the group using deployed API!');
                }
              })
              .catch(deployedError => {
                console.error('Error joining group via deployed API:', deployedError);
                setIsJoiningViaLink(false);
                setJoinLinkError('Failed with both local and deployed APIs.');
              });
          } else {
            setJoinLinkError('An error occurred while trying to join the group.');
          }
        });
    } catch (error) {
      console.error('Unexpected error in handleJoinViaLink:', error);
      setIsJoiningViaLink(false);
      setJoinLinkError('An unexpected error occurred.');
    }
  };

  return (
    <>
      <div className="Container_Navbar">
        <div className="Burger_Logo_Navbar">
          <div className="burger" onClick={toggledrawer}>
            <p></p>
            <p></p>
            <p></p>
          </div>
          <div className="navbar">
            <Link to="/" className="nav-link">Home</Link>
          </div>
          <Link to="/" className="logo_div_Navbar">
            <img src={logo} alt="Your-Tube Logo" />
            <p className="logo_title_navbar">Your-Tube</p>
          </Link>
        </div>
        <Searchbar />
        <div className="groups-icon" onClick={() => setGroupsOpen(!isGroupsOpen)}>
          <FaUsers
            className="group-icon"
            title="Group Chat"
          />
          <span className="group-text">Group Chat</span>
          {isGroupsOpen && (
            <div className="groups-list" onClick={(e) => e.stopPropagation()}>
              <div className="groups-header">
                <h3>Your Groups</h3>
                <div className="group-actions">
                  <button
                    className="search-group-btn"
                    onClick={() => {
                      const newState = !isSearchOpen;
                      setSearchOpen(newState);
                      // If opening the search panel, load all groups immediately
                      if (newState) {
                        setIsSearching(true);
                        dispatch(searchGroups(' '))
                          .then(() => setIsSearching(false))
                          .catch(() => setIsSearching(false));
                      }
                    }}
                    title="Search Groups"
                  >
                    <FaSearch />
                  </button>

                  <Link to="/create-group" className="create-group-btn">+ New Group</Link>
                </div>
              </div>
              {isSearchOpen && (
                <div className="group-search" onClick={(e) => e.stopPropagation()}>
                  <form onSubmit={handleSearchSubmit} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      placeholder="Search for groups..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      autoFocus
                      className="search-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="submit"
                      className="search-btn"
                      disabled={isSearching}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSearchSubmit(e);
                      }}
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </form>
                  {isSearching ? (
                    <div className="search-loading">Searching...</div>
                  ) : searchResults && searchResults.length > 0 ? (
                    <div className="search-results">
                      <div className="search-results-header">
                        Found {searchResults.length} group(s) {searchQuery.trim() ? `matching "${searchQuery}"` : ''}
                      </div>
                      {searchResults.map((group) => (
                        <div key={group._id} className="search-result-item">
                          <div className="search-result-info">
                            <span className="search-result-name">{group.name}</span>
                            <span className="search-result-desc">{group.description}</span>
                            <span className="search-result-members">{group.memberCount || 0} member(s)</span>
                            {group.isMember && (
                              <span className="member-badge">You are a member</span>
                            )}
                          </div>
                          {group.isMember ? (
                            <Link to={`/group/${group._id}`} className="view-group-btn">
                              View
                            </Link>
                          ) : (
                            <button
                              className="join-group-btn"
                              onClick={() => handleJoinGroup(group)}
                            >
                              Join
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Invite link input section */}
              <div className="group-invite-section" onClick={(e) => e.stopPropagation()}>
                <h4>Join via Invite Link</h4>
                <form onSubmit={handleJoinViaLink} className="invite-link-form">
                  <input
                    type="text"
                    placeholder="Paste invite link or code..."
                    value={inviteLink}
                    onChange={(e) => {
                      setInviteLink(e.target.value);
                      if (joinLinkError) setJoinLinkError('');
                    }}
                    className="invite-link-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="submit"
                    className="join-link-btn"
                    disabled={isJoiningViaLink}
                  >
                    {isJoiningViaLink ? 'Joining...' : 'Join'}
                  </button>
                </form>
                {joinLinkError && (
                  <div className="invite-link-error">{joinLinkError}</div>
                )}
              </div>
              {groups.length > 0 ? (
                groups.map((group) => (
                  <Link key={group._id} to={`/group/${group._id}`} className="group-item">
                    <FaUsers className="group-item-icon" />
                    <span>{group.name}</span>
                  </Link>
                ))
              ) : (
                <div className="no-groups">No groups yet. Create one!</div>
              )}
            </div>
          )}
        </div>
        <VideoCallButton />
        <div className="apps_Box">
          {Array.from({ length: 9 }).map((_, index) => (
            <p key={index} className="appBox"></p>
          ))}
        </div>
        <IoMdNotificationsOutline size={22} className="vid_bell_Navbar" />
        <div className="Auth_cont_Navbar">
          {currentuser?.result ? (
            <div className="Chanel_logo_App" onClick={() => setauthbtn(true)}>
              <p className="fstChar_logo_App">
                {currentuser.result.name
                  ? currentuser.result.name.charAt(0).toUpperCase()
                  : currentuser.result.email.charAt(0).toUpperCase()}
              </p>
            </div>
          ) : (
            <p className="Auth_Btn" onClick={() => openSignIn()}>
              <BiUserCircle size={22} />
              <b>Sign in</b>
            </p>
          )}
        </div>
      </div>
      {authbtn && (
        <Auth
          seteditcreatechanelbtn={seteditcreatechanelbtn}
          setauthbtn={setauthbtn}
          user={currentuser}
        />
      )}

    </>
  );
};

export default Navbar;