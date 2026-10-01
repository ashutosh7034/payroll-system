const fs = require('fs');

const schemaPath = 'server/prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('enabledModules')) {
  schema = schema.replace(
    'isActive   Boolean  @default(true)',
    'isActive   Boolean  @default(true)\n  enabledModules String[] @default([])'
  );
  fs.writeFileSync(schemaPath, schema);
  console.log('Added enabledModules to Tenant');
}
