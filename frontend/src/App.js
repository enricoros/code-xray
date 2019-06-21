import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AppBar from "@material-ui/core/AppBar";
import Button from '@material-ui/core/Button';
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import './App.css';
import SignIn from "./SignIn";
import ProjectLoader from "./ProjectLoader";

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
    <Typography component="h1" variant="h2" align="center" color="textPrimary" gutterBottom>
      {props.title}
    </Typography>
    <Typography variant="h5" align="center" color="textSecondary" component="p">
      {props.description}
    </Typography>
  </Container>
}


function Section(props) {
  return <Container maxWidth="lg" component="main" className={props.className}>
    {props.title && <Typography variant="h4" component="h1" gutterBottom>
      {props.title}
    </Typography>}
    {props.children}
  </Container>
}


function App() {
  const classes = useAppStyles();
  const [userName, setUserName] = React.useState(default_GuestName);
  const [projects, setProjects] = React.useState([]);
  const hasProjects = projects.length > 0;

  function addProject(project) {
    // FIXME: multiple calls to this will not extend rhe
    setProjects([].concat(projects).concat(project));
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
            <Typography variant="h4" color="inherit" noWrap className={classes.toolbarTitle}>Code XRay</Typography>
            <nav>
              <Link variant="button" color="textPrimary" href="#" className={classes.link}
                    component="a">{userName}</Link>
            </nav>
            <Button href="#" color="primary" variant="outlined" className={classes.link}
                    onClick={() => setUserName(undefined)}>Logout</Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Welcome */}
      <Hero heroClass={classes.heroContent} title="Code XRay"
            description="Quickly understand a project based on source code analysis and visualization."/>

      {/* Load Content */}
      {!hasProjects && <Section title="Analyze Source Code" className={classes.sectionClass}>
        <ProjectLoader onProjectLoaded={addProject}/>
      </Section>}

      {/* Show Analysis on loaded content */}
      {hasProjects && <Section title="Source Code Analysis" className={classes.sectionClass}>
        <Typography>
          Active projects:
        </Typography>
        <Grid container spacing={2}>
          {projects.map((project, idx) =>
            <Grid item sm={6} md={4} lg={3} key={"project-" + idx}>
              <Card raised>
                <CardContent>
                  <Typography variant="h6" component="h4">
                    {project.name}
                  </Typography>
                  <Typography>
                    {Object.keys(project.clocFiles).length} files
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button color="primary" onClick={() => removeProject(idx)} href="#">Close Project</Button>
                </CardActions>
              </Card>
            </Grid>
          )}
        </Grid>
      </Section>}

      {/*/!* Section 3 filter *!/*/}
      {/*<Section title="Filter" className={classes.sectionClass}>*/}
      {/*  dd*/}
      {/*</Section>*/}

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

      {/*<Section className={classes.sectionClass}>*/}
      {/*  Hi. <Button variant="contained" color="primary" href="#">Hello World</Button>*/}
      {/*</Section>*/}

      {/* Footer */}
      {/*<Container maxWidth="md" component="footer" className={classes.footer}>*/}
      {/*  <Grid container spacing={4} justify="space-evenly"/>*/}
      {/*</Container>*/}
    </React.Fragment>
  );
}

export default App;
