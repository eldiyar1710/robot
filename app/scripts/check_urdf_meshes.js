const fs = require('fs');
const path = require('path');

const urdfArg = process.argv[2] || 'app/public/models/g1/g1_23dof_rev_1_0.urdf';
const urdfPath = path.resolve(process.cwd(), urdfArg);
if (!fs.existsSync(urdfPath)) {
  console.error('URDF not found:', urdfPath);
  process.exit(2);
}

const urdfDir = path.dirname(urdfPath);
const meshesDir = path.resolve(urdfDir, 'meshes');
const content = fs.readFileSync(urdfPath, 'utf8');

const re = /filename\s*=\s*"(meshes\/[^"]+)"/g;
let m;
const referenced = new Set();
while ((m = re.exec(content))) referenced.add(m[1]);

const referencedList = Array.from(referenced).sort();

let presentFiles = [];
try {
  presentFiles = fs.readdirSync(meshesDir).filter(Boolean).map(f => 'meshes/' + f).sort();
} catch (e) {
  console.error('Meshes directory not found:', meshesDir);
}

const missing = referencedList.filter(r => !fs.existsSync(path.resolve(urdfDir, r)));
const referencedButNotListed = presentFiles.filter(p => !referenced.has(p));

console.log('URDF:', urdfPath);
console.log('Meshes dir:', meshesDir);
console.log('\nReferenced meshes (count):', referencedList.length);
referencedList.forEach(r => console.log('  ', r));

console.log('\nPresent mesh files (count):', presentFiles.length);
// show only first 200 to avoid huge output
presentFiles.slice(0, 500).forEach(p => console.log('  ', p));

console.log('\nMissing referenced files (count):', missing.length);
missing.forEach(mf => console.log('  MISSING ->', mf));

console.log('\nPresent but not referenced (count):', referencedButNotListed.length);
referencedButNotListed.slice(0, 200).forEach(p => console.log('  UNREFERENCED ->', p));

if (missing.length > 0) process.exitCode = 1;
else process.exitCode = 0;
