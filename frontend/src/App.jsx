import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import AllNotes from "./components/AllNotes";
import MyNotes from "./components/MyNotes";
import Favorites from "./components/Favorites";
import SavedNotes from "./components/SavedNotes";
import UploadNotes from "./components/UploadNotes";
import Profile from "./components/Profile";
import Logout from "./components/Logout";
import Landing from "./login/Landing";
import Login from "./login/Login";
import Signup from "./login/Signup";
import AdminLogin from "./login/AdminLogin";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem("isLoggedIn");
    return saved === "true";
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    const saved = localStorage.getItem("isAdmin");
    return saved === "true" || saved === true;
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [authView, setAuthView] = useState(() => {
    const saved = localStorage.getItem("isLoggedIn");
    return saved === "true" ? "dashboard" : "landing";
  }); // landing, login, signup, admin
  const [activeItem, setActiveItem] = useState("dashboard");

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAdmin(userData.isAdmin || false);
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token || "");
    localStorage.setItem("isAdmin", String(userData.isAdmin || false));
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
    setIsAdmin(false);
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token || "");
    localStorage.setItem("isAdmin", String(false));
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleAdminLoginSuccess = (userData) => {
    setUser(userData);
    setIsAdmin(true);
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token || "");
    localStorage.setItem("isAdmin", String(true));
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setIsLoggedIn(false);
    setAuthView("landing");
    setActiveItem("dashboard");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("isLoggedIn");
  };

  const handleMenuClick = (item) => {
    if (item === "logout") {
      handleLogout();
    } else {
      setActiveItem(item);
    }
  };

  const renderAuthView = () => {
    switch (authView) {
      case "login":
        return (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setAuthView("landing")}
            onSwitchToSignup={() => setAuthView("signup")}
            onAdminLoginClick={() => setAuthView("admin")}
          />
        );
      case "signup":
        return (
          <Signup
            onSignupSuccess={handleSignupSuccess}
            onBack={() => setAuthView("landing")}
            onSwitchToLogin={() => setAuthView("login")}
          />
        );
      case "admin":
        return (
          <AdminLogin
            onAdminLoginSuccess={handleAdminLoginSuccess}
            onBack={() => setAuthView("landing")}
          />
        );
      default:
        return (
          <Landing
            onLogin={() => setAuthView("login")}
            onSignupClick={() => setAuthView("signup")}
            onAdminLoginClick={() => setAuthView("admin")}
          />
        );
    }
  };

  const renderContent = () => {
    switch (activeItem) {
      case "dashboard":
        return <Dashboard isAdmin={isAdmin} user={user} />;
      case "all-notes":
        return <AllNotes user={user} isAdmin={isAdmin} />;
      case "my-notes":
        return <MyNotes user={user} isAdmin={isAdmin} />;
      case "favorites":
        return <Favorites user={user} isAdmin={isAdmin} />;
      case "saved-notes":
        return <SavedNotes />;
      case "upload-notes":
        return <UploadNotes user={user} isAdmin={isAdmin} />;
      case "profile":
        return (
          <Profile user={user} setUser={setUser} onLogout={handleLogout} />
        );
      case "logout":
        return <Logout onLogout={handleLogout} />;
      default:
        return <Dashboard isAdmin={isAdmin} />;
    }
  };

  // Show auth pages if not logged in
  if (!isLoggedIn) {
    return renderAuthView();
  }

  return (
    <div className="app">
      <Sidebar
        activeItem={activeItem}
        onItemClick={handleMenuClick}
        isAdmin={isAdmin}
      />
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default App;
