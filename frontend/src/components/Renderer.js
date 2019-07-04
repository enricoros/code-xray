import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import {DEBUGGING} from "../config";
import {updateTreeStatsRecursively} from "../analysis";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import TextField from "@material-ui/core/TextField";
import FormLabel from "@material-ui/core/FormLabel";
import {FormGroup} from "@material-ui/core";
import Grid from "@material-ui/core/Grid";

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  textField: {
    marginRight: theme.spacing(2),
    width: 120,
  },
  descLabel: {
    padding: theme.spacing(2, 0),
    marginRight: theme.spacing(2),
  },
  renderCanvas: {
    backgroundColor: DEBUGGING ? 'red' : 'transparent',
    width: '100%',
    height: '100%',
  },
}));


function renderOnCanvas(projectTree, canvas) {
  const width = canvas.width;
  const height = canvas.height;

}

/**
 * ...
 */
export default function Renderer(props) {
  const {projectTree} = props;
  const classes = useStyles();

  const [valueKpi, setValueKpi] = React.useState('code');
  const [width, setWidth] = React.useState(2000);
  const [height, setHeight] = React.useState(1000);
  const cWidth = Math.max(width, 96);
  const cHeight = Math.max(height, 96);

  // render canvas at geometry changes
  React.useEffect(() => {
    const canvas = document.getElementById('output-canvas');
    renderOnCanvas(projectTree, canvas);
  });

  // update the depth values on the final tree
  updateTreeStatsRecursively(projectTree, projectTree.is_multi_project ? -1 : 0, valueKpi);


  return (
    <React.Fragment>

      {/* Render Config */}
      <Grid container>
        {/* Sizing KPI */}
        <Grid item xs={12} sm={4} md={2}>
          <FormLabel component="div" className={classes.descLabel}>Size according to</FormLabel>
        </Grid>
        <Grid item xs={12} sm={8} md={10}>
          <RadioGroup aria-label="value-kpi" name="value-kpi" row value={valueKpi}
                      onChange={(e, value) => setValueKpi(value)}>
            <FormControlLabel value="code" control={<Radio color="primary"/>} label="Lines of code"/>
            <FormControlLabel value="comment" control={<Radio color="primary"/>} label="Comments"/>
            <FormControlLabel value="blank" control={<Radio color="primary"/>} label="Blanks"/>
            <FormControlLabel value="files" control={<Radio color="primary"/>} label="Files count"/>
          </RadioGroup>
        </Grid>

        {/* Resolution */}
        <Grid item xs={12} sm={4} md={2}>
          <FormLabel component="div" className={classes.descLabel}>Image Resolution</FormLabel>
        </Grid>
        <Grid item xs={12} sm={8} md={10}>
          <FormGroup row>
            <TextField label="Width" type="number" value={width} className={classes.textField}
                       onChange={e => setWidth(~~Math.max(96, Math.min(8192, parseInt(e.target.value))))}/>
            <TextField label="Height" type="number" value={height} className={classes.textField}
                       onChange={e => setHeight(~~(Math.max(96, Math.min(4096, parseInt(e.target.value)))))}/>
          </FormGroup>
        </Grid>
      </Grid>

      {/* Misc */}
      <Typography>
        Rendering content goes here. Outer size: {projectTree.value}
      </Typography>

      {/* The one and only Canvas */}
      <canvas id="output-canvas" width={cWidth} height={cHeight} className={classes.renderCanvas}/>

    </React.Fragment>
  );
}
