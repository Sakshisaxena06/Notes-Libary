import { useState, useEffect } from "react";
import { fetchWithAuth, BACKEND_URL } from "../utils/api"; // ✅ Import BACKEND_URL from api.js
import "./PageContent.css";

function Profile({ user, setUser, onLogout }) {
  const [profileImage, setProfileImage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [stats, setStats] = useState({ uploadedNotes: 0, favoriteNotes: 0 });

  const userName = user?.name || localStorage.getItem("userName") || "User";
  const userEmail = user?.email || localStorage.getItem("userEmail") || "user@example.com";
  const userId = user?._id || localStorage.getItem("userId");

  const getProfileKey = () => userId ? `profileImage_${userId}` : "profileImage";

  useEffect(() => {
    const savedImage = localStorage.getItem(getProfileKey());
    if (savedImage) setProfileImage(savedImage);

    if (userId) fetchUserStats();

    const handleFocus = () => { if (userId) fetchUserStats(); };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [userId]);

  // ✅ FIXED: Uses BACKEND_URL from api.js (full URL, works on Android)
  const fetchUserStats = async () => {
    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/notes/user/${userId}`
      );
      let uploadedCount = 0;
      if (response.ok) {
        const notes = await response.json();
        uploadedCount = notes.filter((n) => n.fileUrl).length;
      }

      const favoritesResponse = await fetchWithAuth(
        `${BACKEND_URL}/api/notes/favorites?userId=${userId}`
      );
      let favoriteCount = 0;
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        favoriteCount = favoritesData.length || 0;
      }

      setStats({ uploadedNotes: uploadedCount, favoriteNotes: favoriteCount });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        localStorage.setItem(getProfileKey(), reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    localStorage.removeItem(getProfileKey());
  };

  const getInitials = (name) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleEditProfile = () => {
    setEditForm({ name: userName, email: userEmail });
    setMessage({ type: "", text: "" });
    setShowEditModal(true);
  };

  const handleChangePassword = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage({ type: "", text: "" });
    setShowPasswordModal(true);
  };

  // ✅ FIXED: Uses BACKEND_URL from api.js
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/users/profile/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editForm.name,
            email: editForm.email.toLowerCase(), // ✅ lowercase email
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userEmail", data.email);

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.name = data.name;
          userObj.email = data.email;
          localStorage.setItem("user", JSON.stringify(userObj));
        }

        if (setUser) setUser({ ...user, name: data.name, email: data.email });

        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => {
          setShowEditModal(false);
          setMessage({ type: "", text: "" });
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch (error) {
      // ✅ FIXED: Friendly error message
      setMessage({ type: "error", text: "Server error. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Uses BACKEND_URL from api.js
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/users/profile/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setTimeout(() => {
          setShowPasswordModal(false);
          setMessage({ type: "", text: "" });
          setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to change password" });
      }
    } catch (error) {
      // ✅ FIXED: Friendly error message
      setMessage({ type: "error", text: "Server error. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account settings and personal information</p>
      </div>

      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-main-card">
          <div className="profile-cover"></div>
          <div className="profile-content">
            <div className="profile-avatar-section">
              {profileImage ? (
                <div className="profile-image-wrapper large">
                  <img src={profileImage} alt="Profile" className="profile-image" />
                </div>
              ) : (
                <div className="profile-avatar large">{getInitials(userName)}</div>
              )}
              <label htmlFor="profile-upload" className="upload-avatar-btn">
                {profileImage ? "Change Photo" : "Upload Photo"}
              </label>
              <input
                type="file"
                id="profile-upload"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              {/* ✅ Show remove button only if image exists */}
              {profileImage && (
                <button
                  className="remove-avatar-btn"
                  onClick={handleRemoveImage}
                  style={{ marginTop: "8px", cursor: "pointer" }}
                >
                  Remove Photo
                </button>
              )}
            </div>

            <div className="profile-details">
              <h2 className="profile-name">{userName}</h2>
              <p className="profile-email">{userEmail}</p>
              <span className="profile-badge">Student</span>
            </div>
          </div>
        </div>

        {/* My Notes Section */}
        <div className="my-notes-section">
          <h3>My Notes</h3>
          <div className="notes-cards">
            <div className="notes-card uploaded">
              <div className="notes-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <div className="notes-info">
                <span className="notes-count">{stats.uploadedNotes}</span>
                <span className="notes-label">Uploaded Notes</span>
              </div>
            </div>

            <div className="notes-card favorite">
              <div className="notes-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <div className="notes-info">
                <span className="notes-count">{stats.favoriteNotes}</span>
                <span className="notes-label">Favourite Notes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="profile-settings-card">
          <h3>Account Settings</h3>
          <div className="settings-list">
            <div className="settings-item" onClick={handleEditProfile}>
              <div className="settings-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="settings-text">
                <span className="settings-title">Edit Profile</span>
                <span className="settings-desc">Update your name and email</span>
              </div>
              <span className="settings-arrow">→</span>
            </div>

            <div className="settings-item" onClick={handleChangePassword}>
              <div className="settings-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div className="settings-text">
                <span className="settings-title">Change Password</span>
                <span className="settings-desc">Update your password</span>
              </div>
              <span className="settings-arrow">→</span>
            </div>
          </div>

          <button className="logout-btn" onClick={onLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            <h2>Edit Profile</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              {message.text && (
                <div className={`message ${message.type}`}>{message.text}</div>
              )}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
              {message.text && (
                <div className={`message ${message.type}`}>{message.text}</div>
              )}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;