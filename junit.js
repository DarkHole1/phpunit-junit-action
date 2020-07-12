const fs = require('fs');
const xml = require('xml2js');

class JUnit {
  constructor(filename) {
    this.data = fs.readFileSync(filename);
  }

  async parse() {
    const parser = new xml.Parser();
    const json = await parser.parseStringPromise(this.data);
    const { suites, stats } = this.parseRootSuite(json.testsuites.testsuite[0]);
    console.log(suites[24].cases[1]);
  }

  parseStats(stats) {
    const STRING_FIELDS = ['name', 'file', 'classname'];
    const NUMBER_FIELDS = ['tests', 'assertions', 'errors', 'warnings', 'failures', 'skipped', 'time', 'line'];
    const res = {};
    for(const field of STRING_FIELDS) {
      if(field in stats) res[field] = stats[field];
    }
    for(const field of NUMBER_FIELDS) {
      if(field in stats) res[field] = Number(stats[field]);
    }

    return res;
  }

  parseRootSuite(rootSuite) {
    let suites = [];
    const stats = this.parseStats(rootSuite.$);
    for(const suite of rootSuite.testsuite) {
      suites.push(this.parseSuite(suite));
    }
    return { suites, stats };
  }

  parseSuite(suite) {
    let cases = [];
    const stats = this.parseStats(suite.$);
    for(const _case of suite.testcase) {
      cases.push(this.parseCase(_case));
    }
    return { cases, stats };
  }

  parseCase(_case) {
    let failures = [];
    const stats = this.parseStats(_case.$);
    if('failure' in _case) {
      stats.failed = true;
      for(const fail of _case.failure) {
        failures.push(this.parseFailure(fail));
      }
    } else {
      stats.failed = false;
    }
    return { failures, stats };
  }

  parseFailure(fail) {
    return { type: fail.$.type, message: fail._ };
  }
}

module.exports = JUnit;
