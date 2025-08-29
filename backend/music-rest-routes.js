export default function setupMusicRestRoutes(app, db) {

  app.get('/api/music-search/:fields/:searchValue', async (req, res) => {
    // get field and searhValue from the request parameters
    let { fields, searchValue } = req.params;
    // convert fields from a string with comma separated values to an array
    fields = fields.split(',');

    // check that every field is a valid field, if not do nothing
    if (!fields.every(field =>
      ['title', 'album', 'artist', 'genre'].includes(field))
    ) {
      res.json({ error: 'Invalid field name!' });
      return;
    }
    // create the where condition for our sql query
    // from the fields chosen
    let where = [];
    for (let field of fields) {
      where.push(`LOWER(meta ->> '$.common.${field}') LIKE LOWER(?)`);
    }
    where = where.join(' OR ');

    // run the db query as a prepared statement
    const [result] = await db.execute(`
    SELECT id,meta->>'$.file' AS fileName,
      meta->>'$.common.title' AS title,
      meta->>'$.common.artist' AS artist,
      meta->>'$.common.album' AS album,
      meta->>'$.common.genre' AS genre
    FROM musicMeta
    WHERE ${where}
    ORDER BY ${fields[0]}
  `, new Array(fields.length).fill('%' + searchValue + '%')
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

}