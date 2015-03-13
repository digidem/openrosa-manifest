var crypto = require('crypto');
var request = require('request');
var builder = require('xmlbuilder');
var async = require('async');
var extend = require('xtend');
var url = require('url');

var defaults = {
  headers: {
    'User-Agent': 'openrosa-manifest'
  }
};

// RegExp used to replace filename in options.downloadUrl
// var URL_RE = /\$\{\s*filename\s*\}/;

/**
 * Creates a valid Manifest XML document according to
 * https://bitbucket.org/javarosa/javarosa/wiki/FormListAPI
 * @param  {Array}   files    An array of Urls for each form, streams (could
 * be a file read stream or a response stream), or full XML text of the form
 * @param  {Object}   [options]  `options.downloadUrl` is a template for the
 * url where the form is located, in the format `http://example.com/forms/${formId}.xml`. `${formId}` will be replaced by the actual form Id of each form. `options.manifestUrl` is the url template for the location of the manifest xml document (only included if external media is referenced in the xForm)
 * @param  {Function} callback Called with `(err, data)` where `data` is a
 * valid formListAPI Xml document
 * @example
 * var createFormList = require('openrosa-formlist');
 *
 * var forms = [
 *   'https://opendatakit.appspot.com/formXml?formId=widgets',
 *   'https://opendatakit.appspot.com/formXml?formId=Birds'
 * ];
 *
 * createFormList(forms, function(err, data) {
 *   console.log(data) // outputs formList Xml
 * })
 */
function createManifest(files, options, callback) {
  if (arguments.length === 2) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else {
      throw 'Must provide a callback function';
    }
  }

  options = extend(defaults, options);

  async.map(files, function(file, cb) {
    if (!file.url) return cb(new Error('Need to specify file.url'));
    file.filename = file.filename || parseFilename(file.url);
    file.downloadUrl = file.url;
    delete file.url;
    if (file.hash) return cb(null, { mediaFile: file });
    var md5 = crypto.createHash('md5');
    md5.setEncoding('hex');
    request
      .get(file.downloadUrl)
      .on('error', cb)
      .on('end', function() {
        md5.end();
        file.hash = 'md5:' + md5.read();
        cb(null, { mediaFile: file });
      })
      .pipe(md5);
  }, function(err, results) {
    if (err) callback(err);

    var xml = builder.create({
      manifest: {
        '@xmlns': 'http://openrosa.org/xforms/xformsManifest',
        '#list': results
      }
    }, {
      encoding: 'UTF-8'
    }).end({
      pretty: true
    });

    callback(null, xml);
  });
}

function parseFilename(_) {
  return url.parse(_).pathname.split('/').pop();
}

module.exports = createManifest;
