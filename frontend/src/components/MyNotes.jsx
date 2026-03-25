import { useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/api";
import "./PageContent.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function MyNotes({ user, isAdmin }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    if (user?._id) {
      fetchUserNotes();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserNotes = async () => {
    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/notes/user/${user._id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Error fetching user notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Pass userId and isAdmin for authorization
      const params = new URLSearchParams();
      if (user?._id) params.append("userId", user._id);
      if (isAdmin) params.append("isAdmin", "true");

      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/notes/${id}?${params.toString()}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setNotes(notes.filter((note) => note._id !== id));
      } else {
        const data = await response.json();
        alert(data.message || "Cannot delete this note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleFavorite = async (id) => {
    try {
      // Pass userId to verify ownership
      const url = user?._id
        ? `${BACKEND_URL}/api/notes/${id}/favorite?userId=${user._id}`
        : `${BACKEND_URL}/api/notes/${id}/favorite`;

      const response = await fetchWithAuth(url, {
        method: "PUT",
      });
      const updatedNote = await response.json();
      setNotes(notes.map((note) => (note._id === id ? updatedNote : note)));
    } catch (error) {
      console.error("Error toggling favorite:", error);
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
        <h1>My Notes</h1>
        <p>Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h1>My Notes</h1>
      <p>View and manage all your uploaded notes here.</p>

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

      {notes.length === 0 ? (
        <div className="empty-state">
          <p>No notes yet. Start uploading your first note!</p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note._id} className="note-card">
              <div className="note-header">
                <h3>{note.title}</h3>
                <button
                  className={`favorite-btn ${note.isFavorite ? "active" : ""}`}
                  onClick={() => handleFavorite(note._id)}
                >
                  {note.isFavorite ? "⭐" : "☆"}
                </button>
              </div>
              {note.fileUrl ? (
                <div className="note-file-preview">
                  {note.fileType?.startsWith("image/") ? (
                    <div
                      className="file-link"
                      onClick={() => setSelectedNote(note)}
                      style={{ cursor: "pointer" }}
                    >
                      🖼️ View Image
                    </div>
                  ) : note.fileType === "application/pdf" ? (
                    <div
                      className="file-link"
                      onClick={() => setSelectedNote(note)}
                      style={{ cursor: "pointer" }}
                    >
                      {getFileIcon(note.fileType)} View PDF
                    </div>
                  ) : (
                    <div
                      className="file-link"
                      onClick={() => setSelectedNote(note)}
                      style={{ cursor: "pointer" }}
                    >
                      {getFileIcon(note.fileType)} View File
                    </div>
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

export default MyNotes;
