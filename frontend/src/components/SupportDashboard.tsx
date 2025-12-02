import React, { useState, useEffect, FormEvent } from 'react';
import { getCurrentUser, getToken } from '../utils/auth';
import api from '../api/api';

// Types for user progress and hints
interface UserSummary {
  id: string;
  username: string;
}

interface SupportRequestSummary {
  id: string;
  createdAt: string;
}

interface ProgressLog {
  id: string;
  stepId: string;
  puzzleId?: string;
  status: string;
  updatedAt: string;
  details?: string;
}

interface StuckStepOrPuzzle {
  stepId: string;
  puzzleId?: string;
  status: string;
  updatedAt: string;
  details?: string;
}

interface UserProgressResponse {
  user: UserSummary;
  supportRequest: SupportRequestSummary;
  progressLogs: ProgressLog[];
  stuckStepOrPuzzle: StuckStepOrPuzzle | null;
}

const SupportDashboard: React.FC = () => {
  const [searchUserId, setSearchUserId] = useState('');
  const [progress, setProgress] = useState<UserProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hintMessage, setHintMessage] = useState('');
  const [hintStepId, setHintStepId] = useState('');
  const [hintPuzzleId, setHintPuzzleId] = useState('');
  const [hintSending, setHintSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch user progress logs for a given userId
  const fetchUserProgress = async (userId: string) => {
    setLoading(true);
    setError(null);
    setProgress(null);
    setSuccessMsg(null);
    try {
      const token = getToken();
      const res = await api.get(`/support/progress/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProgress(res.data);
      // Pre-fill hint step/puzzle if user is stuck
      if (res.data.stuckStepOrPuzzle) {
        setHintStepId(res.data.stuckStepOrPuzzle.stepId || '');
        setHintPuzzleId(res.data.stuckStepOrPuzzle.puzzleId || '');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          'Failed to fetch user progress. Ensure the user has an open support request.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submit
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchUserId.trim()) {
      fetchUserProgress(searchUserId.trim());
    }
  };

  // Handle sending a hint/feedback
  const handleSendHint = async (e: FormEvent) => {
    e.preventDefault();
    if (!progress) return;
    setHintSending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = getToken();
      await api.post(
        `/support/hint/${progress.user.id}`,
        {
          stepId: hintStepId,
          puzzleId: hintPuzzleId || undefined,
          message: hintMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMsg('Hint/feedback sent successfully.');
      setHintMessage('');
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          'Failed to send hint. Ensure the user has an open support request.'
      );
    } finally {
      setHintSending(false);
    }
  };

  return (
    <div className="support-dashboard">
      <h1>Support Specialist Dashboard</h1>
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <label>
          Enter User ID to view progress:
          <input
            type="text"
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            placeholder="User ID"
            style={{ marginLeft: 8, marginRight: 8 }}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'View Progress'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginBottom: 16 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {progress && (
        <div className="user-progress-section" style={{ marginBottom: 32 }}>
          <h2>
            User: {progress.user.username} (ID: {progress.user.id})
          </h2>
          <p>
            Support Request ID: {progress.supportRequest.id} | Created:{' '}
            {new Date(progress.supportRequest.createdAt).toLocaleString()}
          </p>
          <h3>Progress Logs</h3>
          <table border={1} cellPadding={6} cellSpacing={0}>
            <thead>
              <tr>
                <th>Step ID</th>
                <th>Puzzle ID</th>
                <th>Status</th>
                <th>Updated At</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {progress.progressLogs.map((log) => (
                <tr
                  key={log.id}
                  style={
                    log.status === 'STUCK'
                      ? { backgroundColor: '#ffe0e0' }
                      : undefined
                  }
                >
                  <td>{log.stepId}</td>
                  <td>{log.puzzleId || '-'}</td>
                  <td>{log.status}</td>
                  <td>{new Date(log.updatedAt).toLocaleString()}</td>
                  <td>{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 style={{ marginTop: 24 }}>Send Hint/Feedback</h3>
          <form onSubmit={handleSendHint}>
            <div>
              <label>
                Step ID:
                <input
                  type="text"
                  value={hintStepId}
                  onChange={(e) => setHintStepId(e.target.value)}
                  required
                  style={{ marginLeft: 8, marginRight: 16 }}
                />
              </label>
              <label>
                Puzzle ID:
                <input
                  type="text"
                  value={hintPuzzleId}
                  onChange={(e) => setHintPuzzleId(e.target.value)}
                  placeholder="(optional)"
                  style={{ marginLeft: 8, marginRight: 16 }}
                />
              </label>
            </div>
            <div style={{ marginTop: 8 }}>
              <label>
                Message:
                <textarea
                  value={hintMessage}
                  onChange={(e) => setHintMessage(e.target.value)}
                  required
                  rows={3}
                  cols={50}
                  style={{ marginLeft: 8, verticalAlign: 'top' }}
                  placeholder="Enter your hint or feedback here..."
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={hintSending || !hintMessage.trim() || !hintStepId.trim()}
              style={{ marginTop: 12 }}
            >
              {hintSending ? 'Sending...' : 'Send Hint/Feedback'}
            </button>
          </form>
          {successMsg && (
            <div style={{ color: 'green', marginTop: 12 }}>{successMsg}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupportDashboard;