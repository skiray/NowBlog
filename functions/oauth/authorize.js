export function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;
  const state = url.searchParams.get("state") || crypto.randomUUID();
  const github = new URL("https://github.com/login/oauth/authorize");
  github.searchParams.set("client_id", env.CLIENT_ID);
  github.searchParams.set("redirect_uri", `${base}/oauth/callback`);
  github.searchParams.set("scope", "repo");
  github.searchParams.set("state", state);
  return Response.redirect(github.toString(), 302);
}
