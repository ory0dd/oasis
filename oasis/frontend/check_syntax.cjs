const acorn = require('acorn');
const fs = require('fs');
const jsx = require('acorn-jsx');
const Parser = acorn.Parser.extend(jsx());

const app = fs.readFileSync('src/App.jsx', 'utf8');

try {
    Parser.parse(app, { ecmaVersion: 'latest', sourceType: 'module' });
    console.log('No syntax error.');
} catch (e) {
    console.error(e.message, e.loc);
}
