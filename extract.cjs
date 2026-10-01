const fs = require('fs');
const path = require('path');
const routesDir = 'server/src/routes';
fs.readdirSync(routesDir).forEach(file => {
  if (file.endsWith('.ts')) {
    console.log('--- ' + file + ' ---');
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    const matches = content.match(/router\.(get|post|put|patch|delete)\(['"](.*?)['"]/g);
    if (matches) {
      matches.forEach(m => console.log(m));
    }
  }
});
