import path from "path";
import {DEBUGGING} from "./config";


// constants
const DEFAULT_NO_LANGUAGES = [
  'XML', 'YAML', 'Dockerfile', 'Protocol Buffers', 'HTML', 'Bourne Shell', 'Markdown', 'CMake',
  'PowerShell', 'Windows Module Definition', 'DOS Batch', 'Pascal', 'MSBuild script'
];


// parse CLOC JSON to a list of files: {name, dir, code, language}
function clocJsonToFilesStats(cj) {
  if (DEBUGGING) {
    console.log('Loaded a file generated from cloc: ' + cj['header']['cloc_version']);
    console.log(cj['header']);
    console.log(cj['SUM']);
  }
  delete cj['header'];
  delete cj['SUM'];
  const list = [];
  for (const [filePath, clocFile] of Object.entries(cj)) {
    if (!filePath.startsWith('./'))
      throw new Error('Expected all files to begin with "./", this is wrong: ' + filePath);
    list.push({
      'name': path.basename(filePath.substring(2)),
      'dir': path.dirname(filePath.substring(2)),
      'code': clocFile['code'],
      'blank': clocFile['blank'],
      'comment': clocFile['comment'],
      'language': clocFile['language'],
      // '_': clocFile,
    });
  }
  return list;
}

// language statistics for the project
function langStatsFromFilesStats(filesStats) {
  let languages = {};
  filesStats.forEach((f) => languages[f.language] = (languages[f.language] || 0) + f.code);
  languages = Object.entries(languages)
    .map((entry) => {
      return {
        'name': entry[0],
        'code': entry[1],
      }
    })
    .sort((a, b) => b['code'] - a['code']);
  // const total = languages.reduce((prev, curr) => prev + curr['code'], 0);
  return languages;
}

//


export {clocJsonToFilesStats, langStatsFromFilesStats, DEFAULT_NO_LANGUAGES}

