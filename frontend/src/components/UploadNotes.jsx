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
        fetchWithAuth(`${BACKEND_URL}/api/subjects`).then((res) => res.json())
      );

      if (user?._id) {
        promises.push(
          fetchWithAuth(`${BACKEND_URL}/api/notes/user/${user._id}`).then(
            (res) => res.json()
          )
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

    setPreviewFile({ url: fileURL, name: fileName, type: fileType });
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

            {/* ✅ FIXED PREVIEW LOGIC */}
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

      {/* Keep your remaining UI same */}
      <h1>Upload Notes</h1>
      <p>Upload your notes from your computer or any device to share or backup.</p>

      {/* (rest of your code unchanged...) */}
    </div>
  );
}

export default UploadNotes;