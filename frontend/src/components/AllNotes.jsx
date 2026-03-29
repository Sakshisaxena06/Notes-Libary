import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchWithAuth } from "../utils/api";
import "./PageContent.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function AllNotes({ user, isAdmin }) {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [prevSubject, setPrevSubject] = useState(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectIcon, setNewSubjectIcon] = useState("📄");

  useEffect(() => {
    // Check cache first
    const cachedNotes = sessionStorage.getItem("allNotes");
    const cachedSubjects = sessionStorage.getItem("allSubjects");

    if (cachedNotes && cachedSubjects) {
      setNotes(JSON.parse(cachedNotes));
      setSubjects(JSON.parse(cachedSubjects));
      setLoading(false);
      return;
    }

    // Fetch notes and subjects in parallel for faster loading
    Promise.all([
      fetchWithAuth(`${BACKEND_URL}/api/notes`),
      fetchWithAuth(`${BACKEND_URL}/api/subjects`),
    ])
      .then(([notesRes, subjectsRes]) => {
        Promise.all([notesRes.json(), subjectsRes.json()]).then(
          ([notesData, subjectsData]) => {
            setNotes(notesData);
            setSubjects(subjectsData);
            // Cache the data
            sessionStorage.setItem("allNotes", JSON.stringify(notesData));
            sessionStorage.setItem("allSubjects", JSON.stringify(subjectsData));
            setLoading(false);
          },
        );
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  // Reset search when subject changes
  useEffect(() => {
    if (prevSubject !== null && prevSubject !== selectedSubject) {
      setSearchQuery("");
      setShowSearch(false);
    }
    setPrevSubject(selectedSubject);
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/subjects`);
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const getSubjectIcon = (subjectName) => {
    const subject = subjects.find((s) => s.name === subjectName);
    return subject?.icon || "📄";
  };

  const fetchNotes = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/notes`);
      const data = await response.json();
      setNotes(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setLoading(false);
    }
  };

  const filteredNotes = selectedSubject
    ? selectedSubject === "All"
      ? notes
      : notes.filter((note) => note.subject === selectedSubject)
    : [];

  // Search filter for notes within a subject
  const searchedNotes = searchQuery
    ? filteredNotes.filter((note) => {
        const query = searchQuery.toLowerCase();
        const titleMatch = note.title?.toLowerCase().includes(query);
        const isPdf = note.fileType === "application/pdf";
        const isImage = note.fileType?.startsWith("image/");
        const fileTypeMatch =
          (query.includes("pdf") && isPdf) ||
          (query.includes("image") && isImage) ||
          (query.includes("img") && isImage) ||
          (query.includes("photo") && isImage) ||
          (query.includes("pic") && isImage);
        return titleMatch || fileTypeMatch;
      })
    : filteredNotes;

  // Group notes by subject (memoized for performance)
  const groupedNotes = useMemo(() => {
    return subjects.reduce((acc, subject) => {
      acc[subject.name] = notes.filter((note) => note.subject === subject.name);
      return acc;
    }, {});
  }, [subjects, notes]);

  const handleDelete = async (id) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/notes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const updatedNotes = notes.filter((note) => note._id !== id);
        setNotes(updatedNotes);
        // Update cache
        sessionStorage.setItem("allNotes", JSON.stringify(updatedNotes));
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
      const url = user?._id
        ? `${BACKEND_URL}/api/notes/${id}/favorite?userId=${user._id}`
        : `${BACKEND_URL}/api/notes/${id}/favorite`;

      const response = await fetchWithAuth(url, {
        method: "PUT",
      });
      const updatedNote = await response.json();
      const updatedNotes = notes.map((note) =>
        note._id === id ? updatedNote : note,
      );
      setNotes(updatedNotes);
      // Update cache
      sessionStorage.setItem("allNotes", JSON.stringify(updatedNotes));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      alert("Please enter a subject name");
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newSubjectName, icon: newSubjectIcon }),
      });

      if (response.ok) {
        const newSubject = await response.json();
        const updatedSubjects = [...subjects, newSubject];
        setSubjects(updatedSubjects);
        // Update cache
        sessionStorage.setItem("allSubjects", JSON.stringify(updatedSubjects));
        setNewSubjectName("");
        setNewSubjectIcon("📄");
        setShowAddSubject(false);
        alert("Subject added successfully!");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to add subject");
      }
    } catch (error) {
      console.error("Error adding subject:", error);
      alert("Failed to add subject");
    }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!confirm(`Are you sure you want to delete "${subjectName}"?`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/subjects/${subjectId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        const updatedSubjects = subjects.filter((s) => s._id !== subjectId);
        setSubjects(updatedSubjects);
        // Update cache
        sessionStorage.setItem("allSubjects", JSON.stringify(updatedSubjects));
        alert("Subject deleted successfully!");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete subject");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      alert("Failed to delete subject");
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <h1>All Notes</h1>
        <p>Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h1>All Notes</h1>
      <p>Click on a subject to view its notes</p>

      {/* Subject Cards - Show when no subject is selected */}
      {!selectedSubject && (
        <div className="subject-cards-container">
          {/* All Notes Card */}
          <div
            className="subject-click-card all-card"
            onClick={() => setSelectedSubject("All")}
          >
            <span className="subject-card-icon">📁</span>
            <h3>All Notes</h3>
            <span className="subject-card-count">{notes.length} notes</span>
          </div>

          {/* Subject Cards */}
          {subjects.map((subject) => (
            <div
              key={subject._id}
              className="subject-click-card"
              onClick={() => setSelectedSubject(subject.name)}
            >
              <span className="subject-card-icon">{subject.icon}</span>
              <h3>{subject.name}</h3>
              <span className="subject-card-count">
                {groupedNotes[subject.name]?.length || 0} notes
              </span>
              {isAdmin && (
                <button
                  className="delete-subject-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSubject(subject._id, subject.name);
                  }}
                  title="Delete subject"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}

          {/* Add Subject Card - Admin only */}
          {isAdmin && (
            <div
              className="subject-click-card add-subject-card"
              onClick={() => setShowAddSubject(!showAddSubject)}
            >
              <span className="subject-card-icon">➕</span>
              <h3>Add Subject</h3>
            </div>
          )}

          {/* Add Subject Form */}
          {showAddSubject && isAdmin && (
            <div className="add-subject-form">
              <form onSubmit={handleAddSubject}>
                <input
                  type="text"
                  placeholder="Subject name"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="subject-input"
                />
                <select
                  value={newSubjectIcon}
                  onChange={(e) => setNewSubjectIcon(e.target.value)}
                  className="subject-icon-select"
                >
                  <option value="📄">📄</option>
                  <option value="💻">💻</option>
                  <option value="🔄">🔄</option>
                  <option value="⚙️">⚙️</option>
                  <option value="📝">📝</option>
                  <option value="📚">📚</option>
                  <option value="🧮">🧮</option>
                  <option value="🔬">🔬</option>
                  <option value="🌐">🌐</option>
                  <option value="📊">📊</option>
                </select>
                <button type="submit" className="add-subject-btn">
                  Add
                </button>
                <button
                  type="button"
                  className="cancel-subject-btn"
                  onClick={() => setShowAddSubject(false)}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Show notes when a subject is selected */}
      {selectedSubject && (
        <div className="subject-notes-view">
          <div className="subject-notes-header">
            <span className="subject-icon">
              {selectedSubject === "All"
                ? "📁"
                : getSubjectIcon(selectedSubject)}
            </span>
            <h2>{selectedSubject}</h2>
            <span className="note-count">{searchedNotes.length} notes</span>
            <button
              className="search-icon-btn"
              onClick={() => setShowSearch(!showSearch)}
              title="Search notes"
            >
              {showSearch ? "✕" : "🔍"}
            </button>
          </div>

          {showSearch && (
            <div className="search-container">
              <input
                type="text"
                placeholder="Search PDFs, images, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                autoFocus
              />
            </div>
          )}

          {searchedNotes.length === 0 ? (
            <p className="no-notes-message">
              {searchQuery
                ? `No notes found for "${searchQuery}" in ${selectedSubject}`
                : `No notes in ${selectedSubject}`}
            </p>
          ) : (
            <div className="notes-grid">
              {searchedNotes.map((note) => (
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
                        <a
                          href={note.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          🖼️ View Image
                        </a>
                      ) : note.fileType === "application/pdf" ? (
                        <a
                          href={note.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          📕 View PDF
                        </a>
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

          {/* Back button at bottom of page */}
          <div className="back-bottom-container">
            <button
              className="back-btn-full"
              onClick={() => setSelectedSubject(null)}
            >
              ← Back to Subjects
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllNotes;
