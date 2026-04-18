import { useState, useEffect, useCallback } from "react";
import { useNotesCache } from "../hooks/useNotesCache";
import "./PageContent.css";

function Dashboard({ isAdmin, user }) {
  const [stats, setStats] = useState({
    totalNotes: 0,
    favoriteNotes: 0,
    uploadedNotes: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  const userName = user?.name || localStorage.getItem("userName") || "User";
  const { fetchWithCache } = useNotesCache(user, isAdmin);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const params = {};
      if (user?._id) params.userId = user._id;
      if (isAdmin) params.isAdmin = "true";

      const statsData = await fetchWithCache(
        "/api/notes/stats",
        params,
        {
          cacheKey: `dashboardStats_${isAdmin}_${user?._id}`,
          cacheDuration: 30000,
        }
      );

      if (statsData) setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, fetchWithCache]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (loading) {
    return (
      <div className="page-content">
        <h1>Welcome {userName}</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="dashboard-welcome">
        <h1>Welcome {userName}</h1>
        <p>Your notes at a glance</p>
      </div>

      <div className="dashboard-stats">
        {isAdmin && (
          <div className="dashboard-stat-card total-users">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-count">{stats.totalUsers}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>
        )}

        <div className="dashboard-stat-card total-notes">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-count">{stats.totalNotes}</span>
            <span className="stat-label">Total Notes</span>
          </div>
        </div>

        <div className="dashboard-stat-card favorite-notes">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-count">{stats.favoriteNotes}</span>
            <span className="stat-label">Favourite Notes</span>
          </div>
        </div>

        {isAdmin && (
          <div className="dashboard-stat-card uploaded-notes">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-count">{stats.uploadedNotes}</span>
              <span className="stat-label">Uploaded Notes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;