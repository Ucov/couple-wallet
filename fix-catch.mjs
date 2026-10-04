import fs from 'fs';
let text = fs.readFileSync('src/utils/supabase/server.ts', 'utf8');

text = text.replace(/catch\(e\) {/, 'catch(e: any) {');

fs.writeFileSync('src/utils/supabase/server.ts', text, 'utf8');
