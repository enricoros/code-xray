import React from "react";
import {makeStyles} from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import Fab from "@material-ui/core/Fab";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import InputLabel from "@material-ui/core/InputLabel";
import Link from "@material-ui/core/Link";
import Paper from "@material-ui/core/Paper";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Typography from "@material-ui/core/Typography";
import CloudUpload from '@material-ui/icons/CloudUpload';
import Code from '@material-ui/icons/Code';
import LibraryAdd from '@material-ui/icons/LibraryAdd';
import {useDropzone} from "react-dropzone";
import {clocJsonToFileStatList, makeProject, TESTING} from "./analysis";

// Configuration: only the Examples metadata
const EXAMPLES = [
  {
    href: 'examples/cloc.libra.502936fb.json',
    name: 'Libra',
    rev: '502936fb',
    upstream: 'https://github.com/libra/libra',
    presets: {
      noFolderPrefix: ['Libra/terraform']
    }
  },
  {
    href: 'examples/cloc.linux.e9a83bd2.json',
    name: 'Linux Kernel',
    rev: 'e9a83bd2',
    upstream: 'https://github.com/torvalds/linux',
  },
  {
    href: 'examples/cloc.microsoft_onnxruntime.df68111b.json',
    name: 'ONNX Runtime',
    rev: 'df68111b',
    upstream: 'https://github.com/microsoft/onnxruntime',
  },
  {
    href: 'examples/cloc.paddlepaddle_anakin.6c434060.json',
    name: 'PaddlePaddle Anakin',
    rev: '6c434060',
    upstream: 'https://github.com/PaddlePaddle/Anakin',
  },
  {
    href: 'examples/cloc.pytorch_glow.5b0ed03b.json',
    name: 'PyTorch Glow',
    rev: '5b0ed03b',
    upstream: 'https://github.com/pytorch/glow',
  },
];
// default project name for when a file is dropped (so doesn't have a name)
export const UNNAMED_PROJECT = 'Unnamed Project';


// just code below
const useSourceSelectorStyles = makeStyles(theme => ({
  codeBlock: {
    padding: theme.spacing(2),
    margin: 0,
    color: 'white',
    background: '#263238',
  },
  dropZone: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    borderWidth: '2px',
    borderRadius: '2px',
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out',
  },
  errorCard: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.error.contrastText,
  },
  exampleCard: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.dark,
    textAlign: 'center',
    padding: theme.spacing(2, 3, 1),
  },
}));

function TabContainer(props) {
  return <Typography component="div" style={{padding: 8 * 3}}>{props.children}</Typography>
}

function ClocLink(props) {
  return <Link component="a" href="https://github.com/AlDanial/cloc">{props.name || 'cloc'}</Link>
}

/**
 * @param props onDataLoaded(validClocJson) =>
 */
function ProjectLoader(props) {
  const classes = useSourceSelectorStyles();
  const {hasProjects, autoLoadExample, onProjectLoaded} = props;
  const [expandNext, setExpandNext] = React.useState(false);
  const [tabIdx, setTabIdx] = React.useState(TESTING ? 1 : 0);
  const [errorString, setErrorString] = React.useState('');

  // using the "react-dropzone" module, which mimics hooks. upon a drop, load the file
  const {getRootProps: dzProps, getInputProps: dzInputProps, isDragActive} = useDropzone(
    {
      accept: "application/json",
      onDropRejected: files => setErrorString('File ' + files[0].name + ' does not seem a JSON (' + (files[0].type || 'consider having a .json extension') + ')'),
      onDropAccepted: files => files.forEach(file => {
        loadJsonFromUpload(file, (maybeJson) => {
          let guessedProject = file.name;
          if (guessedProject.indexOf('.') !== -1)
            guessedProject = guessedProject.split('.').slice(0, -1).join('.');
          loadClocJson(guessedProject ? guessedProject : UNNAMED_PROJECT, maybeJson, file.name)
        })
      }),
    });

  // load one of the examples from the same web server (static examples)
  function loadExampleByIndex(index) {
    const example = EXAMPLES[index];
    // TODO: use the presets in the example, and apply those in the UI
    loadJsonFromHttpGet(example.href, (maybeJson) => loadClocJson(example.name, maybeJson, example.href));
  }

  function loadClocJson(projectName, clocJson, sourceLocation) {
    if (clocJson === null) {
      setErrorString('Error loading JSON example from: ' + sourceLocation);
      return;
    }
    if (typeof clocJson === "string") {
      try {
        clocJson = JSON.parse(clocJson);
      } catch (e) {
        setErrorString('Invalid JSON file, cannot decode it. Details: ' + e);
        console.log(clocJson);
        return;
      }
    }
    if (!clocJson.hasOwnProperty('SUM') || !clocJson.hasOwnProperty('header')) {
      setErrorString('Invalid cloc file. We expect a JSON with at least a "header" property.');
      return;
    }
    try {
      const projectFiles = clocJsonToFileStatList(clocJson);
      const bareProject = makeProject(projectName, projectFiles);
      setExpandNext(false);
      onProjectLoaded(bareProject);
    } catch (e) {
      setErrorString('Invalid Cloc file. Details: ' + e);
    }
  }

  function loadJsonFromUpload(file, callback) {
    setErrorString();
    const fileReader = new FileReader();
    fileReader.onerror = () => setErrorString('Error loading the uploaded file: ' + fileReader.error);
    fileReader.onload = () => callback(fileReader.result);
    fileReader.readAsText(file);
  }

  function loadJsonFromHttpGet(href, callback) {
    setErrorString();
    const request = new XMLHttpRequest();
    request.open('GET', href, true);
    request.responseType = 'json';
    request.onerror = () => setErrorString('Error loading the example file from: ' + href);
    request.onload = () => callback(request.response);
    request.send();
  }

  React.useEffect(() => {
    if (typeof autoLoadExample === "number" && autoLoadExample >= 0 && autoLoadExample < EXAMPLES.length) {
      // setTimeout(() => loadExampleByIndex(autoLoadExample), 5000);
    }
  });

  // if autoload is requested, perform it and don't render anything
  if (typeof autoLoadExample === "number" && autoLoadExample >= 0 && autoLoadExample < EXAMPLES.length) {
    console.log("Auto Loading example " + autoLoadExample);
    // setTimeout(() => loadExampleByIndex(autoLoadExample), 100);
    return <Typography>Loading example {autoLoadExample}...</Typography>;
  }

  // derived logic: collapse if there are other projects int the parent and we didn't expand this
  const showCollapsed = hasProjects && !expandNext;

  // if collapsed, show a button to bring it back on
  if (showCollapsed) return (
    <Grid item md={2}>
      <Fab variant="extended" size="small" aria-label="Add" onClick={() => setExpandNext(true)} href="">
        <LibraryAdd color="primary" elevation={1}/>&nbsp;Add Project
      </Fab>
    </Grid>
  );

  // render the expanded version
  return (
    <Grid item xs={12}>
      {/* Selector Tab (idx: state) */}
      <AppBar color="default" position="static" elevation={1}>
        <Tabs centered value={tabIdx} onChange={(e, newValue) => setTabIdx(newValue)} component="div">
          <Tab href="" label="Load cloc file"/>
          <Tab href="" label="Examples"/>
          <Tab href="" label="From Github (n/a yet)" disabled/>
        </Tabs>
      </AppBar>

      {/* Panel container: only 1 panel visible at a time */}
      <Paper square elevation={2}>
        {/* Errors: visible on any tab, on top */}
        {errorString &&
        <Card className={classes.errorCard} square elevation={0}>
          <CardContent>
            <Typography>
              <Typography variant="button">Error:</Typography> {errorString}
            </Typography>
          </CardContent>
        </Card>}

        {/* First tab: Drop Target & Code block */}
        {tabIdx === 0 &&
        <TabContainer>
          <Grid container spacing={2}>
            {/* drop target and load button */}
            <Grid item sm={12} md={6}>
              Load a JSON file generated with <ClocLink/>
              <div {...dzProps({className: classes.dropZone})}>
                <input {...dzInputProps()} id="drop-area-file"/>
                {isDragActive ?
                  <p>Drop the cloc file here ...</p> :
                  <p>Drag 'n' drop a cloc JSON file here, or click to select</p>}
                <InputLabel htmlFor="drop-area-file">
                  <IconButton color="primary" component="span" href=""><CloudUpload/></IconButton>
                </InputLabel>
              </div>
            </Grid>
            {/* instructions */}
            <Grid item sm={12} md={6}>Instructions to get a <ClocLink/> file
              <pre className={classes.codeBlock}>{
                `cd /where/your/repo/is
cloc --by-file --json --out=cloc.json ./`}</pre>
            </Grid>
          </Grid>
        </TabContainer>}

        {/* Tab 2: Examples */}
        {tabIdx === 1 &&
        <TabContainer>
          <Grid container spacing={2}>
            {EXAMPLES.map((e, idx) =>
              <Grid item sm={6} md={4} lg={3} key={'example-' + idx}>
                <Card raised>
                  <CardActionArea href="#" className={classes.exampleCard} onClick={() => loadExampleByIndex(idx)}>
                    <Typography variant="h6" component="h4">
                      {e.name}
                    </Typography>
                    <Typography>
                      @{e.rev}
                    </Typography>
                  </CardActionArea>
                  <CardActions>
                    <Button color="primary" href="#" onClick={() => loadExampleByIndex(idx)}>Load Example</Button>
                    <Button href={e.upstream} target="_blank">Project <Code/></Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabContainer>}

        {/* Tab 3: Github */}
        {tabIdx === 2 &&
        <TabContainer>
          Importing from Github is not supported yet.
        </TabContainer>}
      </Paper>

      {/* nothing below */}
    </Grid>
  )
}

export default ProjectLoader;
