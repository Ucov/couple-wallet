const fs = require('fs');
let text = fs.readFileSync('src/app/chores/ChoresClient.tsx', 'utf8');

text = text.replace(/useState<number>\(10\)/g, 'useState<number>(1)');
text = text.replace(/setSelectedPoints\(10\)/g, 'setSelectedPoints(1)');
text = text.replace(/setSelectedPoints\(30\)/g, 'setSelectedPoints(2)');
text = text.replace(/setSelectedPoints\(50\)/g, 'setSelectedPoints(3)');
text = text.replace(/selectedPoints === 10/g, 'selectedPoints === 1');
text = text.replace(/selectedPoints === 30/g, 'selectedPoints === 2');
text = text.replace(/selectedPoints === 50/g, 'selectedPoints === 3');
text = text.replace(/chore\.points \|\| 10/g, 'chore.points || 1');
text = text.replace(/<span>10<\/span>/g, '<span>1</span>');
text = text.replace(/<span>30<\/span>/g, '<span>2</span>');
text = text.replace(/<span>50<\/span>/g, '<span>3</span>');

fs.writeFileSync('src/app/chores/ChoresClient.tsx', text, 'utf8');
