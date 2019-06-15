#!/usr/bin/env node
/* Copyright 2019 Enrico Ros

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */
"use strict";

// use standard node modules (fs, path, child_process) and a couple installed (minimist, chalk)
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const options = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');

// help
const print = console.log;
const chalkCloc = chalk.blue('cloc');
const clocOptions = ' --by-file --json --quiet --hide-rate ./';
const cleanupLanguages = ['XML', 'YAML', 'Dockerfile', 'Protocol Buffers', 'HTML', 'Bourne Shell', 'Markdown',
    'CMake', 'PowerShell', 'Windows Module Definition', 'DOS Batch', 'Pascal', 'MSBuild script'];
const cleanupFolders = options['exclude'] ? [].concat(options['exclude']) : [];
const defaultProjectName = 'Project';
const quit = (s, showUsage = false) => {
    if (s) print(chalk.redBright('Error: ') + s);
    if (showUsage) {
        print('Available options');
        print('\n  Input options - use either of:');
        print('     --dir      directory     runs ' + chalk.blue.underline('cloc ' + clocOptions) + ' on this directory');
        print('     --in       filename      loads a saved ' + chalkCloc + ' json file with per-file statistics');
        print('\n  Content options:');
        print('     --exclude  folder/paths  excludes complete folders; provide path from the project root (can be repeated)');
        print('     --clean                  removes non-strictly-source files: ' + cleanupLanguages.join(', '));
        print('     --project  name          names the project (top-level node), default: ' + defaultProjectName);
        print('\n  Output options:');
        print('     --cache    filename      caches the --dir ' + chalkCloc + ' output, for subsequent use with --in');
        print('     --out      filename      writes the hierarchical JSON to file');
    }
    process.exit(1);
};

// input: from Cloc command line stdout on dir
let globalProjectCount = 0;

function readOutputOfClocOnDir(dir) {
    if (dir !== undefined && fs.statSync(dir).isDirectory()) {
        print(' ' + (++globalProjectCount) + '. Running ' + chalkCloc + ' on folder: ' + chalk.underline(dir));
        try {
            let clocCmd = process.mainModule.paths[0] + path.sep + '.bin' + path.sep + 'cloc';
            if (!fs.existsSync(clocCmd)) {
                clocCmd = 'cloc';
                print('   > local cloc ' + chalk.redBright('not found') + '. trying global ' + chalk.whiteBright(clocCmd));
            } else
                print('   > using local cloc install on ' + chalk.whiteBright(clocCmd));
            clocCmd = clocCmd + ' ' + clocOptions;
            const clocJsonOutput = child_process.execSync(clocCmd, {cwd: dir, encoding: 'utf8', stdio: 'pipe'});
            if (options['cache']) {
                print('   > caching the cloc output to ' + chalk.underline(options['cache']) + ' as requested');
                fs.writeFileSync(options['cache'], clocJsonOutput);
            }
            return clocJsonOutput;
        } catch (e) {
            quit('cannot run the ' + chalkCloc + ' tool. make sure cloc 1.80+ is present in this system. Issue:\n' + e);
        }
    }
}

// input: from file
function readClocFile(file) {
    if (file !== undefined && fs.statSync(file).isFile()) {
        print(' ' + (++globalProjectCount) + '. Reading ' + chalk.underline(file));
        return fs.readFileSync(file, 'utf8');
    }
}

// parse CLOC JSON to a list of files: {name, dir, code, language}
function sourceStatsFromClocJson(jsonString) {
    const fileStats = [];
    let json;
    try {
        json = JSON.parse(jsonString);
    } catch (e) {
        quit('error parsing the json input format.')
    }
    // parse the Cloc 1.80+ JSON output; ignore header and sum
    delete json['header'];
    delete json['SUM'];
    for (const [filePath, file] of Object.entries(json)) {
        if (!filePath.startsWith('./'))
            quit('expected all files to begin with ./');
        // ignore data: 'blank' and 'comment' - not useful
        fileStats.push({
            'name': path.basename(filePath.substring(2)),
            'dir': path.dirname(filePath.substring(2)),
            'code': file['code'],
            'language': file['language'],
        });
    }
    return fileStats;
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

// when a directory only has 1 sub-folder and no files, fuse-in that sub-folder contents (similar to github's path simplifier)
function collapseDegenerateDirectories(node) {
    let fused = false;
    while (node.children.length === 1 && node.files.length === 0) {
        const child = node.children[0];
        node.name = node.name + path.sep + child.name;
        node.files = child.files;
        node.children = child.children;
        fused = true;
    }
    if (fused)
        print('  > fused: ' + chalk.italic(node.name));
    // this node is okay, recurse to children
    node.children.forEach(c => collapseDegenerateDirectories(c));
}

/* compute the 'net code statistics', adding to each node: {depth, lang_local, lang_rollup, value, value_lang}
Note that the output structure is directly parsable by 'd3-hierarchy' as {name, value, children[]} are present
 */
function updateDirStatValuesRecursively(dirNode, depth) {
    // local stats (accumulate on a per-language basis)
    dirNode.depth = depth;
    dirNode.lang_local = {};
    dirNode.files.forEach(f => dirNode.lang_local[f.language] = (dirNode.lang_local[f.language] || 0) + f.code);
    // DEBUG: comment the following to leave 'files'
    delete dirNode.files;

    // sum local to children stats
    dirNode.lang_rollup = Object.assign({}, dirNode.lang_local);
    dirNode.children.forEach(c => {
        updateDirStatValuesRecursively(c, depth + 1);
        for (let [c_lang, c_count] of Object.entries(c.lang_rollup)) {
            dirNode.lang_rollup[c_lang] = (dirNode.lang_rollup[c_lang] || 0) + c_count;
        }
    });

    // final node value = sum of all kinds of code
    dirNode.value = Object.values(dirNode.lang_rollup).reduce((sum, value) => sum + value);
    // final node value_lang = the dominant language in the folder and sub-folders
    dirNode.value_lang = Object.keys(dirNode.lang_rollup)
        .reduce((a, b) => dirNode.lang_rollup[a] > dirNode.lang_rollup[b] ? a : b);

    return dirNode;
}

// Main
print('== Welcome to ' + chalk.red('Code X-RAY') + ' Part I, ' + chalk.blueBright('The Mathematician') + ' ==');
if (options['help'])
    quit(undefined, true);

// input: read all the files and folders supplied
const projectsClocJsons = [];
if (options['dir'])
    [].concat(options['dir']).forEach(dir => projectsClocJsons.push(readOutputOfClocOnDir(dir)));
if (options['in'])
    [].concat(options['in']).forEach(file => projectsClocJsons.push(readClocFile(file)));
if (projectsClocJsons.length < 1)
    quit('Need to specify either valid folders or an existing cloc json files.', true);

// parse JSON and create a tree for every project
print('> Transforming per-file statistics to folder trees for ' + projectsClocJsons.length + ' project/s.');
let graphsStats = {is_multi_project: true, 'name': defaultProjectName, files: [], children: []};
projectsClocJsons.forEach(jsonString => {
    let sourceFilesStats = sourceStatsFromClocJson(jsonString);
    // cleanup 1: remove entire folders from the export (for example if you didn't care about /scripts/..)
    if (cleanupFolders.length) {
        const countBefore = sourceFilesStats.length;
        sourceFilesStats = sourceFilesStats.filter(file => !cleanupFolders.find(folder => file.dir.startsWith(folder)));
        print('  > --exclude: removed ' + (countBefore - sourceFilesStats.length) + ' files for being in: ' + cleanupFolders.join(', '))
    }
    // cleanup 2: remove files written in misc languages, to improve the SNR
    if (options['clean']) {
        const countBefore = sourceFilesStats.length;
        sourceFilesStats = sourceFilesStats.filter(file => !cleanupLanguages.includes(file.language));
        print('  > --clean: removed ' + (countBefore - sourceFilesStats.length) + ' files for unused languages')
    }
    // create the tree, and add it to the multi-project holder
    const dirStatsTree = makeDirStatsTree(sourceFilesStats, options['project'] || defaultProjectName);
    // cleanup 3: collapse degenerate a-b-c- .. directories into single 'a/b/c/' nodes
    if (options['clean'])
        collapseDegenerateDirectories(dirStatsTree);
    // tree done for this project
    graphsStats.children.push(dirStatsTree);
});
// collapse the holder 'multi_project' node if only had a single project
if (graphsStats.children.length === 1)
    graphsStats = graphsStats.children[0];

// math time
print('> Computing code and source language share per-project, per-folder');
updateDirStatValuesRecursively(graphsStats, graphsStats.is_multi_project ? -1 : 0);

if (options['out'] && options['out'] !== '') {
    const saveFileName = options['out'].indexOf('.') === -1 ? (options['out'] + '.xray.json') : options['out'];
    fs.writeFileSync(saveFileName, JSON.stringify(graphsStats, null, 4));
    print('> Hierarchy saved to: ' + chalk.underline(saveFileName));
} else {
    print('Not saving the output, since --out was not specified');
}
print('All done.');

// output example
// {
//     "name": "Project",
//     "children": [],
//     "depth": 0,
//     "lang_local": {
//         "JSON": 2339,
//         "Markdown": 296,
//         "CMake": 143
//     },
//     "lang_rollup": {
//         "JSON": 2339,
//         "Markdown": 2188,
//         "CMake": 1969,
//         "C++": 60305,
//         "C/C++ Header": 8928,
//         "Python": 1126,
//         "OpenCL": 1773,
//     },
//     "value": 79444
//     "value_lang": "C++"
// }
