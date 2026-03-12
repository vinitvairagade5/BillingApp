const fs = require('fs');
let ts = fs.readFileSync('./customer-list/customer-list.component.ts', 'utf8');
ts = ts.replace(/Customer/g, 'Supplier').replace(/customer/g, 'supplier');
fs.mkdirSync('./supplier-list', { recursive: true });
fs.writeFileSync('./supplier-list/supplier-list.component.ts', ts);

let html = fs.readFileSync('./customer-list/customer-list.component.html', 'utf8');
html = html.replace(/Customer/g, 'Supplier').replace(/customer/g, 'supplier');
html = html.replace(/👥/g, '🏢');
fs.writeFileSync('./supplier-list/supplier-list.component.html', html);

fs.writeFileSync('./supplier-list/supplier-list.component.css', fs.readFileSync('./customer-list/customer-list.component.css', 'utf8'));

let svc = fs.readFileSync('./customer.service.ts', 'utf8');
svc = svc.replace(/Customer/g, 'Supplier').replace(/customer/g, 'supplier');
fs.writeFileSync('./supplier.service.ts', svc);
console.log('Supplier generation complete!');
