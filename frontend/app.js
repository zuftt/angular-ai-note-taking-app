const API_URL = 'http://localhost:3000/api';
let currentNote = null;
let currentFolderId = null;

async function loadNotes() {
  const url = currentFolderId ? `${API_URL}/notes?folderId=${currentFolderId}` : `${API_URL}/notes`;
  const res = await fetch(url);
  const data = await res.json();

  const list = document.getElementById('notesList');
  if (!data.success || !data.data.length) {
    list.innerHTML = '<p style="color: #999;">No notes yet</p>';
    return;
  }

  list.innerHTML = data.data.map(note => `
    <div style="padding: 12px; border: 1px solid #ddd; margin: 8px 0; cursor: pointer; border-radius: 4px;" onclick="selectNote('${note._id}')">
      <strong>${note.title}</strong>
      <p style="color: #666; font-size: 12px; margin: 4px 0;">${note.content.substring(0, 100)}</p>
      <div style="font-size: 11px; color: #999;">${note.wordCount} words</div>
    </div>
  `).join('');
}

async function selectNote(id) {
  const res = await fetch(`${API_URL}/notes/${id}`);
  const data = await res.json();
  currentNote = data.data;

  document.getElementById('notesListSection').style.display = 'none';
  document.getElementById('editorSection').style.display = 'flex';
  document.getElementById('noteTitle').value = currentNote.title;
  document.getElementById('noteContent').value = currentNote.content;
  updateWordCount();
}

async function newNote() {
  const title = prompt('Note title:');
  if (!title) return;

  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, folderId: currentFolderId })
  });
  const data = await res.json();
  if (data.success) {
    selectNote(data.data._id);
    loadNotes();
  }
}

async function saveNote() {
  if (!currentNote) return;
  const title = document.getElementById('noteTitle').value;
  const content = document.getElementById('noteContent').value;

  await fetch(`${API_URL}/notes/${currentNote._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });

  currentNote.title = title;
  currentNote.content = content;
  updateWordCount();
}

async function deleteNote() {
  if (!currentNote || !confirm('Delete this note?')) return;
  await fetch(`${API_URL}/notes/${currentNote._id}`, { method: 'DELETE' });
  currentNote = null;
  document.getElementById('notesListSection').style.display = 'block';
  document.getElementById('editorSection').style.display = 'none';
  loadNotes();
}

function updateWordCount() {
  const words = document.getElementById('noteContent').value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('wordCount').textContent = words;
}

async function newFolder() {
  const name = prompt('Folder name:');
  if (!name) return;
  const res = await fetch(`${API_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if ((await res.json()).success) loadFolders();
}

async function selectFolder(id) {
  currentFolderId = id;
  loadNotes();
  document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('active'));
  event.target.classList.add('active');
}

async function loadFolders() {
  const res = await fetch(`${API_URL}/folders/tree`);
  const data = await res.json();
  const list = document.getElementById('folders');
  list.innerHTML = data.data?.map(f => `
    <div class="folder-item" onclick="selectFolder('${f._id}')">${f.name}</div>
  `).join('') || '';
}

function updateWordCount() {
  const words = (document.getElementById('noteContent').value || '').trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('wordCount').textContent = words;
}

async function summarize() {
  if (!currentNote) return;
  alert('Summarize feature requires the Edge LLM model to load (~500MB). This will happen when you click this button.');
}

async function generateTags() {
  if (!currentNote) return;
  alert('Tag generation feature requires the Edge LLM model.');
}

function handleQuestion(e) {
  if (e.key === 'Enter') askQuestion();
}

async function askQuestion() {
  if (!currentNote) return;
  alert('Q&A feature requires the Edge LLM model.');
}

// Initialize
loadFolders();
loadNotes();
document.getElementById('noteContent').addEventListener('input', updateWordCount);
