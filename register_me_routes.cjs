const fs = require('fs');
let index = fs.readFileSync('server/src/index.ts', 'utf8');
if (!index.includes('me.routes')) {
  index = index.replace("import authRoutes from './routes/auth.routes';", "import authRoutes from './routes/auth.routes';\nimport meRoutes from './routes/me.routes';");
  index = index.replace("app.use('/api/auth', authRoutes);", "app.use('/api/auth', authRoutes);\napp.use('/api/me', meRoutes);");
  fs.writeFileSync('server/src/index.ts', index);
}
console.log('done');
