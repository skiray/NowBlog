// Minimal GitHub OAuth handler for Decap CMS (Git Gateway / github backend).
// Deploy with Wrangler. Set GITHUB_CLIENT_ID (var) and GITHUB_CLIENT_SECRET (secret).
// In Decap config.yml: backend.base_url = https://<this-worker-subdomain>.workers.dev

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const base = `${url.protocol}//${url.host}`;

    // Step 1: redirect the browser to GitHub's authorize page.
    if (url.pathname === "/authorize") {
      const state = url.searchParams.get("state") || crypto.randomUUID();
      const github = new URL("https://github.com/login/oauth/authorize");
      github.searchParams.set("client_id", env.CLIENT_ID);
      github.searchParams.set("redirect_uri", `${base}/callback`);
      github.searchParams.set("scope", "repo");
      github.searchParams.set("state", state);
      return Response.redirect(github.toString(), 302);
    }

    // Step 2: GitHub redirects here with ?code=... — exchange it for a token,
    // then hand the token back to Decap via the URL (it reads ?code / ?token).
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state") || "";
      if (!code) {
        return new Response("Missing code from GitHub", { status: 400 });
      }

      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: env.CLIENT_ID,
            client_secret: env.CLIENT_SECRET,
            code,
          }),
        }
      );
      const data = await tokenRes.json();
      const token = data.access_token;
      if (!token) {
        return new Response(
          "Token exchange failed: " + JSON.stringify(data),
          { status: 400 }
        );
      }

      // Hand the token back to Decap via the popup URL. Redirect to the
      // root (not /callback) so this handler isn't re-triggered and the
      // access token isn't exchanged a second time.
      const redirect = new URL(`${base}/`);
      redirect.searchParams.set("code", token);
      redirect.searchParams.set("token", token);
      if (state) redirect.searchParams.set("state", state);
      return Response.redirect(redirect.toString(), 302);
    }

    return new Response(
      "Decap CMS OAuth handler. Visit /authorize to begin.",
      { status: 200 }
    );
  },
};
