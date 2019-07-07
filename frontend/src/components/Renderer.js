import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import FormLabel from "@material-ui/core/FormLabel";
import Grid from "@material-ui/core/Grid";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import TextField from "@material-ui/core/TextField";
import * as d3h from "d3-hierarchy";
import * as d3s from "d3-scale";
import * as d3sc from "d3-scale-chromatic";
import {updateTreeStatsRecursively} from "../analysis";


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
  ctx.shadowOffsetX = ctx.shadowOffsetY = shadowPx ? ~~(shadowPx / 4) : 0;
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

const leafColorCache = {};

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
  const gray_below = hide_below;
  const shrink_on = gray_below;
  const hide_labels_above = options['hide_labels_above'] || 6;
  const thin_labels_above = options['thin_labels_above'] || ~~(hide_labels_above / 2);

  // derived constants
  const paddingLabel = ~~(height / 35);
  const paddingBorder = ~~(paddingLabel / 2);
  const fontPx = ~~(0.9 * paddingLabel);
  const boxShadowPx = ~~(paddingBorder / 2);
  const fontShadowPx = ~~(fontPx / 3);
  const shrinkInnerPadding = ~~(paddingBorder / 2);

  // graphical & drawing & color functions
  const depthLevels = Math.max(1, projectTree.invDepth + projectTree.depth);
  let fColorIdx = 0, fColorIdx2 = 0.2;
  const fColor = d3s.scaleOrdinal(d3sc.schemeCategory10);
  const fColor2I = () => d3sc.interpolateYlGnBu(fColorIdx2 += 0.02);
  const colorForNode = (isLeaf, nDepth, dirName) => {
    if (isLeaf) {
      // ctx.fillStyle = fColorI();
      // ctx.fillStyle = 'rgba(255,255,255,0.1)';
      // ctx.fillStyle = d3sc.interpolatePlasma(dh.data.depth / depthLevels);
      // return fColor(++fColorIdx);
      if (leafColorCache.hasOwnProperty(dirName))
        return leafColorCache[dirName];
      return leafColorCache[dirName] = d3sc.interpolateWarm(Math.random()); //  fColor(++fColorIdx);
    } else {
      // ctx.fillStyle = fColor2I();
      // return d3sc.interpolateYlGnBu(0.1 + nDepth + (Math.random() - Math.random()) / 28);
      // return fColor2I();
      return d3sc.interpolateYlGnBu(nDepth);
    }
  };

  // erase canvas - equivalent to 'copy' compositing op, with black transparent
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  // use d3 to layout the TreeMap
  const dataHierarchy = d3h.hierarchy(projectTree);
  const treeMap = d3h.treemap()
    .tile(d3h.treemapSquarify)
    .size([width, height])
    .paddingOuter(paddingBorder)
    .paddingTop(paddingLabel)
    (dataHierarchy);

  const rects = [];
  treeMap.each(dh => {
    const isLeaf = dh.data.invDepth === 0;
    const depth = dh.data.depth;
    const shrinkBox = depth <= shrink_on;
    const forceFill = depth < gray_below ? 'gray' : undefined;
    const thinLabel = depth > thin_labels_above;

    // skip drawing for too shallow (-1, 0) or too deep
    if (depth < hide_below || depth > hide_above) return;

    // shrink project nodes
    if (shrinkBox) {
      dh.x0 += shrinkInnerPadding;
      dh.x1 -= shrinkInnerPadding;
      dh.y1 -= shrinkInnerPadding;
    }

    // stroke: not if leaf (note: half will be painted by the 'fillRect' call)
    if (options.lines && !isLeaf && !shrinkBox) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
    }

    // fill box
    if (options.boxes) {
      ctx.fillStyle = colorForNode(isLeaf, dh.data.depth / depthLevels, dh.data.name);
      options.box_shadows && isLeaf && setShadow(ctx, 'rgba(0,0,0,0.5)', boxShadowPx);
      if (forceFill)
        ctx.fillStyle = forceFill;
      ctx.fillRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
      options.box_shadows && removeShadow(ctx);
    }

    // add the rectangle, for click checking
    rects.push({dirNode: dh.data, l: ~~dh.x0, t: ~~dh.y0, r: ~~dh.x1, b: ~~dh.y1,});

    // skip labels when going too deep
    if (depth > hide_labels_above) return;

    if (options.labels) {
      if (depth <= hide_labels_above) {
        let label = dh.data.name;
        if (options.lab_kpi)
          label += thinLabel ? '' : ' (' + dh.data.value + ')';
        // label += dh.data.depth + ' (' + dh.data.invDepth + ')';
        options.lab_shadows && setShadow(ctx, 'white', fontShadowPx);
        ctx.font = fontPx + "px sans-serif";
        ctx.textAlign = "center";
        // ctx.fillStyle = dh.children ? 'white' : 'white';
        ctx.fillStyle = 'black';
        ctx.fillText(label, ~~((dh.x0 + dh.x1) / 2), ~~(dh.y0 + fontPx * 0.90));
        options.lab_shadows && removeShadow(ctx);
      }
    }
  });

  // return the rendering result, for click purposes
  return rects.reverse();
}

/**
 * ...
 */
export default function Renderer(props) {
  const {projectTree, onClicked} = props;
  const classes = useStyles();

  const [valueKpi, setValueKpi] = React.useState('code');
  const [width, setWidth] = React.useState(2000);
  const [height, setHeight] = React.useState(1000);
  const [features, setFeatures] = React.useState({
    labels: true,
    lab_kpi: false,
    lab_shadows: false,
    boxes: true,
    box_shadows: true,
    lines: true,
  });
  let lastRenderedRects = [];

  // render canvas at geometry changes
  React.useEffect(() => {
    const canvas = document.getElementById('output-canvas');
    lastRenderedRects = renderOnCanvas(projectTree, canvas, features);
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

  const handleCanvasClick = event => {
    const canvas = document.getElementById('output-canvas');
    const rect = canvas.getBoundingClientRect();
    // get the coordinates in the rectangles space (since the canvas is generally larger than the screen size)
    const rx = (event.clientX - rect.left) * canvas.width / canvas.offsetWidth;
    const ry = (event.clientY - rect.top) * canvas.height / canvas.offsetHeight;
    // stop at the first rectangle - the array was already reversed
    const r = lastRenderedRects.find(r => r.l <= rx && r.r >= rx && r.t <= ry && r.b >= ry);
    if (r)
      onClicked(r.dirNode);
  };

  // update the depth values on the final tree
  updateTreeStatsRecursively(projectTree, projectTree.is_multi_project ? -1 : 0, valueKpi);

  const cWidth = Math.max(width, 96);
  const cHeight = Math.max(height, 96);

  return (
    <React.Fragment>

      {/* The one and only Canvas - not-allowed was another great cursor choice */}
      <canvas id="output-canvas" width={cWidth} height={cHeight} style={{cursor: 'crosshair'}}
              onClick={handleCanvasClick} className={classes.renderCanvas}/>

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
            <Checkbox checked={features['labels']} color="primary" onChange={changeFeature('labels')}/>}/>
          <FormControlLabel label="Size" disabled={!features['labels']} control={
            <Checkbox checked={features['lab_kpi']} onChange={changeFeature('lab_kpi')}/>}/>
          <FormControlLabel label="Shadows" disabled={!features['labels']} control={
            <Checkbox checked={features['lab_shadows']} onChange={changeFeature('lab_shadows')}/>}/>
          <FormControlLabel label="Boxes" control={
            <Checkbox checked={features['boxes']} color="primary" onChange={changeFeature('boxes')}/>}/>
          <FormControlLabel label="Shadows" disabled={!features['boxes']} control={
            <Checkbox checked={features['box_shadows']} onChange={changeFeature('box_shadows')}/>}/>
          <FormControlLabel label="Lines" control={
            <Checkbox checked={features['lines']} color="primary" onChange={changeFeature('lines')}/>}/>
        </Grid>
      </Grid>

    </React.Fragment>
  );
}
