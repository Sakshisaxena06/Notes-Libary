import { useState, useRef, useEffect } from "react";
import { fetchWithAuth } from "../utils/api";
import "./PageContent.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function UploadNotes({ user, isAdmin }) {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showSubjectSelection, setShowSubjectSelection] = useState(false);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const promises = [];

      promises.push(
        fetchWithAuth(`${BACKEND_URL}/api/subjects`).then((res) => res.json()),
      );

      if (user?._id) {
        promises.push(
          fetchWithAuth(`${BACKEND_URL}/api/notes/user/${user._id}`).then(
            (res) => res.json(),
          ),
        );
      }

      const results = await Promise.all(promises);

      setSubjects(results[0] || []);

      if (user?._id && results[1]) {
        const filesWithData = (results[1] || [])
          .filter((note) => note.fileUrl)
          .map((note) => ({
            name: note.fileName,
            size: 0,
            type: note.fileType,
            fileUrl: note.fileUrl,
            _id: note._id,
            isFavorite: note.isFavorite || false,
          }));
        setUploadedFiles(filesWithData);
      }
    };

    fetchData().catch(console.error);
  }, [user]);

  const handleFileClick = (file, e) => {
    e.stopPropagation();
    let fileURL, fileName, fileType;

    if (file.fileUrl) {
      fileURL = file.fileUrl.startsWith("http")
        ? file.fileUrl
        : `${BACKEND_URL}${file.fileUrl}`;
      fileName = file.name;
      fileType = file.type;
    } else {
      fileURL = URL.createObjectURL(file);
      fileName = file.name;
      fileType = file.type;
    }

    // Open in new tab
    window.open(fileURL, "_blank", "noopener,noreferrer");
  };

  const closePreview = () => {
    if (previewFile?.url) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  const getFileIcon = (file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    if (extension === "pdf") return "📕";
    if (["doc", "docx"].includes(extension)) return "📘";
    if (["png", "jpg", "jpeg", "gif"].includes(extension)) return "🖼️";
    return "📄";
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  // Upload file to backend and create a public note
  const handleUpload = async (file, subject) => {
    setLoading(true);
    try {
      // Step 1: Upload file to Cloudinary
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetchWithAuth(
        `${BACKEND_URL}/api/notes/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const uploadData = await uploadResponse.json();

      // Step 2: Create a note with the file info (will be visible to all)
      const noteData = {
        title: file.name,
        content: `Uploaded file: ${file.name}`,
        subject: subject || "General",
        fileUrl: uploadData.fileUrl,
        fileName: uploadData.fileName,
        fileType: uploadData.fileType,
        cloudinaryId: uploadData.cloudinaryId,
      };

      const noteResponse = await fetchWithAuth(`${BACKEND_URL}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noteData),
      });

      if (!noteResponse.ok) {
        throw new Error("Failed to create note");
      }

      const note = await noteResponse.json();

      // Add to uploaded files
      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          size: file.size,
          type: file.type,
          fileUrl: uploadData.fileUrl,
          _id: note._id,
          isFavorite: false,
        },
      ]);

      return true;
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Failed to upload ${file.name}: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle upload all files
  const handleUploadAll = async () => {
    if (files.length === 0) {
      alert("Please select files to upload");
      return;
    }

    const subject = selectedSubject || "General";

    for (const file of files) {
      await handleUpload(file, subject);
    }

    setFiles([]);
    alert("All files uploaded successfully!");
  };

  // Remove file from selection
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Delete uploaded file
  const handleDelete = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const params = new URLSearchParams();
      if (user?._id) params.append("userId", user._id);
      if (isAdmin) params.append("isAdmin", "true");

      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/notes/${fileId}?${params.toString()}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setUploadedFiles(uploadedFiles.filter((f) => f._id !== fileId));
      } else {
        const data = await response.json();
        alert(data.message || "Cannot delete this file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Handle favorite
  const handleFavorite = async (fileId) => {
    try {
      const url = user?._id
        ? `${BACKEND_URL}/api/notes/${fileId}/favorite?userId=${user._id}`
        : `${BACKEND_URL}/api/notes/${fileId}/favorite`;

      const response = await fetchWithAuth(url, {
        method: "PUT",
      });
      const updatedNote = await response.json();

      setUploadedFiles(
        uploadedFiles.map((f) =>
          f._id === fileId ? { ...f, isFavorite: updatedNote.isFavorite } : f,
        ),
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <div className="page-content">
      {/* Preview Modal */}
      {previewFile && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>
              ✕
            </button>

            <h3>{previewFile.name}</h3>

            {previewFile.type.startsWith("image/") ? (
              <img src={previewFile.url} alt={previewFile.name} />
            ) : previewFile.type === "application/pdf" ? (
              <>
                <iframe
                  src={`https://docs.google.com/gview?url=${previewFile.url}&embedded=true`}
                  width="100%"
                  height="500px"
                  title={previewFile.name}
                />
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    marginTop: "10px",
                    textAlign: "center",
                  }}
                >
                  🔗 Open in new tab
                </a>
              </>
            ) : (
              <div className="preview-not-available">
                <span className="file-icon">{getFileIcon(previewFile)}</span>
                <p>Preview not available</p>
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="download-link"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <h1>Upload Notes</h1>
      <p>
        Upload your notes from your computer or any device to share with
        everyone.
      </p>

      {/* Subject Selection */}
      <div className="subject-selection">
        <label htmlFor="subject">Select Subject: </label>
        <select
          id="subject"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="subject-select"
        >
          <option value="">Choose a subject...</option>
          {subjects.map((subject) => (
            <option key={subject._id} value={subject.name}>
              {subject.icon} {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* File Input Area */}
      <div className="upload-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
          id="file-upload"
          style={{ display: "none" }}
        />
        <label htmlFor="file-upload" className="file-label">
          📁 Choose Files
        </label>
        <p className="upload-subtitle">Supports PDF, DOC, DOCX, TXT, Images</p>
      </div>

      {/* Selected Files to Upload */}
      {files.length > 0 && (
        <div className="selected-files">
          <h3>Files to Upload ({files.length})</h3>
          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-icon">{getFileIcon(file)}</span>
                <span className="file-name">{file.name}</span>
                <span className="file-size">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  className="remove-file-btn"
                  onClick={() => removeFile(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            className="upload-btn"
            onClick={handleUploadAll}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload All Files"}
          </button>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h3>Your Uploaded Files</h3>
          <div className="file-grid">
            {uploadedFiles.map((file) => (
              <div
                key={file._id}
                className="file-card"
                onClick={(e) => handleFileClick(file, e)}
              >
                <div className="file-card-icon">{getFileIcon(file)}</div>
                <div className="file-card-name" title={file.name}>
                  {file.name}
                </div>
                <div className="file-card-actions">
                  <button
                    className={`favorite-btn ${file.isFavorite ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(file._id);
                    }}
                  >
                    {file.isFavorite ? "⭐" : "☆"}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file._id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadNotes;
