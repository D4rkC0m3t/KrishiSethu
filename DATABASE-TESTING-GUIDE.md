# 🗄️ Database Testing Guide - KrishiSethu Inventory Management

## 🎯 Quick Start

This guide helps you run comprehensive database tests for the KrishiSethu Inventory Management System.

---

## 📋 Prerequisites

### 1. **Environment Setup**
```bash
# Ensure Node.js and npm are installed
node --version  # Should be 16+ 
npm --version   # Should be 8+

# Install dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install
```

### 2. **Database Connection**
- Ensure Supabase database is running and accessible
- Verify connection credentials in `src/lib/supabase.js`
- Test basic connectivity: `npm start` and check if app loads

### 3. **Application Running**
```bash
# Start the development server (required for Playwright tests)
npm start

# Verify app is running at http://localhost:3000
```

---

## 🚀 Running Database Tests

### **Option 1: Complete Test Suite (Recommended)**
```bash
# Run all database tests with detailed reporting
npm run test:database
```
This will:
- Execute all 25+ database tests
- Generate HTML and JSON reports
- Display summary in console
- Save results to `test-results/database-tests/`

### **Option 2: Playwright Tests Only**
```bash
# Run just the Playwright database tests
npm run test:database:playwright

# Run with UI (interactive mode)
npx playwright test database-comprehensive.spec.js --ui

# Run with browser visible
npx playwright test database-comprehensive.spec.js --headed
```

### **Option 3: Category-Specific Tests**
```bash
# Test database schema and structure
npm run test:database:schema

# Test CRUD operations
npm run test:database:crud

# Test data integrity and constraints
npm run test:database:integrity

# Test performance and indexing
npm run test:database:performance

# Test security and access control
npm run test:database:security

# Test transactions and concurrency
npm run test:database:transactions

# Test audit and logging
npm run test:database:audit

# Test integration and business logic
npm run test:database:integration
```

---

## 📊 Understanding Test Results

### **Console Output**
```
🗄️ Starting Comprehensive Database Testing...
============================================================
🧪 Executing Playwright database tests...
✅ Database tests completed successfully!
⏱️ Total execution time: 45000ms

📋 TEST SUMMARY
========================================
Total Tests: 28
✅ Passed: 26
❌ Failed: 2
⏭️ Skipped: 0
⏱️ Duration: 45000ms
📁 Reports saved to: ./test-results/database-tests
```

### **HTML Report**
- **Location**: `test-results/database-tests/database-test-report.html`
- **Features**: 
  - Visual test summary
  - Category breakdown
  - Individual test results
  - Raw test output
  - Timestamp and metadata

### **JSON Report**
- **Location**: `test-results/database-tests/database-test-results.json`
- **Usage**: Programmatic analysis, CI/CD integration
- **Structure**:
```json
{
  "timestamp": "2024-01-16T10:30:00.000Z",
  "execution": {
    "success": true,
    "duration": 45000,
    "output": "...",
    "error": null
  },
  "results": {
    "totalTests": 28,
    "passedTests": 26,
    "failedTests": 2,
    "details": [...]
  }
}
```

---

## 🔧 Test Categories Explained

### **1. Schema & Structure (5 tests)**
- Verifies all required tables exist
- Checks primary keys, foreign keys, constraints
- Validates data types and default values
- Tests naming conventions

### **2. Data Integrity (3 tests)**
- Tests unique constraints (product codes, names)
- Verifies referential integrity (foreign key relationships)
- Validates JSONB field handling

### **3. CRUD Operations (3 tests)**
- Tests Create operations (INSERT)
- Tests Read operations (SELECT with filters)
- Tests Update operations (UPDATE)
- Tests Delete operations (DELETE and soft delete)

### **4. Edge Cases (3 tests)**
- Tests maximum field lengths
- Tests extreme numeric values (zero, negative, large)
- Tests invalid data types and formats

### **5. Performance (2 tests)**
- Measures query performance with datasets
- Tests bulk operations efficiency

### **6. Security (2 tests)**
- Tests Row Level Security (RLS) policies
- Validates SQL injection prevention

### **7. Transactions (2 tests)**
- Tests transaction rollback on failure
- Tests concurrent update handling

### **8. Audit & Logging (2 tests)**
- Verifies audit trail creation
- Tests timestamp accuracy

### **9. Integration (6 tests)**
- Tests complete product lifecycle
- Verifies data consistency across tables
- Tests business workflow integrity

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Connection Errors**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution**: Ensure the development server is running (`npm start`)

#### **2. Supabase Authentication Errors**
```
Error: Invalid JWT token
```
**Solution**: Check Supabase credentials in `src/lib/supabase.js`

#### **3. Test Timeouts**
```
Error: Test timeout of 30000ms exceeded
```
**Solution**: 
- Check database performance
- Increase timeout in test configuration
- Verify network connectivity

#### **4. Permission Errors**
```
Error: permission denied for table products
```
**Solution**: 
- Check RLS policies in Supabase
- Verify user permissions
- Ensure proper authentication

### **Debug Commands**

```bash
# Run tests with debug output
npx playwright test database-comprehensive.spec.js --debug

# Run specific test
npx playwright test database-comprehensive.spec.js --grep "schema validation"

# Generate trace for failed tests
npx playwright test database-comprehensive.spec.js --trace on

# Show detailed test output
npx playwright test database-comprehensive.spec.js --reporter=list
```

---

## 📈 Performance Benchmarks

### **Expected Performance**
- **Schema Tests**: < 5 seconds
- **CRUD Tests**: < 10 seconds per operation
- **Performance Tests**: < 30 seconds
- **Integration Tests**: < 60 seconds
- **Total Suite**: < 5 minutes

### **Performance Thresholds**
- Product queries: < 2 seconds
- Bulk operations: < 5 seconds for 100 records
- Report generation: < 10 seconds
- Individual test: < 30 seconds

---

## 🔄 CI/CD Integration

### **GitHub Actions Example**
```yaml
name: Database Tests
on: [push, pull_request]
jobs:
  database-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:database
      - uses: actions/upload-artifact@v3
        with:
          name: database-test-results
          path: test-results/database-tests/
```

### **Jenkins Pipeline**
```groovy
pipeline {
    agent any
    stages {
        stage('Database Tests') {
            steps {
                sh 'npm ci'
                sh 'npm run test:database'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'test-results/database-tests',
                        reportFiles: 'database-test-report.html',
                        reportName: 'Database Test Report'
                    ])
                }
            }
        }
    }
}
```

---

## 📝 Manual SQL Testing

For direct database testing, use the SQL script:

```bash
# Open Supabase SQL Editor
# Copy and paste queries from: tests/database-sql-tests.sql
# Execute sections individually for detailed analysis
```

**Key SQL Test Sections**:
1. Schema validation queries
2. Data integrity tests  
3. Constraint validation
4. Performance analysis
5. Data consistency checks
6. Audit and logging verification

---

## 📞 Support

### **Getting Help**
- Check the [Database Test Checklist](DATABASE-TEST-CHECKLIST.md)
- Review test output in HTML report
- Check Supabase dashboard for database status
- Verify application logs for errors

### **Reporting Issues**
When reporting database test issues, include:
- Test command used
- Full error message
- Environment details (Node.js version, OS)
- Database connection status
- Test report files

---

**Last Updated**: 2024-01-16  
**Version**: 1.0  
**Maintainer**: KrishiSethu Development Team
