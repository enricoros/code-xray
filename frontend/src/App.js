import React from 'react';
import './App.css';
import Button from '@material-ui/core/Button';
import Typography from "@material-ui/core/Typography";


function App() {
  return (
    <div className="App">
      <Typography variant="h1">
        h1. test
      </Typography>
      <Typography variant="h2">
        h2. test
      </Typography>
      <Typography variant="h3">
        h3. test
      </Typography>
      <h1>test</h1>
      <h2>test</h2>
      <h3>test</h3>
      <header className="App-header">
        Hi. <Button variant="contained" color="primary">Hello World</Button>
      </header>
    </div>
  );
}

export default App;
