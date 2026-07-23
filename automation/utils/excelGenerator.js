// utils/excelGenerator.js
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const reportExcelDir = path.join(__dirname, '../../Test Results/Excel');
if (!fs.existsSync(reportExcelDir)) {
    fs.mkdirSync(reportExcelDir, { recursive: true });
}

function generateExcelReports(testCases) {
    logger.info('Compiling Excel Automation Reports...');

    const executedData = testCases.map(t => ({
        'Test ID': t.id,
        'Module': t.module,
        'Test Name': t.name,
        'Priority': t.priority,
        'Status': t.status,
        'Execution Time (ms)': t.duration
    }));

    const passedData = testCases.filter(t => t.status === 'PASSED').map(t => ({
        'Test ID': t.id,
        'Module': t.module,
        'Test Name': t.name,
        'Priority': t.priority,
        'Execution Time (ms)': t.duration
    }));

    const failedData = testCases.filter(t => t.status === 'FAILED').map(t => ({
        'Test ID': t.id,
        'Module': t.module,
        'Test Name': t.name,
        'Priority': t.priority,
        'Failure Reason': t.errorReason || 'Assertion mismatch',
        'Stack Trace': t.stackTrace || 'N/A'
    }));

    const skippedData = testCases.filter(t => t.status === 'SKIPPED').map(t => ({
        'Test ID': t.id,
        'Module': t.module,
        'Test Name': t.name,
        'Priority': t.priority,
        'Skip Reason': t.skipReason || 'Feature disabled'
    }));

    // Calculate metrics
    const total = testCases.length;
    const passed = passedData.length;
    const failed = failedData.length;
    const skipped = skippedData.length;
    const blocked = testCases.filter(t => t.status === 'BLOCKED').length;
    const passRate = `${((passed / total) * 100).toFixed(2)}%`;

    const metricsData = [
        ['Metric Description', 'Count/Rate'],
        ['Total Test Cases', total],
        ['Passed Test Cases', passed],
        ['Failed Test Cases', failed],
        ['Skipped Test Cases', skipped],
        ['Blocked Test Cases', blocked],
        ['Overall Pass Rate', passRate]
    ];

    const defectSummary = failedData.map(f => ({
        'Defect ID': `DEF-${f['Test ID'].split('_')[2]}`,
        'Associated Test': f['Test ID'],
        'Module': f['Module'],
        'Severity': 'High',
        'Description': f['Failure Reason']
    }));

    const passRateSummary = [
        ['Module', 'Total Tests', 'Passed', 'Failed', 'Pass Rate'],
        ...Object.entries(
            testCases.reduce((acc, curr) => {
                if (!acc[curr.module]) acc[curr.module] = { total: 0, passed: 0, failed: 0 };
                acc[curr.module].total++;
                if (curr.status === 'PASSED') acc[curr.module].passed++;
                if (curr.status === 'FAILED') acc[curr.module].failed++;
                return acc;
            }, {})
        ).map(([mod, stats]) => [
            mod,
            stats.total,
            stats.passed,
            stats.failed,
            `${((stats.passed / stats.total) * 100).toFixed(2)}%`
        ])
    ];

    // 1. Generate: Automation_Test_Report.xlsx
    const mainWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(mainWorkbook, XLSX.utils.json_to_sheet(executedData), 'Executed Test Cases');
    XLSX.utils.book_append_sheet(mainWorkbook, XLSX.utils.json_to_sheet(passedData), 'Passed Tests');
    XLSX.utils.book_append_sheet(mainWorkbook, XLSX.utils.json_to_sheet(failedData), 'Failed Tests');
    XLSX.utils.book_append_sheet(mainWorkbook, XLSX.utils.json_to_sheet(skippedData), 'Skipped Tests');
    XLSX.utils.book_append_sheet(mainWorkbook, XLSX.utils.aoa_to_sheet(metricsData), 'Execution Metrics');
    XLSX.utils.book_append_sheet(mainWorkbook, XLSX.utils.json_to_sheet(defectSummary), 'Defect Summary');
    XLSX.utils.book_append_sheet(mainWorkbook, XLSX.utils.aoa_to_sheet(passRateSummary), 'Pass Rate Summary');
    XLSX.writeFile(mainWorkbook, path.join(reportExcelDir, 'Automation_Test_Report.xlsx'));

    // 2. Generate: Passed_Test_Cases.xlsx
    const passedWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(passedWorkbook, XLSX.utils.json_to_sheet(passedData), 'Passed');
    XLSX.writeFile(passedWorkbook, path.join(reportExcelDir, 'Passed_Test_Cases.xlsx'));

    // 3. Generate: Failed_Test_Cases.xlsx
    const failedWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(failedWorkbook, XLSX.utils.json_to_sheet(failedData), 'Failed');
    XLSX.writeFile(failedWorkbook, path.join(reportExcelDir, 'Failed_Test_Cases.xlsx'));

    // 4. Generate: Execution_Summary.xlsx
    const summaryWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(summaryWorkbook, XLSX.utils.aoa_to_sheet(metricsData), 'Metrics Summary');
    XLSX.utils.book_append_sheet(summaryWorkbook, XLSX.utils.aoa_to_sheet(passRateSummary), 'Module Summary');
    XLSX.writeFile(summaryWorkbook, path.join(reportExcelDir, 'Execution_Summary.xlsx'));

    logger.info(`All 4 Excel reports saved to: ${reportExcelDir}`);
}

module.exports = { generateExcelReports };
