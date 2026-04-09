import { useState, useEffect } from "react";
import "./Sidebar.css";

const adminMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "all-notes", label: "All Notes", icon: "📋" },
  { id: "upload-notes", label: "Uploaded Notes", icon: "📤" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "logout", label: "Logout", icon: "🚪" },
];

const userMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "all-notes", label: "All Notes", icon: "📋" },
  { id: "favorites", label: "Favorites", icon: "⭐" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "logout", label: "Logout", icon: "🚪" },
];

function Sidebar({ activeItem, onItemClick, isAdmin }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const handleItemClick = (itemId) => {
    onItemClick(itemId);
    // Close sidebar on mobile after clicking an item
    if (window.innerWidth <= 1024) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        className="mobile-menu-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? "active" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-close"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            ✕
          </button>
          <h2
            className={`sidebar-title ${isAdmin ? "admin-title" : "user-title"}`}
          >
            {isAdmin ? "Admin" : "Notes Library"}
          </h2>
        </div>
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`sidebar-menu-item ${activeItem === item.id ? "active" : ""}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <span className="sidebar-menu-icon">{item.icon}</span>
                  <span className="sidebar-menu-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
