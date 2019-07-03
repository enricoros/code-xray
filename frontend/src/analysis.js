import path from "path";
import {DEBUGGING} from "./config";

export const descendingByKey = kpi => (a, b) => b[kpi] - a[kpi];

const codeStatNumFields = ['code', 'blank', 'comment', 'files'];
const makeCodeStat = (languageName, code, blank, comm, f) => {
  return {
    name: languageName,
    code: code || 0,    // lines
    blank: blank || 0,  // lines
    comment: comm || 0, // lines
    files: f || 1.0,
  }
};

const makeFileStat = (fileName, fileDir, codeStatList) => {
  return {
    name: fileName,
    dir: fileDir,
    codeStatList: codeStatList,
  }
};

export const makeProject = (projectName, fileList) => {
  const languageStats = reduceCodeStatListByName(fileList.map(f => f.codeStatList).flat());
  const languageTotal = reduceCodeStatListToSum(languageStats);
  return {
    name: projectName,
    unfiltered: {
      filesStats: fileList,
      langsStats: languageStats.sort(descendingByKey('code')),
      langsSumStats: languageTotal,
    },
  };
};

// create a list of FileStat (including CodeStat) from the Cloc JSON
export function clocJsonToFileList(cj) {
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
    l.push(makeFileStat(
      path.basename(filePath.substring(2)),
      path.dirname(filePath.substring(2)),
      // note: Cloc provide only a single language per file, assume 1.0
      [makeCodeStat(clocFile['language'], clocFile['code'], clocFile['blank'], clocFile['comment'],)]
    ));
  }
  return l;
}

// returns a list of langStats summing up by language name
export function reduceCodeStatListByName(l) {
  return l.reduce((listByLang, cs) => {
    let lang = listByLang.find(l => l.name === cs.name);
    if (!lang)
      listByLang.push(lang = makeCodeStat(cs.name));
    codeStatNumFields.forEach(kpi => lang[kpi] += cs[kpi]);
    return listByLang;
  }, []);
}

export function reduceCodeStatListToSum(l) {
  return l.reduce((csSum, cs) => {
    codeStatNumFields.forEach(kpi => csSum[kpi] += cs[kpi]);
    return csSum;
  }, makeCodeStat('_SUM_'));
}

// create a Tree representation of folders, with contained files: {name, files[], children[]}
/*function makeDirStatsTree(filesStats, projectName) {
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
}*/
