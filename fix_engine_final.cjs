const fs = require('fs');
let content = fs.readFileSync('server/src/services/payroll.engine.ts', 'utf8');

content = content.replace(
`        let variablePay = 0;
        let bonus = 0;
        let arrears = 0; let bonus = 0;
        inputs.forEach(i => {`,
`        let variablePay = 0;
        let bonus = 0;
        inputs.forEach(i => {`
);

fs.writeFileSync('server/src/services/payroll.engine.ts', content);
console.log('Fixed syntax error in payroll.engine.ts');
