import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Hosting preparation only. Local development serves the source files directly.
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const path of ['index.html', 'admin.html', 'assets', 'src']) {
  await cp(new URL(path, root), new URL(path, output), { recursive: true });
}
console.log(`Static website ready in ${fileURLToPath(output)}`);
