import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';

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
 * @param props initialName='', onChange=f
 */
export default function SignIn(props) {
  const classes = useStyles();
  const {initialName, onChange} = props;
  const [userName, setUserName] = React.useState(initialName || '');
  return (
    <Container component="main" maxWidth="xs">
      <div className={classes.paper}>
        <Avatar className={classes.avatar} component="div"><LockOutlinedIcon/></Avatar>
        <Typography component="h1" variant="h5">What's your name?</Typography>
        <form className={classes.form} noValidate>
          <TextField fullWidth required variant="outlined" margin="normal" label="Your Name" autoFocus
                     value={userName} onChange={(event) => setUserName(event.target.value)}/>
          <Button type="submit" fullWidth variant="contained" color="primary" className={classes.submit} href=""
                  onClick={(e) => {
                    e.preventDefault();
                    if (userName.length > 1) onChange(userName);
                  }}>
            {userName ? 'Hello, ' + userName : 'Sign In'}
          </Button>
        </form>
      </div>
    </Container>
  );
}
