var ModalView = require('./ModalView.js');
var ControlLabel = require('react-bootstrap').ControlLabel;
var Button = require('react-bootstrap').Button;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var Form = require('react-bootstrap').Form;
var Col = require('react-bootstrap').Col;

var ModuleForm = React.createClass({
  getInitialState: function() {
    return {
      moduleType: 'Reader',
      minInstances: 1,
      maxInstances: 1
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
  handleConfigurationChange: function(e) {
    this.setState({config: e.target.value})
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
      command: this.state.command,
      ccdp_type: this.state.nodeType,
      module_type: this.state.moduleType,
      configuration: this.state.config || {},
      min_instances: this.state.minInstances,
      max_instances: this.state.maxInstances
    }
    console.log(moduleJson);
    this.props.handleSaveModule(JSON.stringify(moduleJson));
    this.setState({
      moduleID: "",
      moduleName: "",
      moduleDescription: "",
      command: "",
      nodeType: "",
      moduleType: "",
      config: "",
      minInstances: "",
      maxInstances: ""
    });
    this.hideModal();
  },
  parseCommand: function(cmds) {
    let buf = '';
    let delim = '';
    for (let cmd of cmds) {
      buf+= delim + cmd.replace("\"", "");
      delim = " ";
    }
    return buf;
  },
  parseConfig: function(config) {
    let buf = '';
    let delim = '';
    for (let k in config) {
      buf+= delim + k + " = " + (config[k] ? config[k] : "\"\"");
      delim = ", ";
    }
    return buf;
  },
  handleUploadFile: function(e) {
    var file = e.target.files[0];
    console.log("Upload file " + file.name);
    var reader = new FileReader();
    reader.addEventListener("loadend", () => {
      var res = reader.result;
      console.log("contents: " + res)
      if (res) {
        res = JSON.parse(res);
        this.setState({
          moduleID: res['module_id'],
          moduleName: res['name'],
          moduleDescription: res['short_description'],
          command: this.parseCommand(res['command']),
          nodeType: res['ccdp_type'],
          moduleType: res['module_type'],
          config: this.parseConfig(res['configuration']),
          minInstances: res['min_instances'],
          maxInstances: res['max_instances']
        })
      }
    });
    reader.readAsText(file);
  },
  render: function() {
    const body = (
      <div>
        <input type="file" id="upload_file" style={{display: "none"}} onChange={this.handleUploadFile} />
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
              Configuration:
            </Col>
            <Col sm={10}>props
              <FormControl type="text" value={this.state.config} onChange={this.handleConfigurationChange} />
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
            <Col sm={2}>
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
