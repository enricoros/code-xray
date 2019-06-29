import path from "path";
import {DEBUGGING} from "./config";

export const sortDescByKpi = kpi => (a, b) => b[kpi] - a[kpi];

// parse CLOC JSON to a list of files: {name, dir, langStats}
export function clocJsonToFileStatsList(cj) {
  if (DEBUGGING) {
    console.log('Loaded a file generated from cloc: ' + cj['header']['cloc_version']);
    console.log(cj['header']);
  }
  delete cj['header'];
  delete cj['SUM'];
  const fsl = [];
  for (const [filePath, clocFile] of Object.entries(cj)) {
    if (!filePath.startsWith('./'))
      throw new Error('Expected all files to begin with "./", this is wrong: ' + filePath);
    fsl.push({
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
  return fsl;
}

// returns a list of langStats summing up by language name
export function reduceLangStatsByLanguage(langsStatsList) {
  return langsStatsList.reduce((acc, langStats) => {
    let lang = acc.find(l => l.name === langStats.name);
    if (!lang)
      acc.push(lang = {name: langStats.name});
    ['code', 'blank', 'comment', 'files'].forEach(
      kpi => lang[kpi] = (lang[kpi] || 0) + langStats[kpi]);
    return acc;
  }, []);
}

export function reduceLangStatsToSum(langsStatsList) {
  return langsStatsList.reduce((acc, langStats) => {
    ['code', 'blank', 'comment', 'files'].forEach(
      kpi => acc[kpi] = (acc[kpi] || 0) + langStats[kpi]);
    return acc;
  }, {name: '_SUM_'});
}

export function langStatsFromFilesStats(filesStats) {
  return reduceLangStatsByLanguage(filesStats.map(f => f.langStats))
    .sort(sortDescByKpi('code'));
}

// create a Tree representation of folders, with contained files: {name, files[], children[]}
function makeDirStatsTree(filesStats, projectName) {
  const root = {is_project: true, 'name': projectName, files: [], children: []};
  filesStats.forEach(fileStat => {
    // create & walk the sub-folder structure
    let fileDir = root;
    fileStat['dir'].split(path.sep).forEach(subName => {
      if (subName === '.' || subName === '') return;
      let subFolder = fileDir.children.find(e => e.name === subName);
      if (!subFolder) {
        subFolder = {'name': subName, files: [], children: []};
        fileDir.children.push(subFolder);
      }
      fileDir = subFolder;
    });
    // add this file
    fileDir.files.push(fileStat);
  });
  return root;
}
