import "./PageContent.css";

function Logout({ onLogout }) {
  const handleLogout = () => {
    // Add logout logic here
    if (onLogout) {
      onLogout();
    }
    alert("You have been logged out successfully!");
  };

  return (
    <div className="page-content">
      <h1>Logout</h1>
      <p>Are you sure you want to logout?</p>
      <div className="logout-confirmation">
        <button className="logout-btn" onClick={handleLogout}>
          Confirm Logout
        </button>
      </div>
    </div>
  );
}

export default Logout;
