import React from 'react';
import Button from '@material-ui/core/Button';
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import {makeStyles} from '@material-ui/core/styles';
import Link from "@material-ui/core/Link";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
// import createPersistedState from 'use-persisted-state';
import './App.css';
import SignIn from "./SignIn";

// localstorage persisted state
// const usePersistedUserState = createPersistedState('user_name_2');

// settings
const default_GuestName = 'Guest';

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
    padding: theme.spacing(8, 0, 6),
  },
}));

function SectionHeader(props) {
  return <Container maxWidth="md" component="main" className={props.heroClass}>
    <Typography component="h1" variant="h2" align="center" color="textPrimary" gutterBottom>
      {props.title}
    </Typography>
    <Typography variant="h5" align="center" color="textSecondary" component="p">
      {props.description}
    </Typography>
  </Container>;
}

function App() {
  const classes = useStyles();

  // ask for user name if not set
  const [userName, setUserName] = React.useState(default_GuestName);
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
      <SectionHeader heroClass={classes.heroContent} title="Code XRay"
                     description="Quickly understand a project based on analysis of the source code"/>
      {/* Section 1: Load file */}
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome {userName}
        </Typography>
        <header className="App-header">
          Hi. <Button variant="contained" color="primary">Hello World</Button>
        </header>
      </Container>

    </React.Fragment>
  );
}

export default App;
