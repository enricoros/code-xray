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
import './App.css';
import LanguagesChips from "./components/LanguagesChips";
import ProjectLoader from "./components/ProjectLoader";
import SignIn from "./components/SignIn";
import {descendingByKey, reduceCodeStatListByName} from "./analysis";
import ReactJson from "react-json-view";
// DEBUG

// localstorage persisted state
// import createPersistedState from 'use-persisted-state';
// const usePersistedUserState = createPersistedState('user_name_2');

// settings
const default_GuestName = 'Guest';

const useAppStyles = makeStyles(theme => ({
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
function MultiProjectNodeHolder(props) {
  const {projects, classes} = props;

  // const mpnFileStatList = NOTE: there's no meaning to fuse the file list now
  const mpnLangStatList = reduceCodeStatListByName(projects.map(p => p.unfiltered.langStatList).flat())
    .sort(descendingByKey('code'));

  return <MultiProjectNode langStatList={mpnLangStatList} projects={projects} classes={classes}/>;
}


function MultiProjectNode(props) {
  const {langStatList, projects, classes} = props;
  const [noLanguages, setNoLanguages] = React.useState([]);

  // unfiltered composite lang stats, for input to the filter

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

      {/*/!* Section 4 semantics *!/*/}
      {/*<Section title="Semantics" className={classes.sectionClass}>*/}
      {/*  bb*/}
      {/*</Section>*/}

      {/*/!* Section 5 render config *!/*/}
      {/*<Section title="Rendering" className={classes.sectionClass}>*/}
      {/*  ee*/}
      {/*</Section>*/}

      {/*/!* Section 6 render *!/*/}
      {/*<Section title="Result" className={classes.sectionClass}>*/}
      {/*  dd*/}
      {/*</Section>*/}
    </React.Fragment>
  )
}


function App() {
  console.log('app');
  const classes = useAppStyles();
  const [experiment, setExperiment] = React.useState(false);
  const [userName, setUserName] = React.useState(default_GuestName);
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
            description="Quickly understand a project based on source code analysis and visualization."/>

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
                      <Box key={"lang-" + idx}> - {stat.name} = {stat.code} {stat.files} - {~~(stat.code / stat.files)}
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
      {hasProjects && <MultiProjectNodeHolder projects={projects} classes={classes}/>}

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
