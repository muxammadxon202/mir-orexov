// Self-hosted OAuth provider for Decap CMS's "github" backend. Decap can't
// talk to GitHub's OAuth endpoints directly from the browser (it needs a
// server to hold the client secret), so this implements the two endpoints
// Decap expects: GET /auth (kick off the GitHub authorize redirect) and
// GET /callback (exchange the code, hand the token back via postMessage).
const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

function registerGithubOAuth(app) {
  const { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET, BACKEND_URL } = process.env;

  app.get("/auth", (req, res) => {
    if (!GITHUB_OAUTH_CLIENT_ID || !BACKEND_URL) {
      return res.status(500).send("GitHub OAuth not configured");
    }
    const redirectUri = `${BACKEND_URL}/callback`;
    const url = new URL(GITHUB_AUTHORIZE_URL);
    url.searchParams.set("client_id", GITHUB_OAUTH_CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "repo,user");
    res.redirect(url.toString());
  });

  app.get("/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");

    try {
      const tokenRes = await fetch(GITHUB_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: GITHUB_OAUTH_CLIENT_ID,
          client_secret: GITHUB_OAUTH_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = await tokenRes.json();
      if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

      const payload = JSON.stringify({ token: tokenData.access_token, provider: "github" });
      // Decap's admin page (the opener window) listens for this exact
      // "authorization:github:success:<payload>" message format.
      res.send(`<!DOCTYPE html><html><body>
<script>
(function () {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:${payload.replace(/'/g, "\\'")}',
      e.origin
    );
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body></html>`);
    } catch (err) {
      res.status(500).send(`OAuth error: ${err.message}`);
    }
  });
}

module.exports = { registerGithubOAuth };
