const fs = require('fs');
try {
    const report = JSON.parse(fs.readFileSync('report-production-final.json', 'utf8'));
    console.log('Performance Score:', report.categories.performance.score * 100);
    console.log('LCP:', report.audits['largest-contentful-paint'].displayValue);
    console.log('FCP:', report.audits['first-contentful-paint'].displayValue);
    console.log('TBT:', report.audits['total-blocking-time'].displayValue);
    console.log('CLS:', report.audits['cumulative-layout-shift'].displayValue);

    console.log('\nTop Opportunities:');
    Object.values(report.audits)
        .filter(a => a.details && a.details.type === 'opportunity' && a.score < 0.9 && a.numericValue > 0)
        .sort((a, b) => b.numericValue - a.numericValue)
        .slice(0, 5)
        .forEach(a => console.log(`- ${a.title}: ${a.displayValue}`));

    console.log('\nMain Thread Work Breakdown:');
    const mainThread = report.audits['mainthread-work-breakdown'];
    if (mainThread && mainThread.details && mainThread.details.items) {
        mainThread.details.items.slice(0, 5).forEach(item => {
            console.log(`- ${item.group}: ${item.duration}ms`);
        });
    }

    console.log('\nBootup Time (Script Execution):');
    const bootup = report.audits['bootup-time'];
    if (bootup && bootup.details && bootup.details.items) {
        bootup.details.items.sort((a, b) => b.total - a.total).slice(0, 5).forEach(item => {
            console.log(`- ${item.url}: ${item.total}ms`);
        });
    }
} catch (e) {
    console.error(e);
}
