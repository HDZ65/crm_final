const fs = require('fs');
const path = require('path');

const srcBase = path.resolve(__dirname, '..', '..', '..', 'packages', 'proto', 'gen', 'ts');
const dstBase = path.resolve(__dirname, '..', 'proto', 'generated');

const files = [
  'commerciaux/commerciaux.ts',
  'commission/commission.ts',
  'commission/commission-crud.ts',
  'commission/commission-bordereau.ts',
  'commission/commission-calculation.ts',
  'commission/commission-contestation.ts',
  'commission/commission-validation.ts',
  'commission/commission-dashboard.ts',
  'commission/commission-common.ts',
  'contrats/contrats.ts',
  'products/products.ts',
  'dashboard/dashboard.ts',
  'subscriptions/subscriptions.ts',
  'services/bundle.ts',
  'partenaires/partenaires.ts',
  'qualite/qualite.ts',
];

fs.mkdirSync(dstBase, { recursive: true });

for (const rel of files) {
  const src = path.join(srcBase, rel);
  const dst = path.join(dstBase, path.basename(rel));
  fs.copyFileSync(src, dst);
  console.log(`Copied ${rel}`);
}

console.log('Proto files copied successfully');
