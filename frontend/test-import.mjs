import('./src/lib/nav-config.ts').then(() => {
  console.log('✓ nav-config.ts imports successfully')
}).catch(err => {
  console.error('✗ Import error:', err.message)
  process.exit(1)
})
