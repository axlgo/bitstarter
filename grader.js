#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); /* http://nodejs.org/api/process.html#process_process_exit_code */
    }
    return instr;
};
/*
var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};
*/
var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};
/*
var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};
*/
var clone = function(fn) {
    /* Workaround for commander.js issue.
     * http://stackoverflow.com/a/6772648*/
    return fn.bind({});
};

/* return a synchronous function readFileSync() so we don't need
 * to wait for its response and no need to worry about callbacks to
 * handle it.
 */
function getBufferFromFile(file) {
   return fs.readFileSync(program.file);
};

/* Hacky way to control asynchronous calls, we pass the
 * scrappingJson function as a callback so after the
 * buffer is filled from the url, the scrapping callback
 * will be executed.
 */
function getBufferFromUrl(url, checks, callback) {
    rest.get(url).on('complete', function(result) {
       if(result instanceof Error) {
          console.log("ERROR: Couldn't load the url requested!\n");
          process.exit(1);
       }
       callback(checks,result);
    });
};

/* scrappingJson function will need the checks data to parso on the
 * buffer. Buffer is an abstracted from either a html file or from
 * a url webpage. On each case there is a routine that will be returning
 * buffer data so scrappingJson can use it.
 */
function scrappingJson(checks, buffer) {
    $ = cheerio.load(buffer);
    var scrapJson = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        scrapJson[checks[ii]] = present;
    }
    var outJson = JSON.stringify(scrapJson, null, 4);
    console.log(outJson);
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url_link>', 'Path to url link')
        .parse(process.argv);

    var checksData = loadChecks(program.checks).sort();
    if(!program.url) {
       scrappingJson(checksData, getBufferFromFile(program.file));
    } else {
       getBufferFromUrl(program.url,checksData,scrappingJson);
    }

} else {
    exports.scrappingJson = scrappingJson;
}
