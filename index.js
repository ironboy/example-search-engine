import express from 'express';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';

// connect to db
const db = await mysql.createConnection(dbCredentials);

// create a web server - app
const app = express();

app.get('/api/music-search/:field/:searchValue', async (req, res) => {
  // get field and searhValue from the request parameters
  const { field, searchValue } = req.params;
  // check that field is a valid field, if not do nothing
  if (!['title', 'album', 'artist', 'genre'].includes(field)) {
    res.json({ error: 'Invalid field name!' });
    return;
  }
  // run the db query as a prepared statement
  const [result] = await db.execute(`
    SELECT id,meta->>'$.file' AS fileName,
      meta->>'$.common.title' AS title,
      meta->>'$.common.artist' AS artist,
      meta->>'$.common.album' AS album,
      meta->>'$.common.genre' AS genre
    FROM musicMeta
    WHERE LOWER(meta->>'$.common.${field}') LIKE LOWER(?)
  `, ['%' + searchValue + '%']
  );
  // return the result as json
  res.json(result);
});

// get all metadata for a single track (by id)
app.get('/api/music-all-meta/:id', async (req, res) => {
  const { id } = req.params;
  let [result] = await db.execute(`
    SELECT * FROM musicMeta WHERE id = ?
  `, [id]);
  res.json(result);
});


// Start the web server
app.listen(3010, () => console.log('Listening on http://localhost:3010'));