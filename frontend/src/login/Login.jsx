import { useState } from "react";
import "./Auth.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;

function Login({
  onLoginSuccess,
  onBack,
  onSwitchToSignup,
  onAdminLoginClick,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
if (response.ok) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("userName", data.name);
  localStorage.setItem("userEmail", data.email);
  localStorage.setItem("userId", data._id);
  onLoginSuccess(data);
} else {
  setError(data.message || "Login failed");
}
   } catch (err) {
  console.log(err);
  setError(err.message);
} finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>

        <h2>Login</h2>
        <p className="auth-subtitle">Welcome back! Please login to continue.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <span onClick={onSwitchToSignup}>Create one</span>
        </p>

        <div className="admin-login-link">
          <span onClick={onAdminLoginClick}>Admin Login</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
