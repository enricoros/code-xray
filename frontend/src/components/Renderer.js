import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {updateTreeStatsRecursively} from "../analysis";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import TextField from "@material-ui/core/TextField";
import FormLabel from "@material-ui/core/FormLabel";
import {FormGroup} from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";

const d3h = require("d3-hierarchy");

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
    width: '100%',
    height: '100%',
  },
}));

function setShadow(ctx, color, shadowPx) {
  ctx.shadowColor = color ? color : '#0000';
  ctx.shadowBlur = shadowPx ? shadowPx : 0;
  ctx.shadowOffsetX = ctx.shadowOffsetY = shadowPx ? ~~(shadowPx / 2) : 0;
}

function removeShadow(ctx) {
  setShadow(ctx);
}

function pickBestWH(w, h) {
  let height = h || 2000,
    width = w;
  if (width && !h)
    height = (~~(width * 9 / 16));
  if (height && !width)
    width = (~~(height * 16 / 9));
  return {width, height};
}

function renderOnCanvas(projectTree, canvas, options) {
  Object.assign(options, {
    width: canvas.width,
    height: canvas.height,
    hide_below: 0,
    hide_above: 99,
    hide_labels_above: 6,
    thin_labels_above: 3,
  });

  // parametric configuration, def: h=2000, w=auto(16:9)
  const {width, height} = pickBestWH(options['width'], options['height']);
  const hide_below = options['hide_below'] || 0; // note: the multi-project container (if present) is depth -1
  const hide_above = options['hide_above'] || 99; // note: the multi-project container (if present) is depth -1
  const gray_on = hide_below;
  const shrink_on = gray_on;
  const hide_labels_above = options['hide_labels_above'] || 6;
  const thin_labels_above = options['thin_labels_above'] || ~~(hide_labels_above / 2);

  // derived constants
  const paddingLabel = ~~(height / 50);
  const paddingBorder = ~~(paddingLabel);
  const fontPx = ~~(0.9 * paddingLabel);
  const boxShadowPx = ~~(paddingBorder / 3);
  const fontShadowPx = ~~(fontPx / 3);
  const shrinkInnerPadding = ~~(paddingBorder / 2);

  // graphical & drawing & color functions
  let fColorIdx = 0, fColorIdx2 = 0.2;
  // const fColor = scaleOrdinal(schemeCategory10);
  // const fColorI = () => fColor(++fColorIdx);
  // const fColor2I = () => interpolateYlGnBu(fColorIdx2 += 0.015);

  // erase canvas - equivalent to 'copy' compositing op, with black transparent
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, width, height);

  // use d3 to layout the TreeMap
  const dataHierarchy = d3h.hierarchy(projectTree);
  const treeMap = d3h.treemap()
    .tile(d3h.treemapSquarify)
    .size([width, height])
    .paddingOuter(paddingBorder)
    .paddingTop(paddingLabel)
    (dataHierarchy);

  const ctx = context;
  treeMap.each(dh => {

    const isLeaf = !dh.children;
    const depth = dh.data.depth;
    const shrinkBox = depth <= shrink_on;
    const forceFill = depth <= gray_on ? 'gray' : undefined;
    const thinLabel = depth > thin_labels_above;

    /// if (depth < hide_below || depth > hide_above) return;

    // shrink project nodes
    if (shrinkBox) {
      dh.x0 += shrinkInnerPadding;
      dh.x1 -= shrinkInnerPadding;
      dh.y1 -= shrinkInnerPadding;
    }
    // stroke: not if leaf (note: half will be painted by the 'fillRect' call)
    // if (options.lines && !isLeaf /*&& !shrinkBox*/) {
      removeShadow(ctx);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
    // }

    if (options.boxes) {
      // fill: if leaf, strong color and no shadow
      if (isLeaf) {
        removeShadow(ctx);
        // ctx.fillStyle = fColorI();
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
      } else {
        // if inner node, more depth-based coloring and shadow
        options.shadows && setShadow(ctx, 'rgba(0,0,0,0.5)', boxShadowPx);
        // ctx.fillStyle = fColor2I();
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        // ctx.fillStyle = interpolateYlGnBu(0.1 + (dh.data.depth - 1) / 6 + (Math.random() - Math.random()) / 28);
      }
      if (forceFill)
        ctx.fillStyle = forceFill;
      ctx.fillRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
    }

    /// if (depth > hide_labels_above) return;

    if (options.labels) {
      // if (depth <= hide_labels_above) {

      const label = dh.data.name + (thinLabel ? '' : ' (' + dh.data.value + ')');

      options.shadows && setShadow(ctx, 'black', fontShadowPx);
      ctx.font = fontPx + "px sans-serif";
      ctx.textAlign = "center";
      // ctx.fillStyle = dh.children ? 'white' : 'white';
      ctx.fillStyle = 'black';
      ctx.fillText(label, ~~((dh.x0 + dh.x1) / 2), ~~(dh.y0 + fontPx * 0.85));
      // }
    }
  });

  // const depth = dh.data.depth;
  // if (depth < hide_below || depth > hide_above) return;
  // drawFolderBox(context, dh, depth <= shrink_on, depth <= gray_on ? 'gray' : undefined);
  // if (depth <= hide_labels_above)
  //   drawFolderLabel(context, dh, depth > thin_labels_above);

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
  const [features, setFeatures] = React.useState({
    labels: true,
    lines: true,
    boxes: false,
    shadows: true,
  });

  // render canvas at geometry changes
  React.useEffect(() => {
    const canvas = document.getElementById('output-canvas');
    renderOnCanvas(projectTree, canvas, features);
  });

  const changeFeature = feature => event => {
    setFeatures({...features, [feature]: event.target.checked});
  };

  const resizeCanvas = newSize => {
    setWidth(newSize[0]);
    setHeight(newSize[1]);
  };

  const resizeCanvasToScreen = (multiplier) => {
    const canvas = document.getElementById('output-canvas');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    setWidth(~~(rect.width * dpr * (multiplier || 1)));
    setHeight(~~(rect.height * dpr * (multiplier || 1)));
  };

  // update the depth values on the final tree
  updateTreeStatsRecursively(projectTree, projectTree.is_multi_project ? -1 : 0, valueKpi);

  const cWidth = Math.max(width, 96);
  const cHeight = Math.max(height, 96);

  return (
    <React.Fragment>

      {/* The one and only Canvas */}
      <canvas id="output-canvas" width={cWidth} height={cHeight} className={classes.renderCanvas}/>

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
            <Button onClick={() => resizeCanvasToScreen(1)} href="">@1x</Button>
            <Button onClick={() => resizeCanvasToScreen(2)} href="">@2x</Button>
            <Button onClick={() => resizeCanvasToScreen(4)} href="">@4x</Button>
            <Button onClick={() => resizeCanvas([4000, 2000])} href="">4000 x 2000</Button>
            <Button onClick={() => resizeCanvas([2000, 1000])} href="">2000 x 1000</Button>
            <Button onClick={() => resizeCanvas([1000, 750])} href="">800 x 600</Button>
            {(window.devicePixelRatio !== 1) &&
            <FormLabel component="div" className={classes.descLabel}> - Dpr: {window.devicePixelRatio}</FormLabel>}
          </FormGroup>
        </Grid>

        {/* Options */}
        <Grid item xs={12} sm={4} md={2}>
          <FormLabel component="div" className={classes.descLabel}>Show</FormLabel>
        </Grid>
        <Grid item xs={12} sm={8} md={10}>
          <FormControlLabel label="Labels" control={
            <Checkbox checked={features['labels']} onChange={changeFeature('labels')}/>}/>
          <FormControlLabel label="Lines" control={
            <Checkbox checked={features['lines']} onChange={changeFeature('lines')}/>}/>
          <FormControlLabel label="Boxes" control={
            <Checkbox checked={features['boxes']} onChange={changeFeature('boxes')}/>}/>
          <FormControlLabel label="Shadows" control={
            <Checkbox checked={features['shadows']} onChange={changeFeature('shadows')}/>}/>
        </Grid>
      </Grid>

    </React.Fragment>
  );
}
