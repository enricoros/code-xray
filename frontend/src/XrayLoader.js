import React from "react";
import {makeStyles} from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import CloudUpload from '@material-ui/icons/CloudUpload';
import {useDropzone} from "react-dropzone";
import InputLabel from "@material-ui/core/InputLabel";

const useSourceSelectorStyles = makeStyles(theme => ({
  codeBlock: {
    padding: theme.spacing(2),
    margin: 0,
    color: 'white',
    background: '#263238',
  },
  button: {
    margin: theme.spacing(1),
  },
  dropZone: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    borderWidth: '2px',
    borderRadius: '2px',
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out',
  }
}));

function TabContainer(props) {
  return <Typography component="div" style={{padding: 8 * 3}}>{props.children}</Typography>
}

/**
 * @param props {onDataLoad: f}
 */
function XrayLoader(props) {
  const classes = useSourceSelectorStyles();
  const [tab, setTab] = React.useState(0);
  const {onDataLoad} = props;

  const {getRootProps, getInputProps, acceptedFiles, isDragActive} = useDropzone({
    accept: "application/json",
    onDrop: onFileSelected
  });

  function onFileSelected(acceptedFiles, rejectedFiles, event) {
    console.log('onDrop: ' + acceptedFiles);
    const fileReader = new FileReader();
    fileReader.readAsDataURL(acceptedFiles[0]);
    fileReader.onload = (e) => {
      console.log(e);
      console.log(e.target.result);
      //this.setState((prevState) => ({
      //  [collection]: [...prevState[collection], e.target.result]
      //}));
    };
  }

  function loadExample(n) {
    const request = new XMLHttpRequest();
    request.open('GET', 'ort.json', true);
    request.responseType = 'blob';
    request.onload = function() {
      onFileSelected([request.response]);
    };
    request.send();
  }

  return (
    <React.Fragment>
      {/* Selector Tab, synchro with local state */}
      <AppBar position="static">
        <Tabs centered value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Load Cloc file"/>
          <Tab label="Examples"/>
          <Tab label="From Github" disabled/>
        </Tabs>
      </AppBar>

      {/* Panel container: only 1 panel visible at a time */}
      <Paper square>

        {/* First tab: Drop Target & Code block */}
        {tab === 0 && <TabContainer>
          <Grid container>
            {/* drop target and load button */}
            <Grid item sm={12} lg={6}>
              Load a JSON file generated with <Link component="a" href="https://github.com/AlDanial/cloc">Cloc</Link>.
              <div {...getRootProps({className: classes.dropZone})}>
                <input {...getInputProps()} id="drop-area-file"/>
                {isDragActive ?
                  <p>Drop the files here ...</p> :
                  <p>Drag 'n' drop some files here, or click to select files</p>}
                <InputLabel htmlFor="drop-area-file">
                  <IconButton color="primary" component="span"><CloudUpload/></IconButton>
                </InputLabel>
                {/*<ul>{acceptedFiles.map(file => <li>{file.type}</li>)}</ul>*/}
              </div>
            </Grid>
            {/* instructions */}
            <Grid item sm={12} lg={6}>Instructions
              <pre className={classes.codeBlock}>{`# generate a cloc file by running:
./cloc --by-file --json --quiet --hide-rate ./`}</pre>
            </Grid>
          </Grid>
        </TabContainer>}

        {/* Tab 2: Examples */}
        {tab === 1 && <TabContainer>
          {[1, 2, 3, 4, 5].map(n =>
            <Button variant="outlined" color="primary" href="#" style={{'margin': '5px'}} key={n}
                    onClick={() => loadExample(n)}>Example {n}</Button>)}
        </TabContainer>}

        {/* Tab 3: Github */}
        {tab === 2 && <TabContainer>
          Importing from Github is not supported yet.
        </TabContainer>}
      </Paper>
    </React.Fragment>
  )
}

export default XrayLoader;
