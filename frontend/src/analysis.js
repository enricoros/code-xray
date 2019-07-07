import path from "path";
import {DEBUGGING} from "./config";

export const descendingByKey = kpi => (a, b) => b[kpi] - a[kpi];
export const SEPARATOR = '/';

const codeStatKPIs = ['code', 'blank', 'comment', 'files'];
const makeCodeStat = (languageName, code, blank, comm, f) => {
  return {
    name: languageName,
    code: code || 0,    // lines
    blank: blank || 0,  // lines
    comment: comm || 0, // lines
    files: f || 0,
  }
};

const makeFileStat = (fileName, fileDir, codeStatList) => {
  return {
    name: fileName,
    dir: fileDir,
    codeStatList: codeStatList,
  }
};

export const makeDirNode = (name, parentPath) => {
  return {
    name: name,
    path: parentPath !== undefined ? parentPath + SEPARATOR + name : name,
    fileStatList: [],
    children: []
  }
};

export const makeProject = (projectName, fileStatList, langStatList) => {
  if (!langStatList)
    langStatList = reduceCodeStatListByName(fileStatList.map(f => f.codeStatList).flat())
      .sort(descendingByKey('code'));
  return {
    name: projectName,
    unfiltered: {
      fileStatList: fileStatList,
      langStatList: langStatList,
      codeStatSum: reduceCodeStatListToSum(langStatList),
    },
  };
};

// create a list of FileStat (including CodeStat) from the Cloc JSON
export function clocJsonToFileStatList(cj) {
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
      [makeCodeStat(clocFile['language'], clocFile['code'], clocFile['blank'], clocFile['comment'], 1)]
    ));
  }
  return l;
}

// returns a list of codeStar summing up by language name
export function reduceCodeStatListByName(l) {
  return l.reduce((listByLang, cs) => {
    let lang = listByLang.find(l => l.name === cs.name);
    if (!lang)
      listByLang.push(lang = makeCodeStat(cs.name));
    codeStatKPIs.forEach(kpi => lang[kpi] += cs[kpi]);
    return listByLang;
  }, []);
}

// return a single codeStat with the overall sum
export function reduceCodeStatListToSum(l) {
  return l.reduce((csSum, cs) => {
    codeStatKPIs.forEach(kpi => csSum[kpi] += cs[kpi]);
    return csSum;
  }, makeCodeStat('_SUM_'));
}

// create a Tree representation of folders, with contained files: {name, files[], children[]}
export function makeProjectDirNodeTree(fileStatList, projectName) {
  const root = makeDirNode(projectName);
  root.is_project = true; // FIXME: HACK
  fileStatList.forEach(fs => {
    // create & walk the sub-folder structure
    let fileNode = root;
    fs.dir.split(SEPARATOR).forEach(subName => {
      if (subName === '.' || subName === '') return;
      let subFolder = fileNode.children.find(c => c.name === subName);
      if (!subFolder) {
        subFolder = makeDirNode(subName, fileNode.path);
        fileNode.children.push(subFolder);
      }
      fileNode = subFolder;
    });
    // add this file
    fileNode.fileStatList.push(fs);
  });
  return root;
}

// when a directory only has 1 sub-folder and no files, fuse-in that sub-folder contents (similar to github's path simplifier)
export function collapseDegenerateDirectories(node) {
  let fused = false;
  while (node.children.length === 1 && node.fileStatList.length === 0) {
    const child = node.children[0];
    node.name = node.name + SEPARATOR + child.name;
    node.fileStatList = child.fileStatList;
    node.children = child.children;
    fused = true;
  }
  if (fused && DEBUGGING)
    console.log('fused: ' + node.name);
  // this node is okay, recurse to children
  node.children.forEach(c => collapseDegenerateDirectories(c));
}


// recursively compute code statistics; the root node has the whole project language statistics
export function updateTreeStatsRecursively(node, newDepth, sum_kpi) {
  // local stats: reduce languages of all local files
  const localCodeStatList = reduceCodeStatListByName(node.fileStatList.map(fs => fs.codeStatList).flat());

  // rollup code stats: reduce( local + all children stats )
  let rollupCodeStatList = [].concat(localCodeStatList);
  let invDepth = 0;
  node.children.forEach(c => {
    updateTreeStatsRecursively(c, newDepth + 1, sum_kpi);
    rollupCodeStatList.push(c.rollupCodeStatList);
    if (c.invDepth >= invDepth) invDepth = c.invDepth + 1;
  });
  rollupCodeStatList = reduceCodeStatListByName(rollupCodeStatList.flat());

  // final node value_lang = the dominant language in the folder and sub-folders
  const sumByKpi = rollupCodeStatList.reduce((acc, cs) => acc + cs[sum_kpi], 0);

  // we could assign these incrementally, but I like making the edit atomic and explicit
  Object.assign(node, {
    depth: newDepth,
    invDepth: invDepth,
    value: sumByKpi,
    localCodeStatList: localCodeStatList,
    rollupCodeStatList: rollupCodeStatList.sort(descendingByKey('code')),
  });
}
