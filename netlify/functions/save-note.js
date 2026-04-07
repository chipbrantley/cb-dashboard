const { google } = require('googleapis');

const DOC_ID = '1CWdGrZUHhgr0z2tUz-sIupluXHQZN1k_n_CnPSsBOAc';

const HABIT_NAMES = {
  lemon:    'Lemon water',
  stoic:    'Stoic',
  bear:     'Bear',
  moby:     'Moby Dick',
  french:   'French',
  draw:     'Draw',
  meditate: 'Meditate',
  anatomy:  'Anatomy',
  exercise: 'Exercise',
  stretch:  'Stretch',
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { refresh_token, date, notes, habits } = body;

  if (!refresh_token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No refresh token' }) };
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://cb-dash.netlify.app/auth/callback'
  );
  oauth2Client.setCredentials({ refresh_token });

  try {
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // Build habit summary line
    const habitLine = Object.entries(HABIT_NAMES)
      .map(([id, name]) => `${habits[id] ? '✓' : '✗'} ${name}`)
      .join('   ');

    // Format the entry
    const dateHeader = `\n${date}\n`;
    const habitSection = `Habits: ${habitLine}\n`;
    const notesSection = notes && notes.trim()
      ? `\n${notes.trim()}\n`
      : '';
    const divider = `\n─────────────────────────────────────────\n`;

    const fullEntry = dateHeader + habitSection + notesSection + divider;

    // Prepend to the beginning of the doc (after title)
    // First get the doc to find the right insertion index
    const docRes = await docs.documents.get({ documentId: DOC_ID });
    const content = docRes.data.body.content;

    // Find index after the first paragraph (title)
    let insertIndex = 1;
    if (content && content.length > 1) {
      insertIndex = content[1].startIndex || 1;
    }

    await docs.documents.batchUpdate({
      documentId: DOC_ID,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: insertIndex },
              text: fullEntry,
            },
          },
        ],
      },
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': 'https://cb-dash.netlify.app' },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
