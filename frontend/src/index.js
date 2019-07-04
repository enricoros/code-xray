import React from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import {ThemeProvider} from '@material-ui/styles';
import {createMuiTheme} from '@material-ui/core/styles';
import {red} from '@material-ui/core/colors';
import App from './App';

// customize the colors by using a theme
const theme = createMuiTheme({
  palette: {
    _primary: {
      main: '#556cd6',
    },
    _secondary: {
      main: '#19857b',
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
