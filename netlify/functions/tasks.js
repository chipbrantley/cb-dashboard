const { google } = require('googleapis');

exports.handler = async (event) => {
  const refreshToken = event.queryStringParameters?.refresh_token ||
    (event.body ? JSON.parse(event.body).refresh_token : null);

  if (!refreshToken) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No refresh token' }) };
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://cb-dash.netlify.app/auth/callback'
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const tasks = google.tasks({ version: 'v1', auth: oauth2Client });
  const headers = { 'Access-Control-Allow-Origin': 'https://cb-dash.netlify.app' };

  // POST = complete a task
  if (event.httpMethod === 'POST') {
    const { task_id } = JSON.parse(event.body);
    try {
      await tasks.tasks.patch({
        tasklist: '@default',
        task: task_id,
        requestBody: { status: 'completed' },
      });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  // GET = fetch incomplete tasks from My Tasks
  try {
    const res = await tasks.tasks.list({
      tasklist: '@default',
      showCompleted: false,
      showHidden: false,
      maxResults: 50,
    });

    const items = (res.data.items || [])
      .filter(t => t.status !== 'completed')
      .map(t => ({
        id: t.id,
        title: t.title,
        due: t.due || null,
        notes: t.notes || null,
      }));

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: items }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
