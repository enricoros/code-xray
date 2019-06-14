/* Copyright 2019 Enrico Ros

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
"use strict";

// use modules from D3 (hierarchy, colors), Canvas (Cairo-based sw canvas), and FS
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const options = require('minimist')(process.argv.slice(2));

// help
const chalk = require('chalk');
const print = console.log;
const chalkCloc = chalk.blue('cloc');
const cloc_shell_cmd = 'cloc --by-file --json --quiet --hide-rate ./';
const abort = (s, showUsage = false) => {
    print(chalk.redBright('Error: ') + s);
    if (showUsage) {
        print('Available options');
        print();
        print('  Input options - use either of:');
        print('     --dir    directory    runs ' + chalk.blue.underline(cloc_shell_cmd) + ' on this directory');
        print('     --file   filename     loads a saved ' + chalkCloc + ' json file with per-file statistics');
        print();
        print('  Content options:');
        print('     --root   name         name the root node: default \'root\'');
        print();
        print('  Output options:');
        print('     --store  filename     caches the --dir ' + chalkCloc + ' output, for subsequent use with --file');
        print('     --out    filename     writes the hierarchical JSON to file');
        print();
    }
    process.exit(1);
};

// input: from Cloc command line stdout on dir
function readOutputOfClocOnDir(dir) {
    if (dir !== undefined && fs.statSync(dir).isDirectory()) {
        print('A folder was supplied, running ' + chalkCloc + ' on ' + chalk.underline(dir));
        try {
            const clocJsonOutput = child_process.execSync(cloc_shell_cmd, {cwd: dir, encoding: 'utf8', stdio: 'pipe'});
            print('done.');
            if (options['store']) {
                print('Saving the file to ' + chalk.underline(options['store']) + ' as requested');
                fs.writeFileSync(options['store'], clocJsonOutput);
            }
            return clocJsonOutput;
        } catch (e) {
            abort('cannot run the ' + chalkCloc + ' tool. make sure cloc 1.80+ is present in this system');
        }
    }
}

// input: from file
function readClocFile(file) {
    if (file !== undefined && fs.statSync(file).isFile()) {
        print('Reading ' + chalk.underline(file) + '. Done.');
        return fs.readFileSync(file, 'utf8');
    }
}

// parse CLOC JSON to a list of files: {name, dir, code, language}
function parseClocJson(jsonString) {
    const fileStats = [];
    let json;
    try {
        json = JSON.parse(jsonString);
    } catch (e) {
        abort('error parsing the json input format.')
    }
    // parse the Cloc 1.80+ JSON output; ignore header and sum
    delete json['header'];
    delete json['SUM'];
    for (const [filePath, file] of Object.entries(json)) {
        if (!filePath.startsWith('./'))
            abort('expected all files to begin with ./');
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
function makeDirStatsTree(filesStats) {
    const root = {'name': options['root'] || 'root', files: [], children: []};
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

/* compute the 'net code statistics', adding to each node: {depth, lang_local, lang_rollup, value, value_lang}
Note that the output structure is directly parsable by 'd3-hierarchy' as {name, value, children[]} are present
 */
function updateDirStatValuesRecursively(dirNode, depth) {
    // local stats (accumulate on a per-language basis)
    dirNode.depth = depth;
    dirNode.lang_local = {};
    dirNode.files.forEach(f => dirNode.lang_local[f.language] = (dirNode.lang_local[f.language] || 0) + f.code);
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
print('== Welcome to ' + chalk.red('Code X-RAY') + ' ==');

const clocJsonOutput =
    readOutputOfClocOnDir(options['dir'] /*|| options['_'][0]*/) ||
    readClocFile(options['file'] /*|| options['_'][0]*/) ||
    abort('Need to specify either a valid folder or an existing input file.', true);

const filesStats = parseClocJson(clocJsonOutput);

print('Computing per-folder source code statistics.');
const graphStats = makeDirStatsTree(filesStats);
updateDirStatValuesRecursively(graphStats, 0);

if (options['out']) {
    fs.writeFileSync(options['out'], JSON.stringify(graphStats, null, 4));
    print('Hierarchy saved to: ' + chalk.underline(options['out']));
} else {
    print('Not saving the output, since --out was not specified');
}
print('All done.');

// output example
// {
//     "name": "root",
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
