import fs from 'fs';

let page = fs.readFileSync('src/app/chores/page.tsx', 'utf8');
page = page.replace(/Dom.*sticas/g, 'Domésticas');
page = page.replace(/T.*g/g, 'Tú');
fs.writeFileSync('src/app/chores/page.tsx', page, 'utf8');

let client = fs.readFileSync('src/app/chores/ChoresClient.tsx', 'utf8');
client = client.replace(/A.*adir/g, 'Añadir');
fs.writeFileSync('src/app/chores/ChoresClient.tsx', client, 'utf8');
