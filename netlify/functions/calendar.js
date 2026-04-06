const { google } = require('googleapis');

exports.handler = async (event) => {
  const refreshToken = event.queryStringParameters?.refresh_token;

  if (!refreshToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'No refresh token provided' })
    };
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://cb-dash.netlify.app/auth/callback'
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const twoWeeksOut = new Date();
    twoWeeksOut.setDate(now.getDate() + 14);

    const [primary, whiteLies] = await Promise.all([
      calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: twoWeeksOut.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'America/Chicago',
      }),
      calendar.events.list({
        calendarId: 'fqnreq6svm452i0eakfsgkobj0@group.calendar.google.com',
        timeMin: now.toISOString(),
        timeMax: twoWeeksOut.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'America/Chicago',
      }),
    ]);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://cb-dash.netlify.app',
      },
      body: JSON.stringify({
        primary: primary.data.items,
        whiteLies: whiteLies.data.items,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
