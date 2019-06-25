import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import Button from '@material-ui/core/Button';
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import Container from "@material-ui/core/Container";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Switch from "@material-ui/core/Switch";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import './App.css';
import LanguagesChips from "./components/LanguagesChips";
import ProjectLoader from "./ProjectLoader";
import SignIn from "./SignIn";
import {accumulateLangStats, sortDescByKpi} from "./analysis";
// DEBUG
import ReactJson from 'react-json-view'

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

function MultiProjectNode(props) {
  const {projects, classes} = props;

  const [noLanguages, setNoLanguages] = React.useState([]);

  // TEMP
  const [aa, setAa] = React.useState(1);
  console.log('mpn');
  console.log(aa);

  // sum all the language stats of different projects
  const allLangsStats = accumulateLangStats(projects.reduce((acc, p) => acc.concat(p.unfiltered.langsStats), []));
  allLangsStats.sort(sortDescByKpi('code'));

  // fused project
  const filteredLangStats = allLangsStats.filter(l => !noLanguages.includes(l.name));
  console.log(filteredLangStats.length);

  const bareProject = {
    name: '_never_see_this_label_',
    unfiltered: {
      // filesStats: filesStats,
      langsStats: filteredLangStats, // or allLangStats?
      // langsSumStats: langsSumStats(langsStats),
    },
  };
  // fixme FROM here

  // Apply all the computation defined by this node
  /*const allFiles = [];
  const allFilteredFiles = [];
  projects.map(project => {
    const filteredProject = {
      name: project.name,
      filesStats: project.filesStats.filter((f) => !noLanguages.includes(f.language)),
    };
    allFiles.push(...project.filesStats);
    allFilteredFiles.push(...filteredProject.filesStats);
  });
  console.log(allFiles.length + " -> " + allFilteredFiles.length);*/

  // DEBUG button only
  if (projects.length < 1) return (
    <React.Fragment>
      <Button href="" onClick={() => setAa(aa + 1)}>{"inc:" + aa}</Button>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <React.Fragment>
        <Button href="" onClick={() => setAa(aa + 1)}>{"inc:" + aa}</Button>
      </React.Fragment>

      {/* Show Analysis on loaded content */}
      {/*<Section title="Analysis" className={classes.sectionClass}>*/}
      {/*  {(projects.length > 1) && <Typography>For {projects.length} projects</Typography>}*/}
      {/*  <Typography>*/}
      {/*    Programming Languages*/}
      {/*  </Typography>*/}
      {/*  <Typography>*/}
      {/*    Statistics*/}
      {/*  </Typography>*/}
      {/*  <Typography>*/}
      {/*    depth...*/}
      {/*  </Typography>*/}
      {/*</Section>*/}

      {/* Section 3 filter */}
      <Section title="Filtering" className={classes.sectionClass}>
        <Typography>
          Raise the signal, drop the noise.
        </Typography>
        {/* Programming Languages */}
        <Card square elevation={2}>
          <CardContent>
            <LanguagesChips langsStats={allLangsStats} noLanguages={noLanguages} onChange={setNoLanguages}/>
          </CardContent>
        </Card>
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

      {/* DEBUG */}
      <Section title="Debug" className={classes.sectionClass}>
        {(projects.length > 0) && <ReactJson src={projects} collapsed/>}
      </Section>

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
  if (!userName) return <SignIn onUserChanged={setUserName}/>;

  return (
    <React.Fragment>
      {/* Navigation */}
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
        Experiments
      </Container>}

      {/* Welcome */}
      <Hero heroClass={classes.heroContent} title="Code XRay"
            description="Quickly understand a project based on source code analysis and visualization."/>

      {/* Projects holder and loader*/}
      <Section title={multiProject ? "Projects" : "Project"} className={classes.sectionClass}>
        <Grid container spacing={2} alignItems="center">
          {projects.map((project, idx) =>
            <Grid item xs={12} sm={6} md={4} key={"project-" + idx}>
              <Card raised>
                <CardContent>
                  <Typography variant="h6" component="h4">{project.name}</Typography>
                  <Typography>
                    {project.unfiltered.filesStats.length} files, {project.unfiltered.langsStats.length} languages
                  </Typography>
                  <Typography>
                    {project.unfiltered.langsSumStats.code} lines of code
                  </Typography>
                  {experiment && <Typography>
                    <Box>- Lang = LOCs, files - density</Box>
                    {project.unfiltered.langsStats.map((stat) =>
                      <Box> - {stat.name} = {stat.code} {stat.files} - {~~(stat.code / stat.files)}</Box>)}
                  </Typography>}
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
      {hasProjects && <MultiProjectNode projects={projects} classes={classes}/>}

      {/* Footer */}
      {/*<Container maxWidth="md" component="footer" className={classes.footer}>*/}
      {/*  <Grid container spacing={4} justify="space-evenly"/>*/}
      {/*</Container>*/}
    </React.Fragment>
  );
}

export default App;
