import React from 'react'
import { Routes, Route, Navigate } from "react-router"
import HomePage from './pages/HomePage'
import SignUpPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import CallPage from './pages/CallPage'
import OnboardingPage from './pages/OnboardingPage'
import NotificationsPage from './pages/NotificationsPage'
import { Toaster } from 'react-hot-toast'

import PageLoader from './components/PageLoader.jsx'
import useAuthUser from './hooks/useAuthUser.js'

const App = () => {

  const {isLoading, authUser} = useAuthUser();
  
  const isAuthenticated = Boolean(authUser)
  const isOnboarded = authUser?.isOnboarded;

  if(isLoading) return <PageLoader/>;

  return (
    <div className='h-screen text-xl' >
      <Routes>
        <Route path="/" element={
          isAuthenticated && isOnboarded ? (
          <HomePage/>
        ) : (
          <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
        )} />
        <Route path="/signup" element={!isAuthenticated ? <SignUpPage/> : <Navigate to="/"/>}  />
        <Route path="/login" element={!isAuthenticated ? <LoginPage/> : <Navigate to="/"/>} />
        <Route path="/notifactions" element={isAuthenticated ? <NotificationsPage/> : <Navigate to="/login"/>} />
        <Route path="/call" element={isAuthenticated ? <CallPage/> : <Navigate to="/login"/>} />
        <Route path="/chat" element={isAuthenticated ? <ChatPage/> : <Navigate to="/login"/>} />
        <Route path="/onboarding" element={
          isAuthenticated ? (
            !isOnboarded ? (
              <OnboardingPage/>
            ) : (
              <Navigate to="/"/>
            )
          ) : (
            <Navigate to="/login"/>
          )
          } />
      </Routes>

      <Toaster/>
    </div>
  )
}

export default App