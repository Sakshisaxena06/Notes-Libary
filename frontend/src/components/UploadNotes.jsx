import { useState, useRef, useEffect } from "react";
import { fetchWithAuth } from "../utils/api";
import "./PageContent.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function UploadNotes({ user, isAdmin }) {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingType, setEditingType] = useState(null); // 'selected' or 'uploaded'
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(""); // Empty by default to force selection
  const [showSubjectSelection, setShowSubjectSelection] = useState(false);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Load uploaded files from backend on mount
  useEffect(() => {
    if (user?._id) {
      fetchUserNotes();
    }
    fetchSubjects();
  }, [user]);

  const fetchSubjects = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/subjects`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchUserNotes = async () => {
    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/notes/user/${user._id}`,
      );
      if (response.ok) {
        const notes = await response.json();
        const filesWithData = notes
          .filter((note) => note.fileUrl)
          .map((note) => ({
            name: note.fileName,
            size: 0, // Size not stored, will show as 0
            type: note.fileType,
            fileUrl: note.fileUrl,
            _id: note._id,
            isFavorite: note.isFavorite || false,
          }));
        setUploadedFiles(filesWithData);
      }
    } catch (error) {
      console.error("Error fetching user notes:", error);
    }
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      // Check file size (Cloudinary free plan limit is 10MB for raw files)
      const maxSize = 10 * 1024 * 1024; // 10 MB
      const oversizedFiles = selectedFiles.filter(
        (file) => file.size > maxSize,
      );

      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map((f) => f.name).join(", ");
        alert(
          `File(s) too large: ${fileNames}\n\nMaximum file size is 10 MB.\nPlease compress or split the file(s) before uploading.`,
        );
        return;
      }

      setSelectedSubject(""); // Reset subject to force selection
      setShowSubjectSelection(true); // Show subject selection
    }
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) {
      // Check file size (Cloudinary free plan limit is 10MB for raw files)
      const maxSize = 10 * 1024 * 1024; // 10 MB
      const oversizedFiles = droppedFiles.filter((file) => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map((f) => f.name).join(", ");
        alert(
          `File(s) too large: ${fileNames}\n\nMaximum file size is 10 MB.\nPlease compress or split the file(s) before uploading.`,
        );
        return;
      }

      setSelectedSubject(""); // Reset subject to force selection
      setShowSubjectSelection(true); // Show subject selection
    }
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const removeFile = (index, e) => {
    e.stopPropagation();
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setShowSubjectSelection(false);
      setSelectedSubject("");
    }
  };

  const removeUploadedFile = async (index, e) => {
    e.stopPropagation();
    const fileToDelete = uploadedFiles[index];

    console.log("Delete request:", {
      fileToDelete,
      user,
      isAdmin,
      userId: user?._id,
      hasUserId: !!user?._id,
    });

    // If file has an ID, delete it from backend
    if (fileToDelete?._id) {
      try {
        // Pass userId and isAdmin for authorization
        const params = new URLSearchParams();
        const userId = user?._id || user?.id;
        if (userId) params.append("userId", userId);
        if (isAdmin) params.append("isAdmin", "true");

        console.log(
          "Delete URL:",
          `${BACKEND_URL}/api/notes/${fileToDelete._id}?${params.toString()}`,
        );

        const response = await fetchWithAuth(
          `${BACKEND_URL}/api/notes/${fileToDelete._id}?${params.toString()}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          const data = await response.json();
          // If note not found (404), still remove from UI
          if (response.status === 404) {
            console.log("Note not found, removing from UI");
          } else {
            alert(data.message || "Cannot delete this note");
            return;
          }
        }
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }

    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

    // Clear AllNotes cache so it will fetch fresh data
    sessionStorage.removeItem("allNotes");
    sessionStorage.removeItem("allSubjects");
  };

  const handleFavorite = async (index, e) => {
    e.stopPropagation();
    const file = uploadedFiles[index];
    if (file?._id) {
      try {
        // Pass userId to verify ownership
        const url = user?._id
          ? `${BACKEND_URL}/api/notes/${file._id}/favorite?userId=${user._id}`
          : `${BACKEND_URL}/api/notes/${file._id}/favorite`;

        const response = await fetchWithAuth(url, {
          method: "PUT",
        });
        const updatedNote = await response.json();
        setUploadedFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, isFavorite: updatedNote.isFavorite } : f,
          ),
        );
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    }
  };

  const handleBrowseClick = (e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileClick = (file, e) => {
    e.stopPropagation();
    let fileURL, fileName, fileType;

    if (file.fileUrl) {
      // It's an uploaded file from the backend (Cloudinary URL is already absolute)
      fileURL = file.fileUrl;
      fileName = file.name;
      fileType = file.type;
    } else {
      // It's a local file selected by the user
      fileURL = URL.createObjectURL(file);
      fileName = file.name;
      fileType = file.type;
    }

    setPreviewFile({ url: fileURL, name: fileName, type: fileType });
  };

  const closePreview = () => {
    if (previewFile?.url) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  // Handle edit button click - allow user to replace the file
  const handleEditClick = (index, type, e) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditingType(type);
    // Trigger hidden file input
    setTimeout(() => {
      editFileInputRef.current?.click();
    }, 100);
  };

  // Handle file replacement
  const handleFileReplace = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      const newFile = selectedFiles[0];
      if (editingType === "selected") {
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[editingIndex] = newFile;
          return newFiles;
        });
      } else if (editingType === "uploaded") {
        setUploadedFiles((prev) => {
          const newFiles = [...prev];
          newFiles[editingIndex] = newFile;
          return newFiles;
        });
      }
    }
    setEditingIndex(null);
    setEditingType(null);
  };

  const handleUpload = async (e) => {
    e?.stopPropagation();
    if (files.length === 0) {
      alert("Please select files to upload");
      return;
    }

    if (!selectedSubject) {
      alert("Please select a subject");
      return;
    }

    if (!user?._id) {
      alert("Please log in to upload files");
      return;
    }

    setLoading(true);

    try {
      for (const file of files) {
        // Get upload signature from backend
        const signatureResponse = await fetchWithAuth(
          `${BACKEND_URL}/api/notes/upload-signature`,
        );

        if (!signatureResponse.ok) {
          throw new Error("Failed to get upload signature");
        }

        const signatureData = await signatureResponse.json();

        // Upload directly to Cloudinary
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append("file", file);
        cloudinaryFormData.append("signature", signatureData.signature);
        cloudinaryFormData.append("timestamp", signatureData.timestamp);
        cloudinaryFormData.append("api_key", signatureData.apiKey);
        cloudinaryFormData.append("folder", signatureData.folder);
        // ✅ FIX: Don't include resource_type in form data - it's in the URL path
        cloudinaryFormData.append("type", "upload");
        cloudinaryFormData.append("access_mode", "public"); // ✅ FIX: Ensure file is publicly accessible

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${signatureData.resourceType}/upload`,
          {
            method: "POST",
            body: cloudinaryFormData,
          },
        );

        if (!cloudinaryResponse.ok) {
          const errorData = await cloudinaryResponse.json();
          throw new Error(
            errorData.error?.message || "Failed to upload to Cloudinary",
          );
        }

        const cloudinaryData = await cloudinaryResponse.json();

        // Create note in database
        const noteResponse = await fetchWithAuth(`${BACKEND_URL}/api/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: user._id,
            title: file.name,
            content: `Uploaded file: ${file.name}`,
            subject: selectedSubject,
            fileUrl: cloudinaryData.secure_url,
            fileName: file.name,
            fileType: file.type,
            cloudinaryId: cloudinaryData.public_id,
          }),
        });

        if (!noteResponse.ok) {
          throw new Error("Failed to save note");
        }

        const note = await noteResponse.json();

        // Add to uploaded files list
        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type,
            fileUrl: cloudinaryData.secure_url,
            _id: note._id,
          },
        ]);
      }

      // Clear selected files
      setFiles([]);
      setSelectedSubject("");
      setShowSubjectSelection(false);

      // Clear AllNotes cache so it will fetch fresh data
      sessionStorage.removeItem("allNotes");
      sessionStorage.removeItem("allSubjects");

      // Show success popup
      setShowPopup(true);
      // Hide popup after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    if (extension === "pdf") return "📕";
    if (["doc", "docx"].includes(extension)) return "📘";
    if (["png", "jpg", "jpeg", "gif"].includes(extension)) return "🖼️";
    return "📄";
  };

  return (
    <div className="page-content">
      {/* Hidden input for file replacement */}
      <input
        type="file"
        ref={editFileInputRef}
        className="file-input"
        style={{ display: "none" }}
        onChange={handleFileReplace}
        accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
      />

      {/* Success Popup */}
      {showPopup && (
        <div className="success-popup">
          <span className="popup-icon">✓</span>
          <span className="popup-text">Your file uploaded successfully!</span>
        </div>
      )}

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
              <iframe src={previewFile.url} title={previewFile.name} />
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
        Upload your notes from your computer or any device to share or backup.
      </p>

      <div
        className={`upload-area ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-box" onClick={handleBrowseClick}>
          <span className="upload-icon">📁</span>
          <p className="upload-text">Drag and drop files here</p>
          <p className="upload-subtitle">or click to browse from your device</p>
          <input
            type="file"
            ref={fileInputRef}
            className="file-input"
            multiple
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
          />
        </div>
      </div>

      <div className="supported-formats">
        <h3>Supported Formats:</h3>
        <p>PDF, Word Documents (DOC/DOCX), Text Files, Images (PNG/JPG)</p>
        <p className="file-size-limit">
          Maximum file size: 10 MB (Cloudinary free plan limit)
        </p>
      </div>

      {/* Subject Selection - Show when files are added */}
      {(files.length > 0 || showSubjectSelection) && (
        <div className="subject-selection">
          <label>Select Subject: </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="subject-select"
            required
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {files.length > 0 && (
        <div className="uploaded-files">
          <h3>Selected Files ({files.length})</h3>
          <div className="file-grid">
            {files.map((file, index) => (
              <div key={index} className="file-card">
                <div
                  className="file-main"
                  onClick={(e) => handleFileClick(file, e)}
                >
                  <span className="file-icon">{getFileIcon(file)}</span>
                  <div className="file-info">
                    <span className="file-name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="file-size">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <div className="file-actions">
                  <button
                    className="action-btn view"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileClick(file, e);
                    }}
                    title="View"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={(e) => handleEditClick(index, "selected", e)}
                    title="Replace/Edit"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={(e) => removeFile(index, e)}
                    title="Delete"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading
              ? "Uploading..."
              : `Upload ${files.length} File${files.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h3>Uploaded Files ({uploadedFiles.length})</h3>
          <div className="file-grid">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-card uploaded">
                <div
                  className="file-main"
                  onClick={(e) => handleFileClick(file, e)}
                >
                  <span className="file-icon">{getFileIcon(file)}</span>
                  <div className="file-info">
                    <span className="file-name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="file-size">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <div className="file-actions">
                  <button
                    className={`action-btn favorite ${file.isFavorite ? "active" : ""}`}
                    onClick={(e) => handleFavorite(index, e)}
                    title={
                      file.isFavorite
                        ? "Remove from Favorites"
                        : "Add to Favorites"
                    }
                  >
                    {file.isFavorite ? "⭐" : "☆"}
                  </button>
                  <button
                    className="action-btn view"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileClick(file, e);
                    }}
                    title="View"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={(e) => handleEditClick(index, "uploaded", e)}
                    title="Replace/Edit"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={(e) => removeUploadedFile(index, e)}
                    title="Delete"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
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
