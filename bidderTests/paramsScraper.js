const fs = require('fs');
const readline = require('readline');

const PATH = 'modules/';
const CODE_BLOCK_PATTERN = /^\s*```([^`]*)$/;
const FILE_NAME_PATTERN = /^modules\/(.*)BidAdapter\.md$/
const PROMISES = [];
const FAILED_FILES = [];
let allAdUnits = {};

function extract(file) {
  return new Promise((resolve, reject) => {
    const lineReader = readline.createInterface({
      input: fs.createReadStream(file)
    });

    let inCodeBlock = false;
    let foundAdUnits = [];
    let scriptLines = [];

    lineReader.on('line', line => {
      const match = line.match(CODE_BLOCK_PATTERN);
      if(match) {
        inCodeBlock = !inCodeBlock;
        if(!inCodeBlock) { // just got done compiling a block of code
          const adUnits = extractAdUnits(scriptLines);
          if(adUnits && adUnits.length) {
            foundAdUnits = foundAdUnits.concat(adUnits);
          }

          scriptLines = [];
        }
      } else if(inCodeBlock) {
        scriptLines.push(line);
      }
    }).on('close', () => {
      if(foundAdUnits.length) {
        const bidder = file.match(FILE_NAME_PATTERN)[1];
        resolve({[bidder]: foundAdUnits});
      } else {
        reject(file);
      }
    });
  });
}

function extractAdUnits(scriptLines) {
  const script = scriptLines.join("\n");
  try {
    eval(script);

    return adUnits; // most of the samples create an array called `adUnits`
  } catch (e) {
    // didn't get valid javascript in the code block
    // console.error("found non-js code block: " + e + "\n" + script);
  }
}

fs.readdirSync(PATH).filter(f => f.endsWith('.md')).forEach(f => {
  PROMISES.push(extract(PATH + f).catch(err => FAILED_FILES.push(err)));
});

Promise.all(PROMISES)
  .then((res) => {
      allAdUnits = Object.assign({}, ...res);
      console.log(JSON.stringify(allAdUnits, null, 2));
    })
  .catch(err => console.error("ERROR:\n" + err));
