const fs = require('fs');

const filepath = 'c:/Users/Administrador/Downloads/oasis/oasis/backend/Controllers/OasisController.cs';
let content = fs.readFileSync(filepath, 'utf8');

// Use regex to find the definition of publicBlocksToRecommend
const regex = /var\s+publicBlocksToRecommend\s*=\s*_state\.Users[\s\S]*?\.SelectMany\(usr\s*=>\s*usr\.Blocks\)[\s\S]*?\.Where\(b\s*=>\s*b\.IsPublic\)[\s\S]*?\.ToList\(\);/;

if (regex.test(content)) {
    content = content.replace(regex, 'var publicBlocksToRecommend = allPublicBlocks;');
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Successfully updated recommendation source via Regex!');
} else {
    console.log('Regex did not match publicBlocksToRecommend in OasisController.cs!');
}
