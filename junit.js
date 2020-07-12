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
    console.log(suites);
  }

  parseStats(stats) {
    const STRING_FIELDS = ['name', 'file'];
    const NUMBER_FIELDS = ['tests', 'assertions', 'errors', 'warnings', 'failures', 'skipped', 'time'];
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
    return { cases, stats };
  }
}

module.exports = JUnit;
