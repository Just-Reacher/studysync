/* ─────────────────────────────────────────────
   StudySync — controllers/noteController.js
───────────────────────────────────────────── */
const { query }        = require('../config/db');
const { asyncHandler } = require('../utils/helpers');

const getNotes = asyncHandler(async (req, res) => {
  const { subject, type, bookmarked, search } = req.query;
  let sql = 'SELECT * FROM notes WHERE user_id = $1';
  const params = [req.user.id]; let idx = 2;

  if (subject)    { sql += ` AND subject = $${idx++}`;      params.push(subject); }
  if (type)       { sql += ` AND type = $${idx++}`;         params.push(type); }
  if (bookmarked) { sql += ` AND bookmarked = $${idx++}`;   params.push(bookmarked === 'true'); }
  if (search) {
    sql += ` AND (title ILIKE $${idx} OR content ILIKE $${idx} OR $${idx} = ANY(tags))`;
    params.push(`%${search}%`); idx++;
  }

  sql += ' ORDER BY bookmarked DESC, updated_at DESC';
  const result = await query(sql, params);
  res.json({ notes: result.rows });
});

const getNote = asyncHandler(async (req, res) => {
  const r = await query('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!r.rows.length) return res.status(404).json({ message: 'Note not found.' });
  res.json(r.rows[0]);
});

const createNote = asyncHandler(async (req, res) => {
  const { title, subject, type = 'summary', content, tags = [] } = req.body;
  const r = await query(
    `INSERT INTO notes (user_id, title, subject, type, content, tags)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, title.trim(), subject, type, content.trim(), tags]
  );
  res.status(201).json({ note: r.rows[0] });
});

const updateNote = asyncHandler(async (req, res) => {
  const exists = await query('SELECT id FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!exists.rows.length) return res.status(404).json({ message: 'Note not found.' });

  const { title, subject, type, content, tags, bookmarked } = req.body;
  const r = await query(
    `UPDATE notes SET
       title      = COALESCE($1, title),
       subject    = COALESCE($2, subject),
       type       = COALESCE($3, type),
       content    = COALESCE($4, content),
       tags       = COALESCE($5, tags),
       bookmarked = COALESCE($6, bookmarked)
     WHERE id = $7 AND user_id = $8 RETURNING *`,
    [title, subject, type, content, tags, bookmarked, req.params.id, req.user.id]
  );
  res.json(r.rows[0]);
});

const patchNote = asyncHandler(async (req, res) => {
  const fields = []; const params = []; let idx = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (['title','subject','type','content','tags','bookmarked'].includes(k)) {
      fields.push(`${k} = $${idx++}`); params.push(v);
    }
  }
  if (!fields.length) return res.status(400).json({ message: 'Nothing to update.' });
  params.push(req.params.id, req.user.id);
  const r = await query(
    `UPDATE notes SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`,
    params
  );
  if (!r.rows.length) return res.status(404).json({ message: 'Note not found.' });
  res.json(r.rows[0]);
});

const deleteNote = asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (!r.rows.length) return res.status(404).json({ message: 'Note not found.' });
  res.json({ message: 'Note deleted.', id: req.params.id });
});

module.exports = { getNotes, getNote, createNote, updateNote, patchNote, deleteNote };