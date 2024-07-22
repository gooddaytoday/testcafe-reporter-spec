
const fs = require('fs');
const path = require('path');

export default function () {
    const reporterName = 'spec-plus';

    const configPath = ['.testcaferc.js', '.testcaferc.cjs'].reduce(
        (acc, file) => acc || path.resolve(process.cwd(), file),
        null
    );

    let showProgress = false;
    let showDuration = false;
    let filter = [];

    if (fs.existsSync(configPath)) {
        const config = require(configPath);
        const reporters = config['reporter'];

        for (const reporter of reporters) {
            if (reporter.name === reporterName) {
                const filterList = reporter['filter'];

                if (filterList) filter = filterList;
                if (reporter['showProgress']) showProgress = true;
                if (reporter['showDuration']) showDuration = true;
                break;
            }
        }
    }
    else
        console.log('No .testcaferc.js or .testcaferc.cjs found');

    const hasFilter = filter.length > 0;

    return {
        noColors:       false,
        startTime:      null,
        afterErrorList: false,
        testCount:      0,
        testsFinished:  0,
        skipped:        0,

        reportTaskStart (startTime, userAgents, testCount) {
            this.startTime = startTime;
            this.testCount = testCount;

            const writeData = { startTime, userAgents, testCount };

            this.setIndent(1)
                .useWordWrap(true)
                .write(this.chalk.bold('Running tests in:'), writeData)
                .newline();

            userAgents.forEach(ua => {
                this
                    .write(`- ${this.chalk.blue(ua)}`, writeData)
                    .newline();
            });
        },

        reportFixtureStart (name, filePath, meta) {
            this._renderProgress();

            this.setIndent(1)
                .useWordWrap(true);

            if (this.afterErrorList)
                this.afterErrorList = false;
            else
                this.newline();

            const writeData = { name, filePath, meta };

            this.write(name, writeData)
                .newline();
        },

        _renderErrors (errs, writeData) {
            this.setIndent(3)
                .newline();

            errs.forEach((err, idx) => {
                const prefix = this.chalk.red(`${idx + 1}) `);

                this.newline()
                    .write(this.formatError(err, prefix), writeData)
                    .newline()
                    .newline();
            });
        },

        reportTestDone (name, testRunInfo, meta) {
            if (!testRunInfo.skipped) this.testsFinished++;
            const hasErr  = !!testRunInfo.errs.length;
            let symbol    = null;
            let nameStyle = null;
            const durationMs = testRunInfo.durationMs;

            if (testRunInfo.skipped) {
                this.skipped++;

                symbol    = this.chalk.cyan('-');
                nameStyle = this.chalk.cyan;
            }
            else if (hasErr) {
                symbol    = this.chalk.red.bold(this.symbols.err);
                nameStyle = this.chalk.red.bold;
            }
            else {
                symbol    = this.chalk.green(this.symbols.ok);
                nameStyle = this.chalk.grey;
            }

            let title = `${symbol} ${nameStyle(name)}`;

            this.setIndent(1)
                .useWordWrap(true);

            if (showDuration && durationMs > 0)
                title += this._humanDuration(durationMs);

            if (testRunInfo.unstable)
                title += this.chalk.yellow(' (unstable)');

            if (testRunInfo.screenshotPath)
                title += ` (screenshots: ${this.chalk.underline.grey(testRunInfo.screenshotPath)})`;

            const writeData = { name, testRunInfo, meta };

            this.write(title, writeData);

            this._renderReportData(testRunInfo.reportData, testRunInfo.browsers, writeData);

            if (hasErr)
                this._renderErrors(testRunInfo.errs, writeData);

            this.afterErrorList = hasErr;

            this.newline();
        },

        _humanDuration (durationMs) {
            const humanTime = convertToReadableTime(durationMs);

            if (durationMs < 60000)
                return ` (${humanTime})`;
            else if (durationMs < 180000)
                return ` (${this.chalk.yellow(humanTime)})`;
            else if (durationMs < 600000)
                return ` (${this.chalk.hex('#FFA500')(humanTime)})`;
            else if (durationMs < 1000000)
                return ` (${this.chalk.red(humanTime)})`;

            return ` (${this.chalk.red.bold(humanTime)})`;
        },

        _renderReportData (reportData, browsers, writeData) {
            if (!reportData)
                return;

            if (!Object.values(reportData).some(data => data.length))
                return;

            const renderBrowserName = browsers.length > 1;
            const dataIndent        = browsers.length > 1 ? 3 : 2;

            this.newline()
                .setIndent(1)
                .write('Report data:');

            browsers.forEach(({ testRunId, prettyUserAgent }) => {
                const browserReportData = reportData[testRunId];

                if (!browserReportData)
                    return;

                if (renderBrowserName) {
                    this.setIndent(2)
                        .newline()
                        .write(prettyUserAgent, writeData);
                }

                browserReportData.forEach(data => {
                    this.setIndent(dataIndent)
                        .newline()
                        .write(`- ${data}`, writeData);
                });
            });
        },

        _renderWarnings (warnings, writeData) {
            const initialWarnings = warnings;

            if (hasFilter) {
                warnings = warnings.filter(msg => filter.every(f => {
                    if (typeof f === 'string')
                        return msg.indexOf(f) === -1;
                    else if (f instanceof RegExp)
                        return !f.test(msg);
                    throw new Error(`Unknown filter type: ${f}`);
                }));
            }

            this.newline()
                .setIndent(1)
                .write(this.chalk.bold.yellow(`Warnings (${warnings.length}):`), writeData)
                .newline();

            warnings.forEach(msg => {
                this.setIndent(1)
                    .write(this.chalk.bold.yellow('--'), writeData)
                    .newline()
                    .setIndent(2)
                    .write(msg, writeData)
                    .newline();
            });
            if (hasFilter && initialWarnings.length !== warnings.length) {
                this.newline()
                    .setIndent(1)
                    .write('Non filtered warnings count: ' + initialWarnings.length)
                    .newline();
            }
        },

        reportTaskDone (endTime, passed, warnings, result) {
            const durationMs  = endTime - this.startTime;
            const durationStr = this.moment.duration(durationMs).format('h[h] mm[m] ss[s]');
            let footer        = passed === this.testCount ?
                this.chalk.bold.green(`${this.testCount} passed`) :
                this.chalk.bold.red(`${this.testCount - passed}/${this.testCount} failed`);

            footer += this.chalk.grey(` (${durationStr})`);

            if (!this.afterErrorList)
                this.newline();

            this.setIndent(1)
                .useWordWrap(true);

            const writeData = { endTime, passed, warnings, result };

            this.newline()
                .write(footer, writeData)
                .newline();

            if (this.skipped > 0) {
                this.write(this.chalk.cyan(`${this.skipped} skipped`), writeData)
                    .newline();
            }

            if (warnings.length)
                this._renderWarnings(warnings, writeData);
        },

        _renderProgress () {
            if (showProgress && this.testsFinished > 0) {
                this.newline()
                    .setIndent(1)
                    .write(`Completed tests: ${this.testsFinished}/${this.testCount}`)
                    .newline();
                if (this.afterErrorList)
                    this.newline();
            }
        },
    };
}

/**
 * Converts a millisecond value to a human-readable time format.
 *
 * @param {number} milliseconds - The millisecond value to convert.
 * @return {string} The human-readable time format.
 */
function convertToReadableTime (milliseconds) {
    if (milliseconds <= 0)
        return 'Invalid input in convertToReadableTime: ' + milliseconds;

    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor(totalSeconds % (60 * 60 * 24) / (60 * 60));
    const minutes = Math.floor(totalSeconds % (60 * 60) / 60);
    const seconds = totalSeconds % 60;

    const time = [];

    if (days > 0) time.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) time.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) time.push(`${minutes} m`);
    if (seconds > 0) time.push(`${seconds} s`);

    return time.join(' ').trim();
}
