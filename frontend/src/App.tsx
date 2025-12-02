import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SupportDashboard from './components/SupportDashboard';
import UserNotifications from './components/UserNotifications';
import { getCurrentUser, isAuthenticated, getUserRole } from './utils/auth';
import { io, Socket } from 'socket.io-client';

// Main App component
const App: React.FC = () => {
  useEffect(() => {
    // Establish Socket.io connection for real-time notifications
    let socket: Socket | null = null;
    if (isAuthenticated()) {
      const user = getCurrentUser();
      socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000', {
        path: '/socket.io',
        transports: ['websocket'],
        withCredentials: true,
      });
      // Register userId for notification delivery
      socket.emit('register', user.id);

      // Listen for notifications (can be handled globally or via context)
      socket.on('notification', (payload) => {
        // Optionally dispatch to a notification context/store
        // eslint-disable-next-line no-console
        console.log('Received notification:', payload);
      });
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Role-based routing
  const role = getUserRole();

  return (
    <Router>
      <Routes>
        {/* Support Specialist Dashboard */}
        {role === 'support_specialist' || role === 'admin' ? (
          <Route path="/support" element={<SupportDashboard />} />
        ) : null}

        {/* User Notifications */}
        {role === 'user' ? (
          <Route path="/notifications" element={<UserNotifications />} />
        ) : null}

        {/* Default route: redirect based on role */}
        <Route
          path="/"
          element={
            isAuthenticated() ? (
              role === 'support_specialist' || role === 'admin' ? (
                <Navigate to="/support" replace />
              ) : (
                <Navigate to="/notifications" replace />
              )
            ) : (
              <div>
                <h2>Welcome to the Support Specialist Hint & Feedback System</h2>
                <p>Please log in to access your dashboard.</p>
              </div>
            )
          }
        />

        {/* Fallback route */}
        <Route
          path="*"
          element={
            <div>
              <h2>404 - Page Not Found</h2>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;