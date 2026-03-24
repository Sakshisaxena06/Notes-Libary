import { useState } from "react";
import "./Auth.css";

function Landing({ onLogin, onSignupClick, onAdminLoginClick }) {
  return (
    <div className="landing-container">
      <div className="landing-split">
        <div className="landing-left">
          <div className="landing-header">
            <h1>Welcome to Notes Library</h1>
            <p className="landing-subtitle">
              All Your Study Notes in One Place – Upload, Save, Download and
              Share
            </p>
          </div>

          <div className="get-started-section">
            <button className="get-started-btn" onClick={onSignupClick}>
              Get Started
            </button>
            <p className="login-text">
              Already have an account?{" "}
              <span className="login-link" onClick={onLogin}>
                Login
              </span>
            </p>
          </div>

          <div className="landing-features">
            <div className="feature">
              <span className="feature-icon">📝</span>
              <h3>Create Notes</h3>
              <p>Write and organize your notes easily</p>
            </div>
            <div className="feature">
              <span className="feature-icon">⭐</span>
              <h3>Favorites</h3>
              <p>Mark important notes as favorites</p>
            </div>
            <div className="feature">
              <span className="feature-icon">📤</span>
              <h3>Upload</h3>
              <p>Upload documents and PDFs</p>
            </div>
          </div>
        </div>
        <div className="landing-right">
          <img
            src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=500&fit=crop"
            alt="Notes illustration"
            className="landing-image"
          />
        </div>
      </div>
    </div>
  );
}

export default Landing;
