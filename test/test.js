var test = require('tape');
var fs = require('fs');
var createManifest = require('../');

var files = [{
    url: 'https://raw.githubusercontent.com/digidem-test/xform-test/master/forms/monitoring/si.png'
  }, {
    url: 'https://raw.githubusercontent.com/digidem-test/xform-test/master/forms/monitoring/no.png'
  }
];

test('Produces correct manifest xml', function(t) {
  var expectedXml = fs.readFileSync(__dirname + '/fixtures/manifest.xml').toString().trim();
  createManifest(files, function(err, result) {
    t.error(err, 'Does not produce error');
    t.equal(result, expectedXml, 'Matches expected xml FormList');
    t.end();
  });
});
