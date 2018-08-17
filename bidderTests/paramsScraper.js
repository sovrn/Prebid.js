const fs = require('fs');
const { promisify } = require('util');

const PATH = 'modules/';

const EXTENSION_PATTERN = '\\.md$';
const CODE_BLOCK_PATTERN = /^\s*```[^`]*$/;
const FILE_NAME_PATTERN = new RegExp(`^${PATH}(.*)BidAdapter${EXTENSION_PATTERN}`);

const readFileAsync = promisify(fs.readFile);

function extractAdUnitsFromScriptBlock(scriptLines) {
  const script = scriptLines.join("\n");
  try {
    eval(script);

    return adUnits; // most of the samples create an array called `adUnits`
  } catch (e) {
    // didn't get valid javascript in the code block
    // console.error("found code block with invalid js: " + e + "\n" + script);
  }
}

async function extractAdUnitsFromFile(filepath) {
  let inCodeBlock = false;
  let foundAdUnits = [];
  let scriptLines = [];

  const lines = (await readFileAsync(filepath)).toString().match(/^.+$/gm);
  lines.forEach(line => {
    const match = line.match(CODE_BLOCK_PATTERN);
    if(match) {
      inCodeBlock = !inCodeBlock;
      if(!inCodeBlock) { // just got done compiling a block of code
        const adUnits = extractAdUnitsFromScriptBlock(scriptLines);
        if(adUnits && adUnits.length) {
          foundAdUnits = foundAdUnits.concat(adUnits);
        }

        scriptLines = [];
      }
    } else if(inCodeBlock) {
      scriptLines.push(line);
    }
  });

  if(foundAdUnits.length) {
    const bidder = filepath.match(FILE_NAME_PATTERN)[1];
    return { [bidder]: foundAdUnits };
  } else {
    throw filepath;
  }
}

async function extractAdUnitsFromAllFiles() {
  const tasks = [];
  const failed = [];

  fs.readdirSync(PATH).filter(f => f.match(EXTENSION_PATTERN)).forEach(f =>
      tasks.push(extractAdUnitsFromFile(PATH + f).catch(err => failed.push(err))));

  const waits = [];
  for(let i = 0; i < tasks.length; i++) {
    waits.push(await tasks[i]);
  }

  return [Object.assign({}, ...waits), failed];
}

async function processAdUnits(success, failure) {
  const [allAdUnits, failedFiles] = await extractAdUnitsFromAllFiles();
  success(allAdUnits);
  failure(failedFiles)
}

processAdUnits(
  aus => {
    console.info("Ad units:");
    console.log(JSON.stringify(aus, null, 2));
  },
  fs => {
    console.error("Failed files:");
    console.error(fs);
  }
);
