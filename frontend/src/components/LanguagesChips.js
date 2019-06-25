import React from "react";
import {makeStyles} from "@material-ui/core";
import Chip from "@material-ui/core/Chip";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from "@material-ui/core/Typography";
import BrightnessAuto from "@material-ui/icons/BrightnessAuto";
import DoneAll from "@material-ui/icons/DoneAll";

// configuration
const DEFAULT_NO_LANGUAGES = [
  'XML', 'YAML', 'Dockerfile', 'Protocol Buffers', 'HTML', 'Bourne Shell', 'Markdown', 'CMake',
  'PowerShell', 'Windows Module Definition', 'DOS Batch', 'Pascal', 'MSBuild script'
];

const useStyles = makeStyles(theme => ({
  langChip: {
    margin: theme.spacing(0.5),
  },
}));

export default props => {
  const classes = useStyles();
  const {langsStats, noLanguages, onChange} = props;

  function excludeLanguage(name) {
    onChange(noLanguages.concat(name));
  }

  function includeLanguage(name) {
    onChange(noLanguages.filter(l => l !== name));
  }

  function excludeDefaults() {
    onChange(langsStats.map(l => l.name).filter(l => DEFAULT_NO_LANGUAGES.includes(l)));
  }

  function resetExcluded() {
    onChange([]);
  }

  const activeLangs = langsStats.filter(l => !noLanguages.includes(l.name));
  const inactiveLangs = langsStats.filter(l => noLanguages.includes(l.name));

  // statistics (excluded files and code lines)
  const activeCode = activeLangs.reduce((sum, l) => sum + l.code, 0);
  const inactiveCode = inactiveLangs.reduce((sum, l) => sum + l.code, 0);
  const activeFiles = activeLangs.reduce((sum, l) => sum + l.files, 0);
  const inactiveFiles = inactiveLangs.reduce((sum, l) => sum + l.files, 0);
  const activeCodeRatio = activeCode > 0 ? 100 * (1 - inactiveCode / (activeCode + inactiveCode)) : 0;
  const activeFilesRatio = activeFiles > 0 ? 100 * (1 - inactiveFiles / (activeFiles + inactiveFiles)) : 0;
  const noExclusion = inactiveCode === 0;
  const nothingLeft = activeCode === 0;

  return (
    <Grid container spacing={2}>
      <Grid item sm={12} md={6}>
        <Typography variant="h6" component="h4" align="center">
          Active Languages - <IconButton href='' onClick={excludeDefaults}><BrightnessAuto/></IconButton>
        </Typography>
        {activeLangs.map(lang =>
          <Chip label={lang.name} onDelete={() => excludeLanguage(lang.name)}
                key={'lang-' + lang.name} className={classes.langChip}/>)}
      </Grid>
      <Grid item xs={12} md={6} style={{background: '#eee'}}>
        <Typography variant="h6" component="h4" align="center">
          Disabled languages - <IconButton href='' onClick={resetExcluded}><DoneAll/></IconButton>
        </Typography>
        {inactiveLangs.map(lang =>
          <Chip color="secondary" variant="outlined" label={lang.name} onDelete={() => includeLanguage(lang.name)}
                key={'no-lang-' + lang.name} className={classes.langChip}/>)}
      </Grid>
      <Grid item xs={12}>
        <Typography>
          {noExclusion ? 'Code: 100% (' + activeCode + ' lines of code)' : (nothingLeft ? 'Nothing left' :
            'Removing ' + inactiveCode + ' lines of code')}
          <LinearProgress variant="determinate" value={activeCodeRatio}/>
        </Typography>
        <Typography>
          {noExclusion ? 'Files: 100% (' + activeFiles + ' files)' : (nothingLeft ? 'Nothing left' :
            'Removing ' + inactiveFiles + '/' + (activeFiles + inactiveFiles) + ' files')}
          <LinearProgress variant="determinate" value={activeFilesRatio}/>
        </Typography>
      </Grid>
    </Grid>
  )
}
