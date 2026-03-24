import { useState } from "react";
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
  { id: "my-notes", label: "My Notes", icon: "📝" },
  { id: "favorites", label: "Favorites", icon: "⭐" },
  { id: "upload-notes", label: "Upload Notes", icon: "📤" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "logout", label: "Logout", icon: "🚪" },
];

function Sidebar({ activeItem, onItemClick, isAdmin }) {
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
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
                onClick={() => onItemClick(item.id)}
              >
                <span className="sidebar-menu-icon">{item.icon}</span>
                <span className="sidebar-menu-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
