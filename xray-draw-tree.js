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

// use modules from D3 (hierarchy, colors), Canvas (Cairo-based sw canvas), minimist, chalk, and built-in (fs)
const d3h = require("d3-hierarchy");
const {schemeCategory10, interpolateYlGnBu} = require("d3-scale-chromatic");
const {scaleOrdinal} = require("d3-scale");
const {createCanvas} = require("canvas");
const fs = require("fs");
const path = require('path');
const options = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');

// help
const print = console.log;
const quit = (s, showUsage = false) => {
    if (s) print(chalk.redBright('Error: ') + s);
    if (showUsage) {
        print('Usage:  node ' + path.basename(__filename) + ' ' + chalk.greenBright('input.xray') + ' [options]');
        print('\n  The input file is the output of ' + chalk.greenBright('xray-gen-tree') + '.');
        print('\n  Content options:');
        print('    --hide-below N          hide content below this depth, default: 0 (Project depth)');
        print('    --hide-above N          hide content above this depth, default: 99');
        print('    --hide-labels-above N   hide labels above this depth, default: 6');
        print('    --thin-labels-above N   reduce labels above this depth, default: 3');
        print('\n  Output options:');
        print('    --out filename.png      saves the output png file, default: tree.png');
    }
    process.exit(1);
};

// parametric configuration, def: h=2000, w=auto(16:9)
let height = options['height'] || 2000,
    width = options['width'];
if (width && !options['height'])
    height = (~~(width * 9 / 16));
if (height && !width)
    width = (~~(height * 16 / 9));
const hide_below = options['hide-below'] || 0; // note: the multi-project container (if present) is depth -1
const hide_above = options['hide-above'] || 99; // note: the multi-project container (if present) is depth -1
const gray_on = hide_below;
const shrink_on = gray_on;
const hide_labels_above = options['hide-labels-above'] || 6;
const thin_labels_above = options['thin-labels-above'] || ~~(hide_labels_above / 2);

// derived constants
const paddingLabel = ~~(height / 50);
const paddingBorder = ~~(paddingLabel);
const fontPx = ~~(0.9 * paddingLabel);
const boxShadowPx = ~~(paddingBorder / 3);
const fontShadowPx = ~~(fontPx / 3);
const shrinkInnerPadding = ~~(paddingBorder / 2);


// graphical & drawing & color functions
let fColorIdx = 0, fColorIdx2 = 0.2;
const fColor = scaleOrdinal(schemeCategory10);
const fColorI = () => fColor(++fColorIdx);
const fColor2I = () => interpolateYlGnBu(fColorIdx2 += 0.015);

function setShadow(ctx, color, shadowPx) {
    ctx.shadowColor = color ? color : '#0000';
    ctx.shadowBlur = shadowPx ? shadowPx : 0;
    ctx.shadowOffsetX = ctx.shadowOffsetY = shadowPx ? ~~(shadowPx / 2) : 0;
}

function removeShadow(ctx) {
    setShadow(ctx);
}

function drawFolderBox(ctx, dh, shrinkBox, forceFill) {
    const isLeaf = !dh.children;
    // shrink project nodes
    if (shrinkBox) {
        dh.x0 += shrinkInnerPadding;
        dh.x1 -= shrinkInnerPadding;
        dh.y1 -= shrinkInnerPadding;
    }
    // stroke: not if leaf (note: half will be painted by the 'fillRect' call)
    if (!isLeaf && !shrinkBox) {
        removeShadow(ctx);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
    }
    // fill: if leaf, strong color and no shadow
    if (isLeaf) {
        removeShadow(ctx);
        ctx.fillStyle = fColorI();
    } else {
        // if inner node, more depth-based coloring and shadow
        setShadow(ctx, 'rgba(0,0,0,0.5)', boxShadowPx);
        ctx.fillStyle = fColor2I();
        // ctx.fillStyle = interpolateYlGnBu(0.1 + (dh.data.depth - 1) / 6 + (Math.random() - Math.random()) / 28);
    }
    if (forceFill)
        ctx.fillStyle = forceFill;
    ctx.fillRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
}

function drawFolderLabel(ctx, d, thinLabels) {
    let label = d.data.name + ' (' + d.data.value + ')';
    if (thinLabels)
        label = d.data.name;

    setShadow(ctx, 'black', fontShadowPx);
    ctx.font = fontPx + "px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = d.children ? 'white' : 'white';
    ctx.fillText(label, ~~((d.x0 + d.x1) / 2), ~~(d.y0 + fontPx * 0.85));
}

// Main
print('== Welcome to ' + chalk.red('Code X-RAY') + ' Part II, ' + chalk.greenBright('The Artist') + ' ==');
if (options['help'])
    quit(undefined, true);

// load Code X-Ray graph
const inputFilePath = options['_'][0];
print('> Loading graph from: ' + chalk.underline(inputFilePath));
const dataTree = fs.existsSync(inputFilePath) ? JSON.parse(fs.readFileSync(inputFilePath, 'utf8')) : {
    "name": "Example hierarchical data - please supply a Code X-Ray file instead.", "value": 800,
    "children": [
        {
            "name": "B1", "value": 600, "children": [
                {"name": "C1", "value": 100}, {"name": "C2", "value": 300}, {"name": "C3", "value": 200}
            ]
        },
        {"name": "B2", "value": 200}
    ]
};

// process data and do layout rectangles
const dataHierarchy = d3h.hierarchy(dataTree);
const treeMap = d3h.treemap()
    .tile(d3h.treemapSquarify)
    .size([width, height])
    .paddingOuter(paddingBorder)
    .paddingTop(paddingLabel)
    (dataHierarchy);

// create and erase canvas
print('> Drawing to a ' + width + ' by ' + height + ' canvas');
const canvas = createCanvas(width, height);
const context = canvas.getContext('2d');
context.fillStyle = 'transparent';
context.fillRect(0, 0, canvas.width, canvas.height);

// draw each rectangle
if (hide_below !== 0 || hide_above !== 1)
    print('  > Hiding below ' + hide_below + ', above ' + hide_above +
        ', hide labels above ' + hide_labels_above + ', and thin above ' + thin_labels_above );
treeMap.each(dh => {
    const depth = dh.data.depth;
    if (depth < hide_below || depth > hide_above) return;
    drawFolderBox(context, dh, depth <= shrink_on, depth <= gray_on ? 'gray' : undefined);
    if (depth <= hide_labels_above)
        drawFolderLabel(context, dh, depth > thin_labels_above);
});

// save the output image
let saveFileName = 'tree.png';
if (options['out'])
    saveFileName = options['out'].indexOf('.') === -1 ? (options['out'] + '.png') : options['out'];
print('> Saving canvas to: ' + chalk.underline(saveFileName));
fs.writeFileSync(saveFileName, canvas.toBuffer());
print('All done.');
