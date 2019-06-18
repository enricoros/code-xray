import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

const useStyles = makeStyles(theme => ({
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white,
    },
  },
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

/**
 * Simple sign-in screen to ask for the user name. That's it, nothing more.
 * @param props {name='', onUserChanged=f}
 */
export default function SignIn(props) {
  const classes = useStyles();
  const [userName, setUserName] = React.useState(props.name || '');
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline/>
      <div className={classes.paper}>
        <Avatar className={classes.avatar} component="div"><LockOutlinedIcon/></Avatar>
        <Typography component="h1" variant="h5">What's your name?</Typography>
        <form className={classes.form} noValidate>
          <TextField fullWidth required variant="outlined" margin="normal" label="Your Name" autoFocus
                     value={userName} onChange={(event) => setUserName(event.target.value)}/>
          <Button type="submit" fullWidth variant="contained" color="primary" className={classes.submit}
                  onClick={(e) => {
                    e.preventDefault();
                    if (userName.length > 1) props.onUserChanged(userName);
                  }}>
            {userName ? 'Hello, ' + userName : 'Sign In'}
          </Button>
        </form>
      </div>
    </Container>
  );
}
