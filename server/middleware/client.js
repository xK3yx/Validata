// Each browser generates a random UUID (client/src/utils/clientId.js) and sends
// it as X-Client-ID. It scopes history and the daily free limit to that browser.
// It is not authentication, just an unguessable per-browser key.
const CLIENT_ID_RE = /^[A-Za-z0-9-]{16,64}$/;

function requireClientId(req, res, next) {
  const id = req.get('x-client-id');
  if (!id || !CLIENT_ID_RE.test(id)) {
    return res.status(400).json({ error: 'Missing or invalid X-Client-ID header.' });
  }
  req.clientId = id;
  next();
}

module.exports = { requireClientId };
