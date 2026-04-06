const { google } = require('googleapis');

exports.handler = async (event) => {
  const { code } = event.queryStringParameters;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://cb-dash.netlify.app/auth/callback'
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <html><body>
        <script>
          localStorage.setItem('gcal_refresh_token', '${refreshToken}');
          window.location.href = '/';
        </script>
        </body></html>
      `
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
