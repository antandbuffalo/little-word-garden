import { parseCatalog, serializeCatalog } from './content.js?v=1794964464226';

const repository = 'antandbuffalo/little-word-garden';
const contentPath = 'src/data/catalog.js';

function encode(text) {
  return btoa(Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte)).join(''));
}
function decode(base64) {
  return new TextDecoder().decode(Uint8Array.from(atob(base64.replace(/\s/g, '')), char => char.charCodeAt(0)));
}

export function createGitHubClient(token, request = globalThis.fetch) {
  async function api(path, options = {}) {
    let response;
    try {
      response = await request(`https://api.github.com/repos/${repository}${path}`, {
        ...options,
        headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, ...options.headers },
        cache: 'no-store',
      });
    } catch {
      throw new Error(options.method === 'PUT'
        ? 'The connection was interrupted. Your commit may have succeeded. Reconnect to load the latest content before trying again.'
        : 'Could not reach GitHub. Check your connection and try again.');
    }
    if (!response.ok) {
      const messages = {
        401: 'GitHub rejected this token. Check that it is correct and has not expired.',
        403: 'GitHub denied access. Check the token’s Contents read/write permission, repository access, and API rate limit.',
        404: 'Repository or content file not found. Check token access, and make sure this admin version has been deployed.',
        409: 'The content changed on GitHub. Reconnect to load the latest version, then review your words again.',
        422: 'GitHub could not create the commit. Check branch rules and reconnect before trying again.',
      };
      throw new Error(messages[response.status] || 'GitHub could not complete the request. Reconnect before trying again.');
    }
    return response.json();
  }

  return {
    async load() {
      const repo = await api('');
      const branch = repo.default_branch;
      const file = await api(`/contents/${contentPath}?ref=${encodeURIComponent(branch)}`);
      if (!file.content || !file.sha) throw new Error('GitHub did not return the content file.');
      return { catalog: parseCatalog(decode(file.content)), sha: file.sha, branch };
    },
    async publish(snapshot, catalog, count) {
      const result = await api(`/contents/${contentPath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Add ${count} spelling ${count === 1 ? 'word' : 'words'} from admin`,
          content: encode(serializeCatalog(catalog)),
          sha: snapshot.sha,
          branch: snapshot.branch,
        }),
      });
      return { sha: result.content.sha, url: result.commit.html_url };
    },
  };
}
