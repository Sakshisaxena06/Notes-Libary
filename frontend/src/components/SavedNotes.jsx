import "./PageContent.css";

function SavedNotes() {
  return (
    <div className="page-content">
      <h1>Saved Notes</h1>
      <p>Access all your saved notes in one place.</p>
      <div className="notes-list">
        <p className="empty-state">
          No saved notes yet. Save some notes to see them here!
        </p>
      </div>
    </div>
  );
}

export default SavedNotes;
