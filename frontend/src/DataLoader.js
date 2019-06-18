import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import PhotoCamera from '@material-ui/icons/PhotoCamera';
import {useDropzone} from 'react-dropzone'

function MyDropzone() {
  const onDrop = React.useCallback(acceptedFiles => {
    // Do something with the files
    const collection = 'images';
    const fileReader = new FileReader();
    fileReader.readAsDataURL(acceptedFiles[0]);
    fileReader.onload = (e) => {
      console.log(e.target);
      /*this.setState((prevState) => ({
        [collection]: [...prevState[collection], e.target.result]
      }));*/
    };

  }, []);
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }
    </div>
  )
}

class DataLoader extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      images: []
    }
  }

  handleCapture = ({target}) => {
    const collection = 'images';
    const fileReader = new FileReader();
    fileReader.readAsDataURL(target.files[0]);
    fileReader.onload = (e) => {
      console.log(e.target);
      this.setState((prevState) => ({
        [collection]: [...prevState[collection], e.target.result]
      }));
    };
  };

  render() {
    const {classes} = this.props;
    return (
      <React.Fragment>
        <MyDropzone/>
        aaaaa
        <ul>
          {this.state.images.map((value, index) =>
            <li key={index}>{value.length}</li>
          )}
        </ul>
        <input accept="image/*" className={classes.input} id="icon-button-photo" onChange={this.handleCapture}
               type="file"/>
        <label htmlFor="icon-button-photo">
          <IconButton color="primary" component="span">
            <PhotoCamera/>
          </IconButton>
        </label>

      </React.Fragment>
    );
  }
}

export default withStyles(() => ({
  input: {
    display: 'none-yes'
  }
}), {withTheme: true})(DataLoader);
