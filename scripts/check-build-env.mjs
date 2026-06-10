import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

const required = {
  nodeMajor: 22,
  vite: '5.4.19',
  reactPlugin: '4.3.4',
  capacitorCli: '8.3.4',
};

function readVersion(packageName) {
  const entry = require.resolve(packageName);
  let dir = dirname(entry);

  while (dir !== dirname(dir)) {
    try {
      return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;
    } catch {
      dir = dirname(dir);
    }
  }

  throw new Error(`Could not read ${packageName} version`);
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
const actual = {
  nodeMajor,
  vite: readVersion('vite'),
  reactPlugin: readVersion('@vitejs/plugin-react'),
  capacitorCli: readVersion('@capacitor/cli'),
};

const failures = [];
if (actual.nodeMajor !== required.nodeMajor) failures.push(`Node must be v22.x, found v${process.versions.node}`);
if (actual.vite !== required.vite) failures.push(`vite must be ${required.vite}, found ${actual.vite}`);
if (actual.reactPlugin !== required.reactPlugin) failures.push(`@vitejs/plugin-react must be ${required.reactPlugin}, found ${actual.reactPlugin}`);
if (actual.capacitorCli !== required.capacitorCli) failures.push(`@capacitor/cli must be ${required.capacitorCli}, found ${actual.capacitorCli}`);

if (failures.length) {
  console.error('\nBuild environment is wrong:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nRun this from the project folder:\n');
  console.error('rm -rf node_modules package-lock.json dist .vite node_modules/.vite');
  console.error('npm install');
  console.error('npm run build\n');
  process.exit(1);
}

console.log(`Build environment OK: Node ${process.versions.node}, vite ${actual.vite}, @vitejs/plugin-react ${actual.reactPlugin}, @capacitor/cli ${actual.capacitorCli}`);