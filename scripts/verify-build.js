#!/usr/bin/env node

/**
 * Build Verification Script
 * Checks if the application is ready for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build readiness...\n');

const checks = [
  {
    name: 'Core React Files',
    check: () => {
      const files = [
        'src/index.js',
        'src/App.js',
        'src/index.css'
      ];
      return files.every(file => fs.existsSync(file));
    }
  },
  {
    name: 'Tailwind Configuration',
    check: () => {
      return fs.existsSync('tailwind.config.js') && fs.existsSync('postcss.config.js');
    }
  },
  {
    name: 'Environment Template',
    check: () => {
      return fs.existsSync('.env.example') || fs.existsSync('.env.local.template');
    }
  },
  {
    name: 'Git Security',
    check: () => {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      return gitignore.includes('.env.local') && !fs.existsSync('.env.local');
    }
  },
  {
    name: 'Package.json Scripts',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts && pkg.scripts.build && pkg.scripts.start;
    }
  },
  {
    name: 'GitHub Actions',
    check: () => {
      return fs.existsSync('.github/workflows/deploy.yml');
    }
  },
  {
    name: 'Component Structure',
    check: () => {
      const components = [
        'src/components/Dashboard.jsx',
        'src/components/ErrorBoundary.jsx',
        'src/components/auth/AuthPage.jsx'
      ];
      return components.every(file => fs.existsSync(file));
    }
  }
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  try {
    if (check()) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name} (Error: ${error.message})`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 Build verification passed! Ready for deployment.');
  console.log('\n📋 Next steps:');
  console.log('1. Set up GitHub repository secrets');
  console.log('2. Create .env.local from template');
  console.log('3. Test build locally: npm run build');
  console.log('4. Deploy: git push origin main');
  process.exit(0);
} else {
  console.log('\n⚠️  Build verification failed. Please fix the issues above.');
  process.exit(1);
}