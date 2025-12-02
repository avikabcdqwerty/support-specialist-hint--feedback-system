import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { getToken } from '../utils/auth';

// Types for hints/feedback
interface Hint {
  id: string;
  stepId: string;
  puzzleId?: string;
  message: string;
  status: string;
  createdAt: string;
  viewedAt?: string;
  sentById?: string;
  sentByRole?: string;
}

const UserNotifications: React.FC = () => {
  const [hints, setHints] = useState<Hint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingHintId, setViewingHintId] = useState<string | null>(null);

  // Fetch user's hints/feedback
  const fetchHints = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await api.get('/support/hint', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHints(res.data.hints || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          'Failed to fetch notifications. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Mark a hint as viewed (for audit logging)
  const markAsViewed = async (hintId: string) => {
    setViewingHintId(hintId);
    try {
      const token = getToken();
      await api.post(
        `/support/hint/view/${hintId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state to reflect viewed status
      setHints((prev) =>
        prev.map((h) =>
          h.id === hintId
            ? { ...h, status: 'VIEWED', viewedAt: new Date().toISOString() }
            : h
        )
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          'Failed to mark hint as viewed. Please try again.'
      );
    } finally {
      setViewingHintId(null);
    }
  };

  useEffect(() => {
    fetchHints();
    // Optionally, subscribe to real-time notifications and refetch on new hint
    // (handled globally in App.tsx or via context)
  }, []);

  return (
    <div className="user-notifications">
      <h1>Your Hints & Feedback</h1>
      {loading && <div>Loading notifications...</div>}
      {error && (
        <div style={{ color: 'red', marginBottom: 16 }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {!loading && hints.length === 0 && (
        <div>No hints or feedback received yet.</div>
      )}
      {!loading && hints.length > 0 && (
        <table border={1} cellPadding={6} cellSpacing={0}>
          <thead>
            <tr>
              <th>Step ID</th>
              <th>Puzzle ID</th>
              <th>Message</th>
              <th>Received At</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {hints.map((hint) => (
              <tr
                key={hint.id}
                style={
                  hint.status === 'UNREAD'
                    ? { backgroundColor: '#e0f7fa' }
                    : undefined
                }
              >
                <td>{hint.stepId}</td>
                <td>{hint.puzzleId || '-'}</td>
                <td>{hint.message}</td>
                <td>{new Date(hint.createdAt).toLocaleString()}</td>
                <td>
                  {hint.status === 'UNREAD' ? (
                    <span style={{ color: '#00796b' }}>Unread</span>
                  ) : (
                    <span style={{ color: '#388e3c' }}>
                      Viewed
                      {hint.viewedAt
                        ? ` (${new Date(hint.viewedAt).toLocaleString()})`
                        : ''}
                    </span>
                  )}
                </td>
                <td>
                  {hint.status === 'UNREAD' ? (
                    <button
                      onClick={() => markAsViewed(hint.id)}
                      disabled={viewingHintId === hint.id}
                    >
                      {viewingHintId === hint.id ? 'Marking...' : 'Mark as Viewed'}
                    </button>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserNotifications;