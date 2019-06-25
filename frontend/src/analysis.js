import path from "path";
import {DEBUGGING} from "./config";


// parse CLOC JSON to a list of files: {name, dir, code, language}
export function clocJsonToFilesStats(cj) {
  if (DEBUGGING) {
    console.log('Loaded a file generated from cloc: ' + cj['header']['cloc_version']);
    console.log(cj['header']);
  }
  delete cj['header'];
  delete cj['SUM'];
  const l = [];
  for (const [filePath, clocFile] of Object.entries(cj)) {
    if (!filePath.startsWith('./'))
      throw new Error('Expected all files to begin with "./", this is wrong: ' + filePath);
    l.push({
      'name': path.basename(filePath.substring(2)),
      'dir': path.dirname(filePath.substring(2)),
      'langStats': {
        'name': clocFile['language'],
        'code': clocFile['code'],
        'blank': clocFile['blank'],
        'comment': clocFile['comment'],
        'files': 1.0,
      },
      // '_': clocFile,
    });
  }
  return l;
}

const sortAscByKpi = kpi => (a, b) => a[kpi] - b[kpi];
export const sortDescByKpi = kpi => (a, b) => b[kpi] - a[kpi];

// language statistics for the project
export function accumulateLangStats(langsStats) {
  return langsStats.reduce((acc, src) => {
    let lang = acc.find(l => l.name === src.name);
    if (!lang)
      acc.push(lang = {name: src.name});
    ['code', 'blank', 'comment', 'files'].forEach(
      kpi => lang[kpi] = (lang[kpi] || 0) + src[kpi]);
    return acc;
  }, []);
}

export function langStatsFromFilesStats(filesStats) {
  return accumulateLangStats(filesStats.map(f => f.langStats))
    .sort(sortDescByKpi('code'));
}

export function langsSumStats(langsStats) {
  return langsStats.reduce((acc, langStats) => {
    ['code', 'blank', 'comment', 'files'].forEach(kpi => acc[kpi] = (acc[kpi] || 0) + langStats[kpi]);
    return acc;
  }, {name: '_SUM_'});
}
