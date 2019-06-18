import React from 'react';
import Button from '@material-ui/core/Button';
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles(theme => ({
  button: {
    margin: theme.spacing(1),
  },
  input: {
    display: 'visible',
  },
}));

function UploadXray(a,b) {
  const classes = useStyles();
  return (
    <div>
      <input accept="image/*" className={classes.input} id="contained-button-file" multiple type="file"/>
      <label htmlFor="contained-button-file">
        <Button variant="contained" component="span" className={classes.button}>
          Upload
        </Button>
      </label>
    </div>
  );
}

export default UploadXray;
