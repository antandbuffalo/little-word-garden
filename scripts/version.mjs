import { readdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

async function modules(root, directory = 'src/') {
  const paths = [];
  for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) {
    const path = `${directory}${entry.name}`;
    if (entry.isDirectory()) paths.push(...await modules(root, `${path}/`));
    else if (path.endsWith('.js') && path !== 'src/data/catalog.js') paths.push(path);
  }
  return paths;
}

// Update tracked source URLs once per release, without a build or CI workflow.
export async function stampVersion(root, timestamp = Date.now()) {
  const version = String(timestamp);
  if (!/^\d{13}$/.test(version)) throw new Error('Use a 13-digit release timestamp.');
  for (const path of await modules(root)) {
    const source = await readFile(new URL(path, root), 'utf8');
    const stamped = source.replace(/(\bfrom\s+['"])(\.{1,2}\/[^'"?]+\.js)(?:\?v=\d+)?(['"])/g,
      (_, before, path, after) => `${before}${path}?v=${version}${after}`);
    if (source !== stamped) await writeFile(new URL(path, root), stamped);
  }
  for (const page of ['index.html', 'admin.html']) {
    const html = (await readFile(new URL(page, root), 'utf8'))
      .replace(/(name="app-version" content=")[^"]+(")/, (_, before, after) => `${before}${version}${after}`)
      .replace(/((?:src|href)="(?:src|assets)\/[^"?]+\.(?:js|css))(?:\?v=\d+)?(")/g,
        `$1?v=${version}$2`);
    await writeFile(new URL(page, root), html);
  }
  await writeFile(new URL('version.json', root), `${JSON.stringify({ version })}\n`);
  return version;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const version = await stampVersion(new URL('../', import.meta.url));
  console.log(`Release timestamp: ${version}. Commit the updated source files with your changes.`);
}
