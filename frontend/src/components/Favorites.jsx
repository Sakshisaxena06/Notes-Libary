import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "../utils/api";
import { Document, Page, pdfjs } from "react-pdf";
import { useNotesCache } from "../hooks/useNotesCache";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./PageContent.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const getCorrectFileUrl = (fileUrl) => {
  return fileUrl;
};

function Favorites({ user, isAdmin }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const { fetchWithCache } = useNotesCache(user, isAdmin);

  const fetchFavorites = useCallback(async () => {
    try {
      const params = user?._id ? { userId: user._id } : {};

      const data = await fetchWithCache(
        "/api/notes/favorites",
        params,
        { cacheKey: `favorites_${user?._id || 'all'}`, cacheDuration: 30000 }
      );
      if (data) {
        setFavorites(data);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchWithCache]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (id) => {
    try {
      // Pass userId to verify ownership
      const url = user?._id
        ? `${BACKEND_URL}/api/notes/${id}/favorite?userId=${user._id}`
        : `${BACKEND_URL}/api/notes/${id}/favorite`;

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
        `${BACKEND_URL}/api/notes/${id}?${params.toString()}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setFavorites(favorites.filter((note) => note._id !== id));
      } else {
        const data = await response.json();
        // If note not found (404), still remove from UI
        if (response.status === 404) {
          console.log("Note not found, removing from UI");
          setFavorites(favorites.filter((note) => note._id !== id));
        } else {
          alert(data.message || "Cannot delete this note");
        }
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
    setNumPages(null);
    setPageNumber(1);
    setScale(1.0);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
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
              <div className="pdf-viewer-container">
                <div className="pdf-controls">
                  <div className="zoom-controls">
                    <button
                      onClick={zoomOut}
                      disabled={scale <= 0.5}
                      title="Zoom Out"
                    >
                      −
                    </button>
                    <span className="zoom-level">
                      {Math.round(scale * 100)}%
                    </span>
                    <button
                      onClick={zoomIn}
                      disabled={scale >= 3.0}
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button onClick={resetZoom} title="Reset Zoom">
                      Reset
                    </button>
                  </div>
                  {numPages && numPages > 1 && (
                    <div className="page-controls">
                      <button onClick={goToPrevPage} disabled={pageNumber <= 1}>
                        ‹ Prev
                      </button>
                      <span className="page-info">
                        Page {pageNumber} of {numPages}
                      </span>
                      <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                      >
                        Next ›
                      </button>
                    </div>
                  )}
                </div>
                <div className="pdf-document-wrapper">
                  <Document
                    file={getCorrectFileUrl(
                      selectedNote.fileUrl,
                      selectedNote.fileType,
                    )}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="pdf-loading">Loading PDF...</div>}
                    error={
                      <div className="pdf-error">Failed to load PDF file.</div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      loading={
                        <div className="pdf-loading">Loading page...</div>
                      }
                    />
                  </Document>
                </div>
              </div>
            ) : (
              <div className="preview-not-available">
                <span className="file-icon">
                  {getFileIcon(selectedNote.fileType)}
                </span>
                <p>Preview not available</p>
                <a
                  href={getCorrectFileUrl(
                    selectedNote.fileUrl,
                    selectedNote.fileType,
                  )}
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
