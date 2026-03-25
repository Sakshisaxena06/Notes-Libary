import { useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/api";
import "./PageContent.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function Dashboard({ isAdmin, user }) {
  const [stats, setStats] = useState({
    totalNotes: 0,
    favoriteNotes: 0,
    uploadedNotes: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  // Get user name from props or localStorage
  const userName = user?.name || localStorage.getItem("userName") || "User";

  // Fetch stats on mount and when gaining focus (returning to dashboard)
  useEffect(() => {
    fetchStats();

    // Refresh stats when window gains focus (user returns to this page)
    const handleFocus = () => fetchStats();
    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch all data in parallel for faster loading
      const promises = [];

      // Always fetch all notes
      promises.push(
        fetchWithAuth(`${BACKEND_URL}/api/notes`).then((res) => res.json()),
      );

      // Fetch users if admin
      if (isAdmin) {
        promises.push(
          fetchWithAuth(`${BACKEND_URL}/api/users`).then((res) => res.json()),
        );
      }

      // Fetch user data if logged in
      if (user?._id) {
        promises.push(
          fetchWithAuth(`${BACKEND_URL}/api/notes/user/${user._id}`).then(
            (res) => res.json(),
          ),
        );
        promises.push(
          fetchWithAuth(
            `${BACKEND_URL}/api/notes/favorites?userId=${user._id}`,
          ).then((res) => res.json()),
        );
      }

      // Wait for all requests in parallel
      const results = await Promise.all(promises);

      // Parse results
      let allNotesData = results[0] || [];
      let usersData = isAdmin ? results[1] || [] : [];
      let userNotesData = user?._id ? results[2] || [] : [];
      let favoritesData = user?._id ? results[3] || [] : [];

      setStats({
        totalNotes: allNotesData.length || 0,
        favoriteNotes: favoritesData.length || 0,
        uploadedNotes: userNotesData.filter((n) => n.fileUrl).length || 0,
        totalUsers: usersData.length || 0,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

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
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-count">{stats.favoriteNotes}</span>
            <span className="stat-label">Favourite Notes</span>
          </div>
        </div>

        <div className="dashboard-stat-card uploaded-notes">
          <div className="stat-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
      </div>
    </div>
  );
}

export default Dashboard;
