const assert           = require('assert');
const normalizeNewline = require('normalize-newline');
const read             = require('read-file-relative').readSync;
const OS               = require('os-family');
const createReport     = require('./utils/create-report');

it('Should produce report with colors', function () {
    const expectedFile = OS.win ? './data/report-with-colors-win.json' : './data/report-with-colors.json';
    let report       = createReport(true);
    let expected     = JSON.parse(read(expectedFile));

    report   = normalizeNewline(report).trim();
    expected = normalizeNewline(expected).trim();

    assert.strictEqual(report, expected);
});

it('Should produce report without colors', function () {
    let report   = createReport(false);
    let expected = read('./data/report-without-colors');

    report   = normalizeNewline(report).trim();
    expected = normalizeNewline(expected).trim();

    assert.strictEqual(report, expected);
});

describe('Resolving the config', () => {
    const cwd = process.cwd();
    const log = console.log;
    /** @type {any[] | undefined} lastLog */
    let lastLog;

    beforeEach(() => {
        console.log = (...args) => {
            lastLog = args;
        };
    });

    afterEach(() => {
        console.log = log;
        process.chdir(cwd);
    });

    it('Should find .testcaferc.js', function () {
        process.chdir('test/data/configs/js');
        require('../lib/index')();
        assert.equal(lastLog?.[0], void 0);
    });

    it('Should find .testcaferc.cjs', function () {
        process.chdir('test/data/configs/cjs');
        require('../lib/index')();
        assert.equal(lastLog?.[0], void 0);
    });

    it('Should abort if no config was found', function () {
        process.chdir('test/data/configs/mjs');
        require('../lib/index')();
        assert.equal(lastLog?.[0], 'No .testcaferc.js or .testcaferc.cjs found');
    });
});
