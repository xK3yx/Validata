export function getClientId() {
  let id = localStorage.getItem('validata_client_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('validata_client_id', id);
  }
  return id;
}
