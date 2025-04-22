import React from 'react';
import { BiLogOut } from 'react-icons/bi';
import { Link, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import "./Auth.css";
import { useDispatch } from "react-redux";
import { setcurrentuser } from '../../action/currentuser';

const Auth = ({ user, setauthbtn, seteditcreatechanelbtn }) => {
    const dispatch = useDispatch();
    const { signOut } = useClerk();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            dispatch(setcurrentuser(null));
            localStorage.clear();
            setauthbtn(false);
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    const handleChannelClick = () => {
        setauthbtn(false); // Close the auth popup
        navigate(`/channel/${user?.result?._id}`);
    };

    return (
        <div className="Auth_container" onClick={() => setauthbtn(false)}>
            <div className="Auth_container2" onClick={(e) => e.stopPropagation()}>
                <div className='User_Details'>
                    <p>{user?.result?.email}</p>
                    <p>Points: {user?.result?.points || 0}</p>
                </div>
                <div className="btns_auth_cont">
                    <div className='btn_auth' onClick={handleChannelClick}>
                        <BiLogOut size={20} />
                        <b>Your Channel</b>
                    </div>
                    <div className='btn_auth' onClick={handleLogout}>
                        <BiLogOut size={20} />
                        <b>Log Out</b>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;







