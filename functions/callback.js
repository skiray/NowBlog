const CLIENT_ID = "Ov23liuBf0DK6It6qYJ9";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;
  const code = url.searchParams.get("code");

  if (!code) {
    return render("authorization:github:error:", { message: "Missing code from GitHub" }, base);
  }

  let payload;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        code,
      }),
    });
    const data = await tokenRes.json();
    const token = data.access_token;
    if (!token) {
      payload = { message: "Token exchange failed: " + JSON.stringify(data) };
      return render("authorization:github:error:", payload, base);
    }
    payload = { token };
    return render("authorization:github:success:", payload, base);
  } catch (e) {
    payload = { message: String(e) };
    return render("authorization:github:error:", payload, base);
  }
}

function render(prefix, payload, base) {
  const msg = prefix + JSON.stringify(payload);
  const html = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Authenticating…</title></head>
  <body>
    <p>Authenticating…</p>
    <script>
      (function () {
        var BASE = ${JSON.stringify(base)};
        var MSG = ${JSON.stringify(msg)};
        function onMsg(ev) {
          if (ev.origin === BASE && ev.data === "authorizing:github") {
            window.opener.postMessage(MSG, BASE);
          }
        }
        window.addEventListener("message", onMsg);
        if (window.opener) {
          window.opener.postMessage("authorizing:github", BASE);
        }
      })();
    </script>
  </body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
