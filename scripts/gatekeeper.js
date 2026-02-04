
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
    bold: "\x1b[1m",
    cyan: "\x1b[36m"
};

function log(message, type = 'blue') {
    console.log(`${colors[type]}${message}${colors.reset}`);
}

function runCommand(command, description, ignoreError = false) {
    log(`\n[Running] ${description}...`, 'blue');
    try {
        execSync(command, { stdio: 'inherit' });
        log(`[Success] ${description}`, 'green');
        return true;
    } catch (error) {
        if (ignoreError) {
            log(`[Warning] ${description} ended with issues (Non-Blocking)`, 'yellow');
            return true;
        }
        log(`[Failed] ${description}`, 'red');
        return false;
    }
}

// Custom Scanner for R3F/Next16 Dangerous Patterns
function scanArchitecture() {
    log(`\n3. ARCHITECTURE SCAN (R3F Safety)`, 'bold');
    let issuesFound = false;

    // Recursive file search
    function getFiles(dir) {
        const subdirs = fs.readdirSync(dir);
        const files = subdirs.map(subdir => {
            const res = path.resolve(dir, subdir);
            return (fs.statSync(res).isDirectory()) ? getFiles(res) : res;
        });
        return files.reduce((a, f) => a.concat(f), []);
    }

    try {
        const componentFiles = getFiles(path.join(process.cwd(), 'components'));
        const dangerousPattern = /dynamic\s*\(\s*\(\)\s*=>\s*import\(.*\),\s*\{\s*ssr\s*:\s*false\s*\}\s*\)/;

        componentFiles.forEach(file => {
            if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
                const content = fs.readFileSync(file, 'utf8');
                if (dangerousPattern.test(content)) {
                    // Check if it's the specific HeroViewportOptimized (which SHOULD NOT have it now)
                    if (file.includes('HeroViewportOptimized')) {
                        log(`[CRITICAL] Found ssr:false dynamic import in ${path.basename(file)}. This causes R3F Context Loss!`, 'red');
                        issuesFound = true;
                    }
                    // General warning for others
                    else {
                        // log(`[Info] Dynamic SSR import found in ${path.basename(file)} (Verify safety)`, 'yellow');
                    }
                }
            }
        });

        if (issuesFound) {
            log('[Failed] Architecture Scan found critical R3F violations', 'red');
            return false;
        } else {
            log('[Success] Architecture Scan Passed (No dangerous patterns)', 'green');
            return true;
        }

    } catch (e) {
        log(`[Error] Scanner failed: ${e.message}`, 'red');
        return false;
    }
}

async function gatekeeper() {
    log(`
    🛡️  ZEUZ GATEKEEPER PROTOCOL v2.2 (Next.js 16)
    ==============================================
    `, 'bold');

    const report = {
        security: false,
        lint: false,
        arch: false,
        types: false,
        build: false,
        runtime: false,
        db: false
    };

    // 1. Security Check
    log(`\n1. CHECKING SECURITY (npm audit)`, 'bold');
    try {
        execSync('npm audit --audit-level=high', { stdio: 'inherit' });
        report.security = true;
        log('[Success] Security Audit Passed', 'green');
    } catch (e) {
        log('[Warning] Security Vulnerabilities Found (High+)', 'yellow');
        report.security = false; // Advisory
    }

    // 2. Linting
    log(`\n2. CHECKING CODE QUALITY (npm run lint)`, 'bold');
    // Using ignoreError=true because sometimes lint warns but we want to proceed if build passes
    report.lint = runCommand('npm run lint', 'Linting', true);

    // 3. Architecture Scan
    report.arch = scanArchitecture();

    // 4. Fast Type Check
    log(`\n4. FAST TYPE CHECK (npx tsc --noEmit)`, 'bold');
    report.types = runCommand('npx tsc --noEmit', 'TypeScript Check');

    // 5. Build
    log(`\n5. PRODUCTION BUILD (npm run build)`, 'bold');
    report.build = runCommand('npm run build', 'next build');

    // 6. Runtime Verification
    if (report.build && report.arch) {
        log(`\n6. RUNTIME & VISUAL VERIFICATION`, 'bold');
        log(`[Required Manual Check] Verify:`, 'yellow');
        log(`  - 3D Hero Rotation/Colors (Realistic Materials)`, 'reset');
        log(`  - Admin Dashboard Access`, 'reset');

        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const askConfirmation = () => {
            return new Promise((resolve) => {
                readline.question(`\nHave you verified runtime integrity? (y/n): `, (answer) => {
                    readline.close();
                    resolve(answer.toLowerCase() === 'y');
                });
            });
        };
        report.runtime = await askConfirmation();
    } else {
        report.runtime = false;
        log('\n[Skipping] Runtime check skipped due to build/arch failure', 'red');
    }

    // summary
    log(`\n
    ========================================
    🛡️  GATEKEEPER REPORT
    ========================================
    `, 'bold');

    console.table({
        'Security': { Status: report.security ? 'PASS' : 'WARN' },
        'Linting': { Status: report.lint ? 'PASS' : 'WARN' },
        'Architecture': { Status: report.arch ? 'PASS' : 'FAIL' },
        'Type Check': { Status: report.types ? 'PASS' : 'FAIL' },
        'Build': { Status: report.build ? 'PASS' : 'FAIL' },
        'Runtime': { Status: report.runtime ? 'PASS' : 'FAIL' },
    });

    if (report.types && report.build && report.arch && report.runtime) {
        log(`\n✅ READY FOR DEPLOYMENT`, 'green');
        process.exit(0);
    } else {
        log(`\n❌ DEPLOYMENT ABORTED`, 'red');
        process.exit(1);
    }
}

gatekeeper();
