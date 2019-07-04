import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import Button from '@material-ui/core/Button';
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import Container from "@material-ui/core/Container";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Switch from "@material-ui/core/Switch";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ReactJson from "react-json-view";
import './App.css';
import {
  collapseDegenerateDirectories,
  descendingByKey,
  makeDirNode,
  makeProjectDirNodeTree,
  reduceCodeStatListByName
} from "./analysis";
import LanguagesChips from "./components/LanguagesChips";
import ProjectLoader from "./components/ProjectLoader";
import Renderer from "./components/Renderer";
import SignIn from "./components/SignIn";

// localstorage persisted state
// import createPersistedState from 'use-persisted-state';
// const usePersistedUserState = createPersistedState('user_name_2');

// settings-
const DEFAULT_GUEST_NAME = 'Guest';
const DEFAULT_PROJECT_NAME = 'Composite Project';

// App styled looks
const useStyles = makeStyles(theme => ({
  appBar: {
    position: 'relative',
  },
  toolbar: {
    flexWrap: 'wrap',
  },
  toolbarTitle: {
    flexGrow: 1,
  },
  link: {
    margin: theme.spacing(1, 1.5),
  },
  heroContent: {
    padding: theme.spacing(8, 0, 2),
  },
  sectionClass: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(3),
  },
  footer: {
    borderTop: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(8),
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
  },
}));

function Hero(props) {
  return <Container maxWidth="md" component="main" className={props.heroClass}>
    <Typography variant="h2" component="h1" align="center" color="textPrimary" gutterBottom>
      {props.title}
    </Typography>
    <Typography variant="h5" align="center" color="textSecondary" component="p">
      {props.description}
    </Typography>
  </Container>
}


function Section(props) {
  return <Container maxWidth="lg" component="main" className={props.className}>
    {props.title && <Typography variant="h5" component="h2" gutterBottom>
      {props.title}
    </Typography>}
    {props.children}
  </Container>
}

/**
 * The objective of this class is to create a single project out of multiple ones (if multiple are supplied)
 * and to perform all project-dependent computation, so that it won't need to be redone every time the state
 * changes in the children.
 */
function MultiProjectFilterClosure(props) {
  const {projects} = props;

  // const mpnFileStatList = NOTE: there's no meaning to fuse the file list now
  const mpnLangStatList = reduceCodeStatListByName(projects.map(p => p.unfiltered.langStatList).flat())
    .sort(descendingByKey('code'));

  return <MultiProjectFilter langStatList={mpnLangStatList} projects={projects}/>;
}


function MultiProjectFilter(props) {
  const {langStatList, projects} = props;
  const classes = useStyles();

  // state from this
  const [noLanguages, setNoLanguages] = React.useState([]);
  const [noFolderPrefix, setNoFolderPrefix] = React.useState([]);
  const [semCollapse, setSemCollapse] = React.useState(false);

  return (
    <React.Fragment>

      {/* Show Analysis on loaded content */}
      {/*<Section title="Analysis" className={classes.sectionClass}>*/}
      {/*  {(projects.length > 1) && <Typography>For {projects.length} projects</Typography>}*/}
      {/* .... */}
      {/*</Section>*/}

      {/* Section 3 filter */}
      <Section title="Filtering" className={classes.sectionClass}>
        {/* Remove Files by Language */}
        <ExpansionPanel defaultExpanded={true}>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>} href="">
            <Typography>
              Programming Languages. Raise the signal, drop the noise.
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <LanguagesChips langStatList={langStatList} noLanguages={noLanguages} onChange={setNoLanguages}/>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        {/* Remove Files by Folder */}
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>} href="">
            <Typography>
              Remove entire folders from the analysis.
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Typography>
              Not yet implemented.
            </Typography>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </Section>

      {/* Section 4 semantics */}
      <Section title="Semantics" className={classes.sectionClass}>
        {/* Loss-less transformations */}
        <ExpansionPanel defaultExpanded={true}>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>} href="">
            <Typography>
              Loss-less transformations
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <FormControlLabel label="Collapse degenerate folder structures" control={
              <Switch checked={semCollapse} onChange={(e, state) => setSemCollapse(state)} color="primary"/>}/>
            {/*<Typography>TODO: ADDD cap folders here</Typography>*/}
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </Section>

      {/* Section 5 render */}
      <React.Fragment>
        <Section title="Rendering" className={classes.sectionClass}>
          <Card>
            <CardContent>
              <RenderingClosure noLanguages={noLanguages} noFolderPrefix={noFolderPrefix}
                                collapseDegenerate={semCollapse} projects={projects}/>
            </CardContent>
          </Card>
        </Section>
      </React.Fragment>

    </React.Fragment>
  )
}


function RenderingClosure(props) {
  const {noLanguages, noFolderPrefix, collapseDegenerate, projects} = props;

  // multi project tree
  let fusedTree = makeDirNode(DEFAULT_PROJECT_NAME);
  fusedTree.is_multi_project = true; // FIXME: HACK

  // create per-project trees, executing cleanups
  projects.forEach(p => {
    // lossy cleanup 1: remove entire folders from the export (for example if you didn't care about /scripts/..)
    // lossy cleanup 2: remove files written in unwanted languages, to improve the SNR
    const filteredFileStatList = p.unfiltered.fileStatList.filter(fs => {
      const hasFolderPrefix = noFolderPrefix.find(folder => fs.dir.startsWith(folder));
      const hasLanguage = noLanguages.find(languageName => fs.codeStatList.map(cs => cs.name).includes(languageName));
      return !hasFolderPrefix && !hasLanguage;
    });

    // make the project tree
    const filteredDirStatTree = makeProjectDirNodeTree(filteredFileStatList, p.name);

    // loss-less cleanup 3: collapse degenerate a-b-c- .. directories into single 'a/b/c/' nodes
    if (collapseDegenerate)
      collapseDegenerateDirectories(filteredDirStatTree);

    // if single project, let this tree be the root, otherwise append to children
    if (projects.length === 1)
      fusedTree = filteredDirStatTree;
    else
      fusedTree.children.push(filteredDirStatTree);
  });

  return <Renderer projectTree={fusedTree}/>
}


function App() {
  const classes = useStyles();
  const [experiment, setExperiment] = React.useState(false);
  const [userName, setUserName] = React.useState(DEFAULT_GUEST_NAME);
  const [projects, setProjects] = React.useState([]);
  const hasProjects = projects.length > 0;
  const multiProject = projects.length > 1;

  function addProject(project) {
    setProjects((projects) => projects.concat(project));
  }

  function removeProject(index) {
    const remaining = [].concat(projects);
    remaining.splice(index, 1);
    setProjects(remaining);
  }

  // ask for user name if not set
  if (!userName) return <SignIn onChange={setUserName}/>;

  return (
    <React.Fragment>

      {/* Top-level Navigation Bar */}
      <AppBar position="static" color="default" className={classes.appBar}>
        <Container maxWidth="lg">
          <Toolbar className={classes.toolbar}>
            <Typography variant="h4" color="inherit" noWrap className={classes.toolbarTitle}>
              Source Exploder
            </Typography>
            <FormControlLabel control={
              <Switch checked={experiment} onChange={(e, state) => setExperiment(state)} color="primary"/>
            } label="Experiments"/>
            <Link variant="button" color="textPrimary" href="" className={classes.link} component="a">{userName}</Link>
            <Button href="#" color="primary" variant="outlined" className={classes.link}
                    onClick={() => setUserName(undefined)}>Logout</Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Experiments box */}
      {experiment && <Container maxWidth="lg">
        <Typography>Experiments are On</Typography>
      </Container>}

      {/* Welcome Message */}
      <Hero heroClass={classes.heroContent} title="Code XRay"
            description="Understand a project based on source code analysis and visualization."/>

      {/* Projects holder and loader*/}
      <Section title={multiProject ? "Composite Project" : (hasProjects ? "Active Project" : undefined)}
               className={classes.sectionClass}>
        <Grid container spacing={2} alignItems="center">
          {projects.map((project, idx) =>
            <Grid item xs={12} sm={6} md={4} key={"project-" + idx}>
              <Card raised>
                <CardContent>
                  <Typography variant="h6" component="h4">{project.name}</Typography>
                  <Typography>
                    {project.unfiltered.fileStatList.length} files, {project.unfiltered.langStatList.length} languages
                  </Typography>
                  <Typography>
                    {project.unfiltered.codeStatSum.code} lines of code
                  </Typography>
                  {experiment && <React.Fragment>
                    <Box>- Lang = LOCs, files - density</Box>
                    {project.unfiltered.langStatList.map((stat, idx) =>
                      <Box key={"lang-" + idx}> - {stat.name} = {stat.code}, {stat.files} - {~~(stat.code / stat.files)}
                      </Box>)}
                  </React.Fragment>}
                </CardContent>
                <CardActions>
                  <Button color="primary" onClick={() => removeProject(idx)} href="#">Close Project</Button>
                </CardActions>
              </Card>
            </Grid>)}
          <ProjectLoader hasProjects={hasProjects} onProjectLoaded={addProject}/>
        </Grid>
      </Section>

      {/* Projects */}
      {hasProjects && <MultiProjectFilterClosure projects={projects}/>}

      {/* Debugging */}
      {hasProjects && <Section title="Debug" className={classes.sectionClass}>
        <ReactJson src={projects} collapsed/>
      </Section>}

      {/* Footer */}
      {/*<Container maxWidth="md" component="footer" className={classes.footer}>*/}
      {/*  <Grid container spacing={4} justify="space-evenly"/>*/}
      {/*</Container>*/}
    </React.Fragment>
  );
}

export default App;
