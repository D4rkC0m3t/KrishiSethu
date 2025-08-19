# 🧹 Project Cleanup Plan - File Analysis

## 📋 File Categories

### ✅ **KEEP - Important Production Files**
- `AuthContext-session-fixed.js` - **KEEP**: Latest working auth context
- `SESSION_AND_INVENTORY_FIXES.md` - **KEEP**: Important implementation guide
- `SUPABASE_FIXES_GUIDE.md` - **KEEP**: Reference documentation

### 📦 **ARCHIVE - Completed Fixes (Reference Only)**
- `fix-products-table-access-corrected.sql` - **ARCHIVE**: Completed successfully
- `fix-supabase-issues-corrected.sql` - **ARCHIVE**: Completed successfully
- All other `fix-*.sql` files - **ARCHIVE**: Historical fixes
- All `DATABASE_*.sql` files - **ARCHIVE**: Setup scripts (already applied)

### 🗑️ **DELETE - Test/Debug/Temporary Files**
- All `test-*.js`, `test-*.html`, `test-*.sql` files
- `start-test-server.bat`
- All diagnostic/debug files
- Duplicate AuthContext files (keep only the latest)
- Test folders: `Playwright Test`, `test-results`, `tests`

### 📚 **ARCHIVE - Documentation (Reference)**
- `*.md` files (except the main implementation guides)

## 🎯 **Cleanup Actions**

### Phase 1: Archive Important SQL Files
- Move completed SQL fixes to archive folder
- Keep for future reference/rollback

### Phase 2: Delete Test Files
- Remove all test-related files and folders
- These are no longer needed

### Phase 3: Clean Documentation
- Keep essential guides, archive others
- Remove duplicate/outdated docs

## 📁 **Final Structure**
```
C:\Inventory Management\
├── inventory-management/          (main project)
├── archive/                      (reference files)
│   ├── sql-fixes/
│   ├── old-docs/
│   └── deprecated-code/
├── AuthContext-session-fixed.js  (to be implemented)
├── SESSION_AND_INVENTORY_FIXES.md
└── SUPABASE_FIXES_GUIDE.md
```
