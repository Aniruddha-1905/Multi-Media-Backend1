import React from 'react'
import { Routes,Route } from 'react-router-dom'
import Home from './Pages/Home/Home'
import Search from './Pages/Search/Search'
import Videopage from './Pages/Videopage/Videopage'
import Channel from './Pages/Channel/Channel'
import Library from './Pages/Library/Library'
import Likedvideo from './Pages/Likedvideo/Likedvideo'
import Watchhistory from './Pages/Watchhistory/Watchhistory'
import Watchlater from './Pages/Watchlater/Watchlater'
import Yourvideo from './Pages/Yourvideo/Yourvideo'
import GroupPage from './Pages/GroupPage/GroupPage'
import CreateGroup from './Pages/GroupPage/CreateGroup'
import SearchGroup from './Pages/GroupPage/SearchGroup'
import GroupInvite from './Pages/GroupPage/GroupInvite'
import DirectJoin from './Pages/GroupPage/DirectJoin'
const Allroutes = ({seteditcreatechanelbtn,setvideouploadpage}) => {
  return (
    <Routes>
        <Route path='/'element={<Home/>}/>
        <Route path='/search/:Searchquery' element={<Search/>}/>
        <Route path='/videopage/:vid' element={<Videopage/>}/>
        <Route path='/Library' element={<Library/>}/>
        <Route path='/Likedvideo' element={<Likedvideo/>}/>
        <Route path='/Watchhistory' element={<Watchhistory/>}/>
        <Route path='/Watchlater' element={<Watchlater/>}/>
        <Route path='/Yourvideo' element={<Yourvideo/>}/>
        <Route
            path='/channel/:cid'
            element={
                <Channel
                    seteditcreatechanelbtn={seteditcreatechanelbtn}
                    setvideouploadpage={setvideouploadpage}
                />
            }
        />
        {/* Group Routes */}
        <Route path='/group/:groupId' element={<GroupPage />} />
        <Route path='/create-group' element={<CreateGroup />} />
        <Route path='/search-groups' element={<SearchGroup />} />
        <Route path='/join/:inviteCode' element={<GroupInvite />} />
        <Route path='/join-direct/:inviteCode' element={<DirectJoin />} />
    </Routes>
  )
}

export default Allroutes
