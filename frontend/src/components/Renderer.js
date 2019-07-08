import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import FormLabel from "@material-ui/core/FormLabel";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Popover from "@material-ui/core/Popover";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Delete from "@material-ui/icons/Delete";
import * as d3h from "d3-hierarchy";
import * as d3sc from "d3-scale-chromatic";
import {updateTreeStatsRecursively} from "../analysis";
import {TESTING} from "../config";


const useStyles = makeStyles(theme => ({
  renderCanvas: {
    width: '100%',
    height: '100%',
  },
  numberInput: {
    marginRight: theme.spacing(2),
    width: 120,
  },
  colorInput: {
    marginRight: theme.spacing(2),
    width: 160,
  },
  descLabel: {
    padding: theme.spacing(2, 0),
    marginRight: theme.spacing(2),
  },
  popActions: {
    padding: theme.spacing(1),
  },
}));


const DEFAULT_COLOR_LEAF = 'rainbow';
// const DEFAULT_COLOR_LEAF = 'viridis';
// const DEFAULT_COLOR_INNER = 'orange-depth';
const DEFAULT_COLOR_INNER = 'purple-depth';
const Colors = [
  {
    name: 'Leaf default',
    value: 'warm',
    f: d3sc.interpolateWarm,
    k: 'rand',
  },
  {
    name: 'Inner default',
    value: 'YlGnBu',
    f: d3sc.interpolateYlGnBu,
    k: 'depth',
  },
  {
    name: 'Orange (depth)',
    value: 'orange-depth',
    f: d3sc.interpolateOranges,
    k: 'depth',
  },
  {
    name: 'Purple (depth)',
    value: 'purple-depth',
    f: d3sc.interpolatePurples,
    k: 'depth',
  },
  {
    name: 'Viridis (depth)',
    value: 'viridis-depth',
    f: d3sc.interpolateViridis,
    k: 'depth',
  },
  {
    name: 'Viridis',
    value: 'viridis',
    f: d3sc.interpolateViridis,
    k: 'rand',
  },
  {
    name: 'Rainbow',
    value: 'rainbow',
    f: d3sc.interpolateRainbow,
    k: 'rand',
  },
];
let leafColorCache = {};
let innerColorCache = {};

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


function renderOnCanvas(projectTree, canvas, options, leafColor, innerColor) {
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
  const shrink_below = hide_below + 2; // FIXME: parametric 2
  const hide_labels_above = options['hide_labels_above'] || 8;
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
  // let fColorIdx2 = 0.2;
  // const fColor2I = () => d3sc.interpolateYlGnBu(fColorIdx2 += 0.02);
  const colorForNode = (isLeaf, nDepth, dirName) => {
    if (isLeaf) {
      // ctx.fillStyle = fColorI();
      // ctx.fillStyle = 'rgba(255,255,255,0.1)';
      // ctx.fillStyle = d3sc.interpolatePlasma(dh.data.depth / depthLevels);
      // return fColor(++fColorIdx);
      if (leafColorCache.hasOwnProperty(dirName))
        return leafColorCache[dirName];
      const k = leafColor.k === 'rand' ? Math.random() : leafColor.k === 'depth' ? nDepth : 0;
      return leafColorCache[dirName] = leafColor.f(k);
      // return leafColorCache[dirName] = d3sc.interpolateWarm(Math.random()); //  fColor(++fColorIdx);
    } else {
      // ctx.fillStyle = fColor2I();
      // return d3sc.interpolateYlGnBu(0.1 + nDepth + (Math.random() - Math.random()) / 28);
      // return fColor2I();
      if (innerColorCache.hasOwnProperty(dirName))
        return innerColorCache[dirName];
      const k = innerColor.k === 'rand' ? Math.random() : innerColor.k === 'depth' ? nDepth : 0;
      return innerColorCache[dirName] = innerColor.f(k);
      // return d3sc.interpolateYlGnBu(nDepth);
    }
  };

  // erase canvas - equivalent to 'copy' compositing op, with black transparent
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  // use d3 to layout the TreeMap
  const dataHierarchy = d3h.hierarchy(projectTree);
  const treeMapF = d3h.treemap()
    .tile(d3h.treemapSquarify)
    .size([width, height])
    .paddingOuter(paddingBorder)
    .paddingTop(paddingLabel);
  const treeMap = treeMapF(dataHierarchy);

  const rects = [];
  treeMap.each(dh => {
    const isLeaf = dh.data.invDepth === 0;
    const depth = dh.data.depth;
    const shrinkBox = depth < shrink_below;
    // const forceFill = depth === 0 ? '#19857b' : undefined;
    const thinLabel = depth > thin_labels_above;

    // skip drawing for too shallow (-1, 0) or too deep
    if (depth < hide_below || depth > hide_above) return;

    // shrink project nodes
    if (shrinkBox) {
      dh.x0 += shrinkInnerPadding;
      dh.x1 -= shrinkInnerPadding;
      dh.y1 -= shrinkInnerPadding;
    }

    // add the rectangle, for click checking
    rects.push({dirNode: dh.data, l: ~~dh.x0, t: ~~dh.y0, r: ~~dh.x1, b: ~~dh.y1,});

    // stroke: not if leaf (note: half will be painted by the 'fillRect' call)
    if (options.lines && !isLeaf && !shrinkBox) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
    }

    // fill box
    if (options.boxes) {
      ctx.fillStyle = colorForNode(isLeaf, dh.data.depth / depthLevels, dh.data.name);
      options.box_shadows && (isLeaf /*|| depth === 0*/) && setShadow(ctx, 'rgba(0,0,0,0.5)', boxShadowPx);
      // if (forceFill)
      //   ctx.fillStyle = forceFill;
      ctx.fillRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
      options.box_shadows && removeShadow(ctx);
    }

    // skip labels when going too deep
    if (depth > hide_labels_above) return;

    if (options.labels) {
      if (depth <= hide_labels_above) {
        // clip label inside the rectangle
        ctx.save();
        if (true) {
          ctx.beginPath();
          ctx.rect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
          ctx.clip();
        }
        let label = dh.data.name;
        if (options.lab_kpi)
          label += thinLabel ? '' : ' (' + dh.data.value.toLocaleString() + ')';
        // label += dh.data.depth + ' (' + dh.data.invDepth + ')';
        ctx.font = fontPx + "px sans-serif";
        ctx.textAlign = "center";
        // ctx.fillStyle = dh.children ? 'white' : 'white';
        ctx.fillStyle = 'black';
        options.lab_shadows && setShadow(ctx, 'white', fontShadowPx);
        ctx.fillText(label, ~~((dh.x0 + dh.x1) / 2), ~~(dh.y0 + fontPx * 0.90));
        options.lab_shadows && removeShadow(ctx);
        ctx.restore();
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

  // state: user preferences
  const [valueKpi, setValueKpi] = React.useState('code');
  const [width, setWidth] = React.useState(2000);
  const [height, setHeight] = React.useState(1000);
  const [leafColor, setLeafColor] = React.useState(Colors.find(c => c.value === DEFAULT_COLOR_LEAF));
  const [innerColor, setInnerColor] = React.useState(Colors.find(c => c.value === DEFAULT_COLOR_INNER));
  const [features, setFeatures] = React.useState({
    labels: true,
    lab_kpi: false,
    lab_shadows: false,
    boxes: true,
    box_shadows: true,
    lines: true,
  });
  // state: mechanics
  const [popOver, setPopOver] = React.useState({
    anchorEl: null,
    anchorX: 0,
    anchorY: 0,
    dirNode: null
  });

  // hit boxes
  let lastRenderedRects = [];

  // render canvas at geometry changes
  React.useEffect(() => {
    const canvas = document.getElementById('output-canvas');
    lastRenderedRects = renderOnCanvas(projectTree, canvas, features, leafColor, innerColor);
  });

  const changeFeature = feature => event => {
    setFeatures({...features, [feature]: event.target.checked});
  };

  const changeLeafColor = event => {
    leafColorCache = {};
    setLeafColor(Colors.find(c => c.value === event.target.value));
  };

  const changeInnerColor = event => {
    innerColorCache = {};
    setInnerColor(Colors.find(c => c.value === event.target.value));
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

  const openPopOver = event => {
    // find the element (dirNode) relative to the click
    const canvas = document.getElementById('output-canvas');
    const rect = canvas.getBoundingClientRect();
    // get the coordinates in the rectangles space (since the canvas is generally larger than the screen size)
    const cx = event.clientX - rect.left;
    const cy = event.clientY - rect.top;
    const rx = cx * canvas.width / canvas.offsetWidth;
    const ry = cy * canvas.height / canvas.offsetHeight;

    // stop at the first rectangle that's hit
    // (the array was already reversed so elements at the top of the stack are first)
    const hitRect = lastRenderedRects.find(r => r.l <= rx && r.r >= rx && r.t <= ry && r.b >= ry);
    if (!hitRect || hitRect.dirNode.depth < 0) return;

    // open the popover for the element
    TESTING && console.log(hitRect.dirNode);
    setPopOver({
      ...popOver,
      anchorEl: event.target,
      anchorX: cx,
      anchorY: cy,
      dirNode: hitRect.dirNode,
    });
  };

  const onPopRemove = () => {
    popOver.dirNode && onClicked(popOver.dirNode);
    closePopOver();
  };

  const closePopOver = () => {
    setPopOver({...popOver, anchorEl: null, dirNode: null});
  };

  // update the depth values on the final tree
  updateTreeStatsRecursively(projectTree, projectTree.is_multi_project ? -1 : 0, valueKpi);

  const cWidth = Math.max(width, 96);
  const cHeight = Math.max(height, 96);
  const popOverOpen = popOver.anchorEl !== null;

  return (
    <React.Fragment>

      {/* The one and only Canvas - not-allowed was another great cursor choice */}
      <canvas id="output-canvas" width={cWidth} height={cHeight} style={{cursor: 'crosshair'}}
              onClick={openPopOver} className={classes.renderCanvas}/>

      <Popover
        open={popOverOpen}
        onClose={closePopOver}
        anchorEl={popOver.anchorEl}
        anchorOrigin={{horizontal: popOver.anchorX, vertical: popOver.anchorY,}}
        transformOrigin={{vertical: 'bottom', horizontal: 'left',}}
      >{popOverOpen &&
      <Paper className={classes.popActions}>
        <Typography color="secondary">{popOver.dirNode.path}</Typography>
        {/*<Divider variant="middle" component="hr"/>*/}
        <IconButton aria-label="Remove Folder" color="primary" href="" onClick={onPopRemove}><Delete/></IconButton>
      </Paper>}
      </Popover>

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
            <TextField label="Width" type="number" value={width} className={classes.numberInput}
                       onChange={e => setWidth(~~Math.max(96, Math.min(8192, parseInt(e.target.value))))}/>
            <TextField label="Height" type="number" value={height} className={classes.numberInput}
                       onChange={e => setHeight(~~(Math.max(96, Math.min(4096, parseInt(e.target.value)))))}/>
            <Button onClick={() => resizeCanvasToScreen(1)} href="">@1x</Button>
            <Button color="primary" onClick={() => resizeCanvasToScreen(2)} href="">@2x</Button>
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

        {/* Options */}
        <Grid item xs={12} sm={4} md={2}>
          <FormLabel component="div" className={classes.descLabel}>Colors</FormLabel>
        </Grid>
        <Grid item xs={12} sm={8} md={10}>
          <form autoComplete="off">
            <FormControl className={classes.colorInput} component={'div'}>
              <InputLabel>Leaf color</InputLabel>
              <Select value={leafColor.value} onChange={changeLeafColor}>
                {Colors.map((c, idx) => <MenuItem value={c.value} key={'leafc-' + idx}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl className={classes.colorInput} component={'div'}>
              <InputLabel>Inner color</InputLabel>
              <Select value={innerColor.value} onChange={changeInnerColor}>
                {Colors.map((c, idx) => <MenuItem value={c.value} key={'innerc-' + idx}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </form>
        </Grid>
      </Grid>

    </React.Fragment>
  );
}


