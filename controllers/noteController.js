const mongoose = require('mongoose');
const Note = require('../models/Note');
const { asyncHandler } = require('../middleware/errorHandler');
const appEvents = require('../events/appEvents');

const publicNote = (note) => ({
  _id: note._id.toString(),
  title: note.title,
  content: note.content,
  owner: note.owner.toString(),
  createdAt: note.createdAt,
  updatedAt: note.updatedAt
});

const isOwnerOrAdmin = (note, user) =>
  user.role === 'admin' || note.owner.toString() === user.id;

// Loads a note and applies 400/404/403 checks shared by get/update/delete.
async function loadNote(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: 'Invalid note id' });
    return null;
  }

  const note = await Note.findById(id);
  if (!note) {
    res.status(404).json({ message: 'Note not found' });
    return null;
  }

  if (!isOwnerOrAdmin(note, req.user)) {
    res.status(403).json({ message: 'Access denied' });
    return null;
  }

  return note;
}

const createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const note = await Note.create({ title, content, owner: req.user.id });
  appEvents.emit('note:created', note);

  return res.status(201).json(publicNote(note));
});

const listNotes = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { owner: req.user.id };
  const notes = await Note.find(filter).sort({ createdAt: -1 });
  res.json(notes.map(publicNote));
});

const getNote = asyncHandler(async (req, res) => {
  const note = await loadNote(req, res);
  if (!note) return;
  res.json(publicNote(note));
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await loadNote(req, res);
  if (!note) return;

  const { title, content } = req.body || {};
  if (title === undefined && content === undefined) {
    return res.status(400).json({ message: 'Provide a title or content to update' });
  }

  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  await note.save();

  res.json(publicNote(note));
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await loadNote(req, res);
  if (!note) return;

  await note.deleteOne();
  appEvents.emit('note:deleted', { id: note._id.toString(), owner: note.owner.toString() });

  res.json({ message: 'Note deleted' });
});

module.exports = { createNote, listNotes, getNote, updateNote, deleteNote };
