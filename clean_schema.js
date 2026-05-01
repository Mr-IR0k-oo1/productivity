const fs = require('fs');
const content = fs.readFileSync('src/db/schema.ts', 'utf8');

// Remove flowchart-related table definitions and enums
const enumsToRemove = [
  'canvasModeEnum',
  'pageSizeEnum', 
  'nodeTypeEnum',
  'shapeVariantEnum',
  'edgeStyleEnum',
  'lineStyleEnum',
  'arrowTypeEnum',
  'portEnum',
  'accessRoleEnum'
];

const tablesToRemove = [
  'flowcharts',
  'flowchartNodes',
  'flowchartVersions',
  'flowchartComments',
  'flowchartAccess'
];

let cleaned = content;

// Remove enum definitions
enumsToRemove.forEach(enumName => {
  const regex = new RegExp(`export const ${enumName} = pgEnum\\("[^"]+", \\[[^\\]]+\\]\\);?\\n*`, 'g');
  cleaned = cleaned.replace(regex, '');
});

// Remove defaultCanvasState
cleaned = cleaned.replace(/const defaultCanvasState = \\{[^}]+\\};?\\n*/, '');

// Remove table definitions  
tablesToRemove.forEach(tableName => {
  const regex = new RegExp(`export const ${tableName} = pgTable\\([\\s\\S]*?\\);\\n\\);`, 'g');
  cleaned = cleaned.replace(regex, '');
});

// Clean up extra blank lines
cleaned = cleaned.replace(/\\n\\n\\n+/g, '\\n\\n');

fs.writeFileSync('src/db/schema-clean.ts', cleaned);
console.log('Done! Check src/db/schema-clean.ts');
