const fs = require('fs');
const files = fs.readdirSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/dist/assets/');
const jsFile = files.find(f => f.endsWith('.js'));
const code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/dist/assets/' + jsFile, 'utf8');

const regex = /https:\/\/oasis-production-6303\.up\.railway\.app/g;
let match;
while ((match = regex.exec(code)) !== null) {
  console.log('Match at', match.index);
  console.log('Context:', code.substring(match.index - 50, match.index + 80));
}
