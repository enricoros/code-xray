import React from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import ThemeProvider from '@material-ui/styles/ThemeProvider';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import {red} from '@material-ui/core/colors';
import * as ReactGA from 'react-ga';
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

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline/>
    <App/>
  </ThemeProvider>,
  document.querySelector('#root'),
);

// analytics
if (process.env.REACT_APP_GA_ID !== undefined) {
  ReactGA.initialize(process.env.REACT_APP_GA_ID || '');
  ReactGA.pageview(window.location.pathname + window.location.search);
}
