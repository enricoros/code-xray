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
import Button from "@material-ui/core/Button";

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
    backgroundColor: DEBUGGING ? 'red' : 'transparent',
    width: '100%',
    height: '100%',
  },
}));

/*
const Painter = {
  shrinkInnerPadding: 2,


  setShadow: (ctx, color, shadowPx) => {
    ctx.shadowColor = color ? color : '#0000';
    ctx.shadowBlur = shadowPx ? shadowPx : 0;
    ctx.shadowOffsetX = ctx.shadowOffsetY = shadowPx ? ~~(shadowPx / 2) : 0;
  },

  removeShadow: (ctx) => Painter.setShadow(ctx),

  drawFolderBox: (ctx, dh, shrinkBox, forceFill) => {
    const isLeaf = !dh.children;
    // shrink project nodes
    if (shrinkBox) {
      dh.x0 += Painter.shrinkInnerPadding;
      dh.x1 -= Painter.shrinkInnerPadding;
      dh.y1 -= Painter.shrinkInnerPadding;
    }
    // stroke: not if leaf (note: half will be painted by the 'fillRect' call)
    if (!isLeaf && !shrinkBox) {
      Painter.removeShadow(ctx);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
    }
    // fill: if leaf, strong color and no shadow
    if (isLeaf) {
      Painter.removeShadow(ctx);
      ctx.fillStyle = fColorI();
    } else {
      // if inner node, more depth-based coloring and shadow
      Painter.setShadow(ctx, 'rgba(0,0,0,0.5)', Painter.boxShadowPx);
      ctx.fillStyle = fColor2I();
      // ctx.fillStyle = interpolateYlGnBu(0.1 + (dh.data.depth - 1) / 6 + (Math.random() - Math.random()) / 28);
    }
    if (forceFill)
      ctx.fillStyle = forceFill;
    ctx.fillRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));
  },

  drawFolderLabel: (ctx, d, thinLabels) => {
    let label = d.data.name + ' (' + d.data.value + ')';
    if (thinLabels)
      label = d.data.name;

    setShadow(ctx, 'black', fontShadowPx);
    ctx.font = fontPx + "px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = d.children ? 'white' : 'white';
    ctx.fillText(label, ~~((d.x0 + d.x1) / 2), ~~(d.y0 + fontPx * 0.85));
  }
};
*/
function pickBestWH(w, h) {
  let height = h || 2000,
    width = w;
  if (width && !h)
    height = (~~(width * 9 / 16));
  if (height && !width)
    width = (~~(height * 16 / 9));
  return {width, height};
}

const print = console.log;

function renderOnCanvas(projectTree, canvas) {
  const options = {
    width: canvas.width,
    height: canvas.height,
    hide_below: 0,
    hide_above: 99,
    hide_labels_above: 6,
    thin_labels_above: 3,
  };

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

  // erase canvas
  const context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);

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

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));

    // fill: if leaf, strong color and no shadow
    if (isLeaf) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
    } else {
      // if inner node, more depth-based coloring and shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      // ctx.fillStyle = interpolateYlGnBu(0.1 + (dh.data.depth - 1) / 6 + (Math.random() - Math.random()) / 28);
    }
    // if (forceFill)
    //   ctx.fillStyle = forceFill;
    ctx.fillRect(~~dh.x0, ~~dh.y0, ~~(dh.x1 - dh.x0), ~~(dh.y1 - dh.y0));

    // const depth = dh.data.depth;
    // if (depth < hide_below || depth > hide_above) return;
    // drawFolderBox(context, dh, depth <= shrink_on, depth <= gray_on ? 'gray' : undefined);
    // if (depth <= hide_labels_above)
    //   drawFolderLabel(context, dh, depth > thin_labels_above);
  });

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

  function resizeCanvas(newSize) {
    setWidth(newSize[0]);
    setHeight(newSize[1]);
  }

  function resizeCanvasToScreen(newSize) {
    const canvas = document.getElementById('output-canvas');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    setWidth(~~(rect.width * dpr));
    setHeight(~~(rect.height * dpr));
  }

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
            <Button color="primary" onClick={() => resizeCanvasToScreen()} href="">1:1</Button>
            <Button onClick={() => resizeCanvas([4000, 2000])} href="">4000 x 2000</Button>
            <Button onClick={() => resizeCanvas([2000, 1000])} href="">2000 x 1000</Button>
            <Button onClick={() => resizeCanvas([1000, 750])} href="">800 x 600</Button>
            {(window.devicePixelRatio !== 1) &&
            <FormLabel component="div" className={classes.descLabel}> - Dpr: {window.devicePixelRatio}</FormLabel>}
          </FormGroup>
        </Grid>
      </Grid>

      <Typography>&nbsp;</Typography>

      {/* The one and only Canvas */}
      <canvas id="output-canvas" width={cWidth} height={cHeight} className={classes.renderCanvas}/>

    </React.Fragment>
  );
}
