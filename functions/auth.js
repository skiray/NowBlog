const CLIENT_ID = "Ov23liuBf0DK6It6qYJ9";

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;
  const state = url.searchParams.get("state") || crypto.randomUUID();
  const scope = url.searchParams.get("scope") || "repo";

  const github = new URL("https://github.com/login/oauth/authorize");
  github.searchParams.set("client_id", CLIENT_ID);
  github.searchParams.set("redirect_uri", `${base}/callback`);
  github.searchParams.set("scope", scope);
  github.searchParams.set("state", state);
  return Response.redirect(github.toString(), 302);
}
