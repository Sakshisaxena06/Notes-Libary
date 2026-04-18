import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth, BACKEND_URL } from "../utils/api";
import { Document, Page, pdfjs } from "react-pdf";
import { useNotesCache } from "../hooks/useNotesCache";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./PageContent.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function MyNotes({ user, isAdmin }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const { fetchWithCache, invalidateCache } = useNotesCache(user, isAdmin);

  const fetchUserNotes = useCallback(async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchWithCache(
        `/api/notes/user/${user._id}`,
        { currentUserId: user._id },
        { cacheKey: `userNotes_${user._id}`, cacheDuration: 30000 }
      );
      if (data) setNotes(data);
    } catch (error) {
      console.error("Error fetching user notes:", error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchWithCache]);

  useEffect(() => {
    fetchUserNotes();
  }, [fetchUserNotes]);

  const handleDelete = async (id) => {
    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/notes/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setNotes(notes.filter((note) => note._id !== id));
        invalidateCache("userNotes_");
      } else {
        const data = await response.json();
        if (response.status === 404) {
          setNotes(notes.filter((note) => note._id !== id));
        } else {
          alert(data.message || "Cannot delete this note");
        }
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete. Check your connection.");
    }
  };

  const handleFavorite = async (id) => {
    const noteToUpdate = notes.find((note) => note._id === id);
    const wasFavorited = noteToUpdate?.isFavoritedByCurrentUser;

    setNotes((prev) =>
      prev.map((note) =>
        note._id === id ? { ...note, isFavoritedByCurrentUser: !wasFavorited } : note
      )
    );

    try {
      const url = user?._id
        ? `${BACKEND_URL}/api/notes/${id}/favorite?userId=${user._id}`
        : `${BACKEND_URL}/api/notes/${id}/favorite`;

      const response = await fetchWithAuth(url, { method: "PUT" });
      const updatedNote = await response.json();
      setNotes((prev) =>
        prev.map((note) => (note._id === id ? updatedNote : note))
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setNotes((prev) =>
        prev.map((note) =>
          note._id === id ? { ...note, isFavoritedByCurrentUser: wasFavorited } : note
        )
      );
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === "application/pdf") return "📕";
    if (fileType?.includes("word") || fileType?.includes("document")) return "📘";
    if (fileType?.startsWith("image/")) return "🖼️";
    return "📄";
  };

  const closePreview = () => {
    setSelectedNote(null);
    setNumPages(null);
    setPageNumber(1);
    setScale(1.0);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
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

      {selectedNote && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>✕</button>
            <h3>{selectedNote.title || selectedNote.fileName}</h3>
            {selectedNote.fileType?.startsWith("image/") ? (
              <img src={selectedNote.fileUrl} alt={selectedNote.title} />
            ) : selectedNote.fileType === "application/pdf" ? (
              <div className="pdf-viewer-container">
                <div className="pdf-controls">
                  <div className="zoom-controls">
                    <button onClick={() => setScale((p) => Math.max(p - 0.25, 0.5))} disabled={scale <= 0.5}>−</button>
                    <span className="zoom-level">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale((p) => Math.min(p + 0.25, 3.0))} disabled={scale >= 3.0}>+</button>
                    <button onClick={() => setScale(1.0)}>Reset</button>
                  </div>
                  {numPages && numPages > 1 && (
                    <div className="page-controls">
                      <button onClick={() => setPageNumber((p) => Math.max(p - 1, 1))} disabled={pageNumber <= 1}>‹ Prev</button>
                      <span className="page-info">Page {pageNumber} of {numPages}</span>
                      <button onClick={() => setPageNumber((p) => Math.min(p + 1, numPages))} disabled={pageNumber >= numPages}>Next ›</button>
                    </div>
                  )}
                </div>
                <div className="pdf-document-wrapper">
                  <Document
                    file={selectedNote.fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="pdf-loading">Loading PDF...</div>}
                    error={<div className="pdf-error">Failed to load PDF file.</div>}
                  >
                    <Page pageNumber={pageNumber} scale={scale} loading={<div className="pdf-loading">Loading page...</div>} />
                  </Document>
                </div>
              </div>
            ) : (
              <div className="preview-not-available">
                <span className="file-icon">{getFileIcon(selectedNote.fileType)}</span>
                <p>Preview not available</p>
                <a href={selectedNote.fileUrl} download={selectedNote.fileName} className="download-link">
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
                  className={`favorite-btn ${note.isFavoritedByCurrentUser ? "active" : ""}`}
                  onClick={() => handleFavorite(note._id)}
                >
                  {note.isFavoritedByCurrentUser ? "⭐" : "☆"}
                </button>
              </div>
              {note.fileUrl ? (
                <div className="note-file-preview">
                  <div
                    className="file-link"
                    onClick={() => setSelectedNote(note)}
                    style={{ cursor: "pointer" }}
                  >
                    {getFileIcon(note.fileType)} View {note.fileType === "application/pdf" ? "PDF" : note.fileType?.startsWith("image/") ? "Image" : "File"}
                  </div>
                </div>
              ) : (
                <p className="note-content">{note.content}</p>
              )}
              <div className="note-footer">
                <span className="note-category">{note.subject || note.category}</span>
                <button className="delete-btn" onClick={() => handleDelete(note._id)}>
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