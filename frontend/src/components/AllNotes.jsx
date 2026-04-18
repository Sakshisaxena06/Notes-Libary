import { useState, useEffect, useMemo } from "react";
import { fetchWithAuth, BACKEND_URL } from "../utils/api";
import { useNotesCache } from "../hooks/useNotesCache";
import "./PageContent.css";

const getCorrectFileUrl = (fileUrl) => fileUrl;

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

  const { fetchWithCache, clearCache } = useNotesCache(user, isAdmin);

  useEffect(() => {
    let isMounted = true;
    let ignore = false;

    const loadData = async () => {
      try {
        const params = user?._id ? { currentUserId: user._id } : {};

        const [notesData, subjectsData] = await Promise.all([
          fetchWithCache("/api/notes", params, {
            cacheKey: "allNotes",
            cacheDuration: 60000,
          }),
          fetchWithCache("/api/subjects", {}, {
            cacheKey: "allSubjects",
            cacheDuration: 300000,
          }),
        ]);

        if (!ignore && isMounted) {
          setNotes(notesData || []);
          setSubjects(subjectsData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { ignore = true; isMounted = false; };
  }, [user?._id]);

  useEffect(() => {
    if (prevSubject !== null && prevSubject !== selectedSubject) {
      setSearchQuery("");
      setShowSearch(false);
    }
    setPrevSubject(selectedSubject);
  }, [selectedSubject, prevSubject]);

  const getSubjectIcon = (subjectName) => {
    const subject = subjects.find((s) => s.name === subjectName);
    return subject?.icon || "📄";
  };

  const filteredNotes = selectedSubject
    ? selectedSubject === "All"
      ? notes
      : notes.filter((note) => note.subject === selectedSubject)
    : [];

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

  const groupedNotes = useMemo(() => {
    return subjects.reduce((acc, subject) => {
      acc[subject.name] = notes.filter((note) => note.subject === subject.name);
      return acc;
    }, {});
  }, [subjects, notes]);

  const handleDelete = async (id) => {
    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/notes/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setNotes(notes.filter((note) => note._id !== id));
        clearCache("allNotes");
      } else {
        const data = await response.json();
        if (response.status === 404) {
          setNotes(notes.filter((note) => note._id !== id));
          clearCache("allNotes");
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
        note._id === id
          ? { ...note, isFavoritedByCurrentUser: !wasFavorited }
          : note
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
          note._id === id
            ? { ...note, isFavoritedByCurrentUser: wasFavorited }
            : note
        )
      );
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubjectName, icon: newSubjectIcon }),
      });

      if (response.ok) {
        const newSubject = await response.json();
        setSubjects([...subjects, newSubject]);
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
      alert("Failed to add subject. Check your connection.");
    }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!confirm(`Are you sure you want to delete "${subjectName}"?`)) return;

    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/subjects/${subjectId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setSubjects(subjects.filter((s) => s._id !== subjectId));
        alert("Subject deleted successfully!");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete subject");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      alert("Failed to delete subject. Check your connection.");
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

      {!selectedSubject && (
        <div className="subject-cards-container">
          <div
            className="subject-click-card all-card"
            onClick={() => setSelectedSubject("All")}
          >
            <span className="subject-card-icon">📁</span>
            <h3>All Notes</h3>
            <span className="subject-card-count">{notes.length} notes</span>
          </div>

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

          {isAdmin && (
            <div
              className="subject-click-card add-subject-card"
              onClick={() => setShowAddSubject(!showAddSubject)}
            >
              <span className="subject-card-icon">➕</span>
              <h3>Add Subject</h3>
            </div>
          )}

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
                <button type="submit" className="add-subject-btn">Add</button>
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

      {selectedSubject && (
        <div className="subject-notes-view">
          <div className="subject-notes-header">
            <span className="subject-icon">
              {selectedSubject === "All" ? "📁" : getSubjectIcon(selectedSubject)}
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
                      className={`favorite-btn ${note.isFavoritedByCurrentUser ? "active" : ""}`}
                      onClick={() => handleFavorite(note._id)}
                    >
                      {note.isFavoritedByCurrentUser ? "⭐" : "☆"}
                    </button>
                  </div>
                  {note.fileUrl ? (
                    <div className="note-file-preview">
                      {note.fileType?.startsWith("image/") ? (
                        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                          🖼️ View Image
                        </a>
                      ) : note.fileType === "application/pdf" ? (
                        <a href={getCorrectFileUrl(note.fileUrl)} target="_blank" rel="noopener noreferrer" className="file-link">
                          📕 View PDF
                        </a>
                      ) : (
                        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                          📄 View File
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="note-content">{note.content}</p>
                  )}
                  <div className="note-footer">
                    <span className="note-category">{note.subject || note.category}</span>
                    {(isAdmin || note.user === user?._id) && (
                      <button className="delete-btn" onClick={() => handleDelete(note._id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="back-bottom-container">
            <button className="back-btn-full" onClick={() => setSelectedSubject(null)}>
              ← Back to Subjects
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllNotes;