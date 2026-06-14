import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function NoteEditor() {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Search/Filters
  const [search, setSearch] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterPinned, setFilterPinned] = useState(false);
  const [filterFav, setFilterFav] = useState(false);

  // Editor states
  const [selectedNote, setSelectedNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState("gray");
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  
  const [editMode, setEditMode] = useState("write"); // write, preview
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSubjectId, setUploadSubjectId] = useState("");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Colors mapping
  const colors = ["gray", "red", "green", "blue", "yellow", "purple"];

  useEffect(() => {
    loadNotes();
    loadSubjects();
  }, [search, filterColor, filterPinned, filterFav]);

  async function loadNotes() {
    try {
      let url = "/notes/?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (filterColor) url += `color=${filterColor}&`;
      if (filterPinned) url += `is_pinned=true&`;
      if (filterFav) url += `is_favorite=true&`;
      
      const res = await api.get(url);
      setNotes(res.data);
      if (res.data.length > 0 && !selectedNote) {
        selectNote(res.data[0]);
      }
    } catch {
      setErrorMsg("Failed to load notes.");
    }
  }

  async function loadSubjects() {
    try {
      const res = await api.get("/subjects/");
      setSubjects(res.data);
    } catch {}
  }

  function selectNote(note) {
    setSelectedNote(note);
    setTitle(note.filename || "");
    setContent(note.content || "");
    setTags(note.tags || "");
    setColor(note.color || "gray");
    setIsPinned(note.is_pinned || false);
    setIsFavorite(note.is_favorite || false);
    setSelectedSubjectId(note.subject_id || "");
    setEditMode("write");
  }

  async function handleCreateNewNote() {
    try {
      const res = await api.post("/notes/", {
        title: "Untitled Note",
        content: "# New Note\n\nStart typing markdown here...",
        tags: "",
        color: "gray",
        is_pinned: false,
        is_favorite: false
      });
      loadNotes();
      setSuccessMsg("Blank note created!");
      setTimeout(() => setSuccessMsg(""), 3000);
      
      // Auto select the new note
      const newNote = {
        id: res.data.id,
        filename: "Untitled Note",
        content: "# New Note\n\nStart typing markdown here...",
        tags: "",
        color: "gray",
        is_pinned: false,
        is_favorite: false
      };
      setSelectedNote(newNote);
      selectNote(newNote);
    } catch {
      setErrorMsg("Error creating note.");
    }
  }

  async function handleSaveNote() {
    if (!selectedNote) return;
    try {
      await api.put(`/notes/${selectedNote.id}`, {
        title,
        content,
        tags,
        color,
        is_pinned: isPinned,
        is_favorite: isFavorite,
        subject_id: selectedSubjectId ? parseInt(selectedSubjectId) : null,
        subject: subjects.find(s => s.id === parseInt(selectedSubjectId))?.name || ""
      });
      setSuccessMsg("Note saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadNotes();
    } catch {
      setErrorMsg("Error saving note.");
    }
  }

  async function handleDeleteNote() {
    if (!selectedNote) return;
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.delete(`/notes/${selectedNote.id}`);
      setSelectedNote(null);
      loadNotes();
      setSuccessMsg("Note deleted.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setErrorMsg("Error deleting note.");
    }
  }

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!uploadFile) {
      setErrorMsg("Select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", uploadFile);
    if (uploadSubjectId) {
      formData.append("subject_id", uploadSubjectId);
      formData.append("subject", subjects.find(s => s.id === parseInt(uploadSubjectId))?.name || "");
    }
    try {
      await api.post("/notes/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccessMsg("File uploaded successfully!");
      setUploadFile(null);
      loadNotes();
    } catch {
      setErrorMsg("File upload failed.");
    }
  }

  // Basic Markdown compiler
  const compileMarkdown = (text) => {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold, headers, code, breaks
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold border-b border-white/10 pb-1 mt-4 mb-2 text-white">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-3 mb-2 text-white">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-2 mb-1 text-white">$1</h3>');
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
    html = html.replace(/`(.*)`/gim, '<code class="bg-black/50 px-1 py-0.5 rounded font-mono text-xs text-pink-300">$1</code>');
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/\n/gim, "<br/>");
    return html;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
      {/* LEFT PANEL: LIST OF NOTES (Cols 1-4) */}
      <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-100">My Notebook</h2>
          <button
            onClick={handleCreateNewNote}
            className="px-3 py-1.5 bg-primary text-white hover:bg-primary/95 text-xs font-semibold rounded-lg shadow transition"
          >
            + New Note
          </button>
        </div>

        {/* Search & filters */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search notes/tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 text-xs border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-primary"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setFilterPinned(!filterPinned)}
              className={`flex-1 py-1 px-2 border rounded-lg text-[10px] font-semibold transition ${
                filterPinned 
                  ? "bg-primary border-primary text-white" 
                  : "border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              📌 Pinned
            </button>
            <button
              onClick={() => setFilterFav(!filterFav)}
              className={`flex-1 py-1 px-2 border rounded-lg text-[10px] font-semibold transition ${
                filterFav 
                  ? "bg-primary border-primary text-white" 
                  : "border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              ⭐️ Favorites
            </button>
          </div>
        </div>

        {/* Notes feed list */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
          {notes.map((n) => {
            const labelColor = 
              n.color === "red" ? "border-l-4 border-red-500" :
              n.color === "green" ? "border-l-4 border-emerald-500" :
              n.color === "blue" ? "border-l-4 border-blue-500" :
              n.color === "yellow" ? "border-l-4 border-yellow-500" :
              n.color === "purple" ? "border-l-4 border-purple-500" :
              "border-l-4 border-gray-500";
            return (
              <div
                key={n.id}
                onClick={() => selectNote(n)}
                className={`p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition flex items-center justify-between ${labelColor} ${
                  selectedNote?.id === n.id ? "bg-white/15 border-white/30" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-200 truncate max-w-[180px]">
                    {n.filename}
                  </div>
                  {n.tags && (
                    <div className="flex gap-1">
                      {n.tags.split(",").map((tag) => (
                        <span key={tag} className="text-[9px] bg-black/40 text-gray-400 px-1 py-0.5 rounded">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {n.url && (
                    <span className="text-[9px] bg-secondary/20 text-secondary px-1.5 py-0.2 rounded-full border border-secondary/20">
                      📄 Document
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {n.is_pinned && <span className="text-xs">📌</span>}
                  {n.is_favorite && <span className="text-xs">⭐️</span>}
                </div>
              </div>
            );
          })}
          {notes.length === 0 && (
            <p className="text-center text-xs text-gray-500 py-12">No notes found.</p>
          )}
        </div>

        {/* Upload attachment card */}
        <form onSubmit={handleFileUpload} className="border-t border-white/10 pt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-300">Upload PDF / Image</p>
          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files[0])}
            className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-gray-200 hover:file:bg-white/20"
          />
          <div className="flex gap-1.5">
            <select
              value={uploadSubjectId}
              onChange={(e) => setUploadSubjectId(e.target.value)}
              className="flex-1 bg-black/40 text-[10px] border border-white/10 rounded-lg px-2 py-1 text-gray-200"
            >
              <option value="">Subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-1 bg-secondary hover:bg-secondary/95 text-[10px] font-bold text-white rounded-lg shadow"
            >
              Upload
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT PANEL: EDITOR / VIEWER WORKSPACE (Cols 5-12) */}
      <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col space-y-4">
        {successMsg && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs p-2 rounded-xl text-center">
            {successMsg}
          </div>
        )}

        {selectedNote ? (
          <>
            {/* Header toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent text-xl font-bold text-gray-100 focus:outline-none border-b border-transparent focus:border-primary pb-0.5"
                />
              </div>

              <div className="flex items-center gap-2 self-end">
                <button
                  onClick={() => setEditMode(editMode === "write" ? "preview" : "write")}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-semibold"
                >
                  {editMode === "write" ? "👁️ Preview" : "✏️ Edit"}
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold shadow"
                >
                  Save Note
                </button>
                <button
                  onClick={handleDeleteNote}
                  className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 hover:bg-red-500/35 text-red-400 rounded-lg text-xs font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Note details toolbar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/20 p-3 rounded-xl border border-white/5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <label className="text-gray-400">Subject:</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5"
                >
                  <option value="">None</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-gray-400">Label:</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 uppercase text-[10px]"
                >
                  {colors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                  />
                  <span>📌 Pin</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                  />
                  <span>⭐️ Favorite</span>
                </label>
              </div>

              <div className="flex items-center gap-1">
                <label className="text-gray-400">Tags:</label>
                <input
                  type="text"
                  placeholder="tag1, tag2"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-2 py-0.5 w-full focus:outline-none"
                />
              </div>
            </div>

            {/* Editing / Preview area */}
            <div className="flex-1 min-h-[300px] flex flex-col">
              {selectedNote.url ? (
                // PDF / File attachment preview
                <div className="flex-1 bg-black/30 rounded-xl p-4 flex flex-col items-center justify-center space-y-4">
                  <span className="text-5xl">📄</span>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-200">{selectedNote.filename}</p>
                    <p className="text-xs text-gray-400">Attached document</p>
                  </div>
                  <a
                    href={selectedNote.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-bold hover:scale-105 transition"
                  >
                    View / Download Document
                  </a>
                </div>
              ) : editMode === "write" ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Markdown editor... Use headings, bullet lists, bold text, etc."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-200 focus:outline-none focus:border-primary resize-none h-[300px]"
                />
              ) : (
                <div
                  className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 overflow-y-auto text-xs text-gray-300 leading-relaxed max-h-[350px]"
                  dangerouslySetInnerHTML={{ __html: compileMarkdown(content) }}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-24">
            <span className="text-5xl mb-4">📓</span>
            <p className="text-sm">No notes open. Select a note from the list or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
