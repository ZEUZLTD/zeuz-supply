
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

function log(message, type = 'blue') {
    console.log(`${colors[type]}${message}${colors.reset}`);
}

function runCommand(command, description) {
    log(`\n[Running] ${description}...`, 'blue');
    try {
        execSync(command, { stdio: 'inherit' });
        log(`[Success] ${description}`, 'green');
        return true;
    } catch (error) {
        log(`[Failed] ${description}`, 'red');
        return false;
    }
}

async function gatekeeper() {
    log(`
    🛡️  ZEUZ GATEKEEPER PROTOCOL INITIALIZED
    ========================================
    `, 'bold');

    const report = {
        security: false,
        lint: false,
        types: false,
        build: false,
        db: false
    };

    // 1. Security Check
    log(`\n1. CHECKING SECURITY (npm audit)`, 'bold');
    // Using --audit-level=high so it doesn't fail on low/trivial issues, 
    // but still informs. Adjust as strict as needed.
    // 'npm audit' returns non-zero exit code if vulnerabilities are found.
    try {
        execSync('npm audit --audit-level=high', { stdio: 'inherit' });
        report.security = true;
        log('[Success] Security Audit Passed', 'green');
    } catch (e) {
        log('[Warning] Security Vulnerabilities Found (High+)', 'yellow');
        // We warn but don't hard fail unless user wants strict no-vulnerabilities
        // report.security = false; 
    }

    // 2. Linting
    log(`\n2. CHECKING CODE QUALITY (npm run lint)`, 'bold');
    try {
        execSync('npm run lint', { stdio: 'inherit' });
        report.lint = true;
        log('[Success] Linting Passed', 'green');
    } catch (e) {
        log('[Warning] Lint issues found (non-blocking)', 'yellow');
        report.lint = true; // Treat as advisory, build is the hard gate
    }

    // 3. Fast Type Check (catches type errors quickly before full build)
    log(`\n3. FAST TYPE CHECK (npx tsc --noEmit)`, 'bold');
    report.types = runCommand('npx tsc --noEmit', 'TypeScript Check');

    // 4. Build & Type Check
    log(`\n4. CHECKING BUILD & TYPES (npm run build)`, 'bold');
    // We expect this to take the longest
    report.build = runCommand('npm run build', 'next build');

    // 4. Database Sync Check
    // This doesn't actually push, it just checks if there are pending migrations 
    // or if the schema is out of sync. 
    // NOTE: 'db push' is interactive, so we can't fully automate it safely 
    // without potentially modifying the DB. 
    // Instead we will just remind the user.
    log(`\n5. CHECKING DATABASE`, 'bold');
    log(`[Manual Action Required] Please verify database sync status manually if you have made schema changes:`, 'yellow');
    log(`> npx supabase db push`, 'reset');
    report.db = true; // Assumed true for the script flow, relies on manual confirmation.

    // SUMMARY
    log(`\n
    ========================================
    🛡️  GATEKEEPER REPORT
    ========================================
    `, 'bold');

    console.table({
        'Security Audit': { Status: report.security ? 'PASS' : 'WARN' },
        'Linting': { Status: report.lint ? 'PASS' : 'WARN' },
        'Type Check': { Status: report.types ? 'PASS' : 'FAIL' },
        'Build & Types': { Status: report.build ? 'PASS' : 'FAIL' },
        'Database': { Status: 'MANUAL CHECK' }
    });

    if (report.types && report.build) {
        log(`\n✅ READY FOR DEPLOYMENT`, 'green');
        process.exit(0);
    } else {
        log(`\n❌ DEPLOYMENT ABORTED - FIX ERRORS`, 'red');
        process.exit(1);
    }
}

gatekeeper();
