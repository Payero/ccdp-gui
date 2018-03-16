var ModalView = require('./ModalView.js');
var ControlLabel = require('react-bootstrap').ControlLabel;
var Button = require('react-bootstrap').Button;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var Form = require('react-bootstrap').Form;
var Col = require('react-bootstrap').Col;
var NotificationManager = require('react-notifications').NotificationManager;
import Select from 'react-select';
import JSZip from 'jszip';

const s3 = new AWS.S3({
  accessKeyId: 'AKIAI3S5UN7PY44WAWGQ',
  secretAccessKey: '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'
});

var ModuleForm = React.createClass({
  getInitialState: function() {
    return {
      moduleType: 'Reader',
      minInstances: 1,
      maxInstances: 1,
      archiveFiles: [],
      selectedArchiveFile: '',
      configuration: {},
      fileToUpload: null,
      moduleFileVisibility: "hidden",
      pythonClassVisibility: "hidden"
    };
  },
  hideModal: function() {
    this.props.hideAddModuleModal();
  },
  handleModuleNameChange: function(e) {
    this.setState({moduleName: e.target.value})
  },
  handleModuleIDChange: function(e) {
    this.setState({moduleID: e.target.value})
  },
  handleModuleDescriptionChange: function(e) {
    this.setState({moduleDescription: e.target.value})
  },
  handleNodeTypeChange: function(e) {
    this.setState({nodeType: e.target.value})
  },
  handleModuleTypeChange: function(e) {
    this.setState({moduleType: e.target.value})
  },
  handleCommandChange: function(e) {
    this.setState({command: e.target.value})
  },
  handleMinInstancesChange: function(e) {
    this.setState({minInstances: e.target.value})
  },
  handleMaxInstancesChange: function(e) {
    this.setState({maxInstances: e.target.value})
  },
  modalCallback: function(body) {
    let moduleJson = {
      module_id: this.state.moduleID,
      name: this.state.moduleName,
      short_description: this.state.moduleDescription,
      command: this.parseCommand(this.state.command),
      ccdp_type: this.state.nodeType,
      module_type: this.state.moduleType,
      min_instances: this.state.minInstances,
      max_instances: this.state.maxInstances,
      configuration: {} //unused, but UI not yet updated
    }
    this.props.handleSaveModule(JSON.stringify(moduleJson));
    this.setState({
      moduleID: "",
      moduleName: "",
      moduleDescription: "",
      command: "",
      nodeType: "",
      moduleType: "",
      minInstances: "",
      maxInstances: ""
    });
    this.hideModal();
  },
  parseCommand : function(cmd_str) {
    if (!cmd_str || cmd_str.length == 0) {
      return [];
    }
    return cmd_str.split(" ");
  },
  stringifyCommand: function(cmds) {
    let buf = '';
    let delim = '';
    for (let cmd of cmds) {
      buf+= delim + cmd.replace("\"", "");
      delim = " ";
    }
    return buf;
  },
  handleReadFile: function(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.addEventListener("loadend", () => {
      var res = reader.result;
      if (res) {
        res = JSON.parse(res);
        this.setState({
          moduleID: res['module_id'],
          moduleName: res['name'],
          moduleDescription: res['short_description'],
          command: this.stringifyCommand(res['command']),
          nodeType: res['ccdp_type'],
          moduleType: res['module_type'],
          minInstances: res['min_instances'],
          maxInstances: res['max_instances']
        })
      }
    });
    reader.readAsText(file);
  },
  handleUploadModule: function(e) {
    let file = e.target.files[0];
    let zip = new JSZip();
    zip.loadAsync(file)
     .then(zip => {
         let files = zip.filter((path, file) => {
           return !path.endsWith("/");
         });
         //Store path for dup file names, otherwise store file name
         let filenames = files.map(file => {
           if (files.filter( (f) =>
              f.name.substring(f.name.lastIndexOf('/'))
                == file.name.substring(file.name.lastIndexOf('/'))
           ).length > 1) {
             return file.name;
           }
           return file.name.substring(file.name.lastIndexOf('/') + 1);
         });
         this.setState({
           archiveFiles: filenames,
           moduleFileVisibility: "visible"
         })
         if (filenames && filenames.length > 0) {
            this.setState({
              fileToUpload: file
            });
         }
       }, () => {
         //not a zip file
         let pyModSelected = file.name.endsWith(".py");
         this.setState({
           fileToUpload: file,
           selectedArchiveFile: "",
           moduleFileVisibility: "hidden",
           pythonClassVisibility : (pyModSelected ? "visible" : "hidden"),
           archiveFiles: []
         });
       });

  },
  getUploadUrl: function(filename) {
    return s3.getSignedUrl('putObject', {
    Bucket: 'ccdp-tasks',
    Key: filename,
    ACL: 'authenticated-read',
    // This must match the ajax contentType parameter
    ContentType: 'binary/octet-stream'
});

},
doUploadFile: function() {
  let file = this.state.fileToUpload;
  if (file)  {
    let url = this.getUploadUrl(file.name);
    $.ajax({
      type: 'PUT',
      url: url,
      // Content type must much with the parameter you signed your URL with
      contentType: 'binary/octet-stream',
      // this flag is important, if not set, it will try to send data as a form
      processData: false,
      // the actual file is sent raw
      data: file
    })
    .success(function() {
      NotificationManager.success('File uploaded');
    })
    .error(function() {
      NotificationManager.erro('File not uploaded');
      console.log( arguments);
    });
  } else {
    NotificationManager.warning("No file has been selected for upload")
  }
},
handleSelectedArchiveFileChange: function(selectedArchiveFile) {
  console.log("selected " + selectedArchiveFile.value);
  let pyModSelected = (selectedArchiveFile && selectedArchiveFile.value.endsWith(".py"));
    this.setState({
      selectedArchiveFile,
      pythonClassVisibility : (pyModSelected ? "visible" : "hidden"),
    });
  },
render: function() {
  const { selectedArchiveFile } = this.state;
  let selectedArchiveFileValue = selectedArchiveFile && selectedArchiveFile.value;
  if (this.state.archiveFiles && this.state.archiveFiles.length == 1) {
    selectedArchiveFileValue = this.state.archiveFiles[0];
  }
  const body = (
    <div>
      <input type="file" id="upload_file" style={{display: "none"}} onChange={this.handleReadFile} />
      <Form horizontal>
        <FormGroup>
          <Col sm={2}>
            <Button bsStyle="primary" onClick={() => {$("#upload_file").trigger('click')}}>
              Import from JSON File
            </Button>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            Name:
          </Col>
          <Col sm={4}>
            <FormControl type="text"
              value={this.state.moduleName}
              onChange={this.handleModuleNameChange}/>
          </Col>
          <Col componentClass={ControlLabel} sm={2}>
            ID:
          </Col>
          <Col sm={4}>
            <FormControl type="text" value={this.state.moduleID} onChange={this.handleModuleIDChange} />
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            Description:
          </Col>
          <Col sm={10}>
            <FormControl type="text" value={this.state.moduleDescription} onChange={this.handleModuleDescriptionChange} />
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            Command:
          </Col>
          <Col sm={10}>
            <FormControl type="text" value={this.state.command} onChange={this.handleCommandChange} />
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            Module Type:
          </Col>
          <Col sm={2}>
            <FormControl componentClass="select"
            placeholder="select"
            value={this.state.moduleType}
            onChange={this.handleModuleTypeChange} >
              <option value="Reader">Reader</option>
              <option value="Processor">Processor</option>
              <option value="Writer">Writer</option>
            </FormControl>
          </Col>
          <Col componentClass={ControlLabel} sm={2}>
            Node Type:
          </Col>
          <Col sm={2} style={{"textalign": "left"}}>
            <FormControl componentClass="select"
              placeholder="select"
              value={this.state.nodeType}
              onChange={this.handleNodeTypeChange} >
                <option value="DEFAULT">Default</option>
                <option value="EC2">EC2</option>
            </FormControl>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            Instances:
          </Col>
          <Col componentClass={ControlLabel} sm={1}>
            Min:
          </Col>
          <Col sm={1}>
            <FormControl type="text" value={this.state.minInstances} onChange={this.handleMinInstancesChange} />
          </Col>
          <Col componentClass={ControlLabel} sm={1}>
            Max:
          </Col>
          <Col sm={1}>
            <FormControl type="text" value={this.state.maxInstances} onChange={this.handleMaxInstancesChange} />
          </Col>
        </FormGroup>
        <FormGroup>
          <Col sm={3}>
            <ControlLabel className="file-upload">Upload Module File{' '}</ControlLabel>
            <FormControl bsStyle="primary" className="file-upload" type="file" onChange={this.handleUploadModule}/>
            <Button className="file-upload2" bsStyle="primary" onClick={this.doUploadFile}>Upload</Button>
          </Col>
          <Col sm={3}>
            <ControlLabel style={{visibility:this.state.moduleFileVisibility}}>
              Module File
            </ControlLabel>
            <Select
              style={{visibility:this.state.moduleFileVisibility}}
              value={selectedArchiveFileValue}
              placeholder={'Select an archive file...'}
              onChange={this.handleSelectedArchiveFileChange}
              options={this.state.archiveFiles.map(file => {
                return {value: file, label:file}
              })}/>
          </Col>
          <Col sm={3}>
            <ControlLabel style={{visibility:this.state.pythonClassVisibility}}>Python Class</ControlLabel>
            <FormControl type="text" style={{visibility:this.state.pythonClassVisibility}}  />
          </Col>
        </FormGroup>
      </Form>
    </div>);
    return (<ModalView
            modalTitle="Create New Module"
            modalBody={body}
            confirmButtonText="Save Module"
            hideModal={this.hideModal}
            show={this.props.show}
            modalCallback={this.modalCallback}
            />);
  }
});

module.exports = ModuleForm;
