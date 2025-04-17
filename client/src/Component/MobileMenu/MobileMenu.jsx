import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaUsers, FaVideo, FaSearch, FaUser } from 'react-icons/fa';
import './MobileMenu.css';

const MobileMenu = ({ currentUser, openSignIn }) => {
  return (
    <div className="mobile-menu">
      <Link to="/" className="mobile-menu-item">
        <FaHome />
        <span>Home</span>
      </Link>

      <Link to="/search" className="mobile-menu-item">
        <FaSearch />
        <span>Search</span>
      </Link>

      <Link to="/groups" className="mobile-menu-item">
        <FaUsers />
        <span>Groups</span>
      </Link>

      <Link to="/voip/new" className="mobile-menu-item video-call-mobile">
        <FaVideo />
        <span>Video Call</span>
      </Link>

      {currentUser ? (
        <Link to="/profile" className="mobile-menu-item">
          <div className="mobile-avatar">
            {currentUser.result.name
              ? currentUser.result.name.charAt(0).toUpperCase()
              : currentUser.result.email.charAt(0).toUpperCase()}
          </div>
          <span>Profile</span>
        </Link>
      ) : (
        <div className="mobile-menu-item" onClick={openSignIn}>
          <FaUser />
          <span>Sign In</span>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
