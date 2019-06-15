# Code XRAY
XRAYs a folder and shows the code in a nice looking
[Treemap](https://en.wikipedia.org/wiki/Treemapping). This tool makes it intuitive to look at
new source code, such as a freshly cloned github repo, and understand what's going on at large.

You will see where (which folders) most of the work resides and be quickly able to
navigate the directory structure of the project. The #1 and Only metric used here is Lines
of Code (without blanks and comments) - for sure thee are more metrics, but this  works really well.

### Setup
This tool is written in JavaScript for [Node.js](https://nodejs.org) (version 11+). In addition
make sure Perl is installed globally, for [cloc](https://github.com/AlDanial/cloc) the source
code analysis tool.
```console
git clone https://github.com/enricoros/code-xray.git
cd code-xray
npm install
```

This tool comes in 2 programs to be invoked from shell, in sequence: 
1. Analyze a folder with [xray-gen-tree.js](blob/master/xray-gen-tree.js) and save an XRAY file 
1. Paint the XRAY in a delightful PNG treemap with [xray-draw-tree.js](blob/master/xray-draw-tree.js)

### Example 1: Glow
```console
# from inside the code-xray folder
git clone https://github.com/pytorch/glow.git
node xray-gen-tree.js --dir glow --out glow.xray --clean --exclude tests
node xray-draw-tree.js glow.xray --hide-below 1 --out glow.png
```
<img src="https://raw.githubusercontent.com/enricoros/code-xray/master/examples/glow.17ec51e2.png">

## Analyzer: xray-gen-tree
This tool analyzes a folder (or loads a saved cloc json file) and creates a XRAY file out of it.
This is the **backend** portion of the solution, as the cloc analysis and the tree transformations
tend to be slow.
```console
enrico@localhost ~/code-xray $ ./xray-gen-tree.js --help  
== Welcome to Code X-RAY Part I, The Mathematician ==
Available options

  Input options - use either of:
     --dir      directory     runs cloc  --by-file --json --quiet --hide-rate ./ on this directory
     --in       filename      loads a saved cloc json file with per-file statistics

  Content options:
     --exclude  folder/paths  excludes complete folders; provide path from the project root (repeat)
     --clean                  removes non-strictly-source files, including: XML, YAML, Dockerfile,
                              Protocol Buffers, HTML, Bourne Shell, Markdown, CMake, PowerShell,
                              Windows Module Definition, DOS Batch, Pascal, MSBuild script
     --project  name          names the project (top-level node), default: Project

  Output options:
     --cache    filename      caches the --dir cloc output, for subsequent use with --in
     --out      filename      writes the hierarchical JSON to file
```
Usage example:
```console
enrico@localhost ~/code-xray $ git clone https://github.com/microsoft/onnxruntime
enrico@localhost ~/code-xray $ ./xray-gen-tree.js --dir onnxruntime --out ort --clean
== Welcome to Code X-RAY Part I, The Mathematician ==
 1. Running cloc on folder: onnxruntime
   > using local cloc install on /home/eros/code-xray/node_modules/.bin/cloc
> Transforming per-file statistics to folder trees for 1 project/s.
  > --clean: removed 159 files for unused languages
  > fused: platform/windows
  > fused: codegen/tvm
  > fused: src/Microsoft.ML.OnnxRuntime
  > fused: tools/Microsoft.ML.OnnxRuntime.PerfTool
  > fused: sample/Microsoft.ML.OnnxRuntime.InferenceSample
  > fused: include/onnxruntime/core
  > fused: docs/python
> Computing code and source language share per-project, per-folder
> Hierarchy saved to: ort.xray
All done.
```

## Painter: xray-draw-tree
This tool renders a given XRAY file using the provided style options. This is the frontend portion
of the tool, as it can render the data (XRAY) file into a PNG picture. Eventually this could work
on the web browser and without requiring Node (not yet).   
```console
enrico@localhost ~/code-xray $ ./xray-draw-tree.js --help  
== Welcome to Code X-RAY Part II, The Artist ==
Usage:  node xray-draw-tree.js input.xray [options]

  The input file is the output of xray-gen-tree.

  Style options:
    --width N               picture width, default: height * 16/9
    --height N              picture height, default: 2000
    --hide-below N          hide content below this depth, default: 0 (Project depth)
    --hide-above N          hide content above this depth, default: 99
    --hide-labels-above N   hide labels above this depth, default: 6
    --thin-labels-above N   reduce labels above this depth, default: 3

  Output options:
    --out filename.png      saves the output png file, default: tree.png
```
Usage example:
```console
enrico@localhost ~/code-xray $  ./xray-draw-tree.js ort.xray --width 860 --out ort.png --hide-below 1 --hide-labels-above 4
=== Welcome to Code X-RAY Part II, The Artist ==
> Loading graph from: ort.xray
> Drawing to a 860 by 483 canvas
  > Hiding below 1, above 99, hide labels above 4, and thin above 1
> Saving canvas to: ort.png
All done.
```
<img src="https://raw.githubusercontent.com/enricoros/code-xray/master/examples/ort.08731589.png">

---

## Want to make this better?
Ideas for improvement:
* Make a **Web application** to automatically scan a repository, XRAY it, and provide a Web app with
parametric image generation. Since this tools is using the Canvas (Context2D) API, the renderer
can be easily executed by the browser.
* Fuse the two command line tools for quicker access, but also leave them separate for backend vs
frontend usage.
* Separate **Languages as layers**, so each language has a color, and when overlapping all
the layers the picture is complete. This goes really well with the XRAY metaphor.
* Add a language representation/coloring for the local file matter of inner-nodes with children,
aka: show the 'leftover blocks' that look like missing pieces in the squares.
* Open a new [Issue](issues/) and let me know about your ideas
* Send a pull request and enjoy it when it gets merged

### Other tools
If you're a source-code-visualization aficionado, check out
[Gource](https://github.com/acaudwell/Gource) that adds the time axis and creates movies that can
tell who-did-what as well as see where the activity was concentrated and see the final tree-like
structure of the code.

Also, make sure to check out [cloc](https://github.com/AlDanial/cloc) which is the command-line
tool that this project uses to perform the per-file source code analysis.

For the old timers, do you remember [SLOCCount](https://dwheeler.com/sloccount/)?

### Found this useful?
Me too, please open an issue, say Hi, and attach the picture of your repo.
