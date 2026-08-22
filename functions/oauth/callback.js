export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  if (!code) {
    return new Response("Missing code from GitHub", { status: 400 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.CLIENT_ID,
      client_secret: env.CLIENT_SECRET,
      code,
    }),
  });
  const data = await tokenRes.json();
  const token = data.access_token;
  if (!token) {
    return new Response("Token exchange failed: " + JSON.stringify(data), {
      status: 400,
    });
  }

  // Hand the token back to Decap via the popup URL (root of this site).
  // No /oauth route here, so no re-trigger / loop.
  const redirect = new URL(`${base}/`);
  redirect.searchParams.set("code", token);
  redirect.searchParams.set("token", token);
  if (state) redirect.searchParams.set("state", state);
  return Response.redirect(redirect.toString(), 302);
}
