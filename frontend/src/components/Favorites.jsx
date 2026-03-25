import { useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/api";
import "./PageContent.css";

const BACKEND_URL = "http://localhost:5000";

function Favorites({ user, isAdmin }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    try {
      // Pass userId to backend for filtering
      const url = user?._id
        ? `http://localhost:5000/api/notes/favorites?userId=${user._id}`
        : "http://localhost:5000/api/notes/favorites";

      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id) => {
    try {
      // Pass userId to verify ownership
      const url = user?._id
        ? `http://localhost:5000/api/notes/${id}/favorite?userId=${user._id}`
        : `http://localhost:5000/api/notes/${id}/favorite`;

      const response = await fetchWithAuth(url, {
        method: "PUT",
      });
      if (response.ok) {
        setFavorites(favorites.filter((note) => note._id !== id));
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Pass userId and isAdmin for authorization
      const params = new URLSearchParams();
      if (user?._id) params.append("userId", user._id);
      if (isAdmin) params.append("isAdmin", "true");

      const response = await fetchWithAuth(
        `http://localhost:5000/api/notes/${id}?${params.toString()}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setFavorites(favorites.filter((note) => note._id !== id));
      } else {
        const data = await response.json();
        alert(data.message || "Cannot delete this note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === "application/pdf") return "📕";
    if (fileType?.includes("word") || fileType?.includes("document"))
      return "📘";
    if (fileType?.startsWith("image/")) return "🖼️";
    return "📄";
  };

  const closePreview = () => {
    setSelectedNote(null);
  };

  if (loading) {
    return (
      <div className="page-content">
        <h1>Favorites</h1>
        <p>Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h1>Favorites</h1>
      <p>Your favorite notes and uploads.</p>

      {/* Preview Modal */}
      {selectedNote && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>
              ✕
            </button>
            <h3>{selectedNote.title || selectedNote.fileName}</h3>
            {selectedNote.fileType?.startsWith("image/") ? (
              <img src={selectedNote.fileUrl} alt={selectedNote.title} />
            ) : selectedNote.fileType === "application/pdf" ? (
              <iframe src={selectedNote.fileUrl} title={selectedNote.title} />
            ) : (
              <div className="preview-not-available">
                <span className="file-icon">
                  {getFileIcon(selectedNote.fileType)}
                </span>
                <p>Preview not available</p>
                <a
                  href={selectedNote.fileUrl}
                  download={selectedNote.fileName}
                  className="download-link"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="empty-state">
          <p>No favorite notes yet. Mark some notes as favorites!</p>
        </div>
      ) : (
        <div className="notes-grid">
          {favorites.map((note) => (
            <div key={note._id} className="note-card">
              <div className="note-header">
                <h3>{note.title}</h3>
                <button
                  className="favorite-btn active"
                  onClick={() => handleRemoveFavorite(note._id)}
                >
                  ⭐
                </button>
              </div>
              {note.fileUrl ? (
                <div className="note-file-preview">
                  {note.fileType?.startsWith("image/") ? (
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      🖼️ View Image
                    </a>
                  ) : note.fileType === "application/pdf" ? (
                    <div
                      className="file-link"
                      onClick={() => setSelectedNote(note)}
                      style={{ cursor: "pointer" }}
                    >
                      📕 View PDF
                    </div>
                  ) : (
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      📄 View File
                    </a>
                  )}
                </div>
              ) : (
                <p className="note-content">{note.content}</p>
              )}
              <div className="note-footer">
                <span className="note-category">
                  {note.subject || note.category}
                </span>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(note._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
