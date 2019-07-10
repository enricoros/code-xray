import React from 'react';
import {hydrate, render} from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import ThemeProvider from '@material-ui/styles/ThemeProvider';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import {red} from '@material-ui/core/colors';
import * as GA from 'react-ga';
import App from './App';

// customize the colors by using a theme
const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#01579B',
    },
    secondary: {
      main: '#440154',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#f0f0f0',
    },
  },
});

function Root() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <App/>
    </ThemeProvider>
  )
}

// use react-snap for pre-render static routes
const rootElement = document.getElementById("root");
if (rootElement.hasChildNodes()) {
  hydrate(<Root/>, rootElement);
} else {
  render(<Root/>, rootElement);
}

// Google Analytics, with the ID compiled in during build
if (process.env.REACT_APP_GA_ID !== undefined) {
  GA.initialize(process.env.REACT_APP_GA_ID);
  GA.pageview(window.location.pathname + window.location.search);
}
