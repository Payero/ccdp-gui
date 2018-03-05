var ModalView = require('./ModalView.js');
var ControlLabel = require('react-bootstrap').ControlLabel;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var Form = require('react-bootstrap').Form;
var Col = require('react-bootstrap').Col;

var ModuleForm = React.createClass({
  getInitialState: function() {
    return {show: false};
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
  handleaxInstancesChange: function(e) {
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
      configuration: {},
      min_instances: this.state.minInstances,
      max_instances: this.state.maxInstances
    }
    console.log(moduleJson);
    this.props.handleSaveModule(moduleJson);
    this.hideModal();
  },
  render: function() {
    const body = (
      <div>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              Name:
            </Col>
            <Col sm={4}>
              <FormControl type="text" value={this.props.moduleName} onChange={this.handleModuleNameChange} />
            </Col>
            <Col componentClass={ControlLabel} sm={2}>
              ID:
            </Col>
            <Col sm={4}>
              <FormControl type="text" value={this.props.moduleID} onChange={this.handleModuleIDChange} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              Description:
            </Col>
            <Col sm={10}>
              <FormControl type="text" value={this.props.moduleDescription} onChange={this.handleModuleDescriptionChange} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              Command:
            </Col>
            <Col sm={10}>
              <FormControl type="text" value={this.props.command} onChange={this.handleCommandChange} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              Module Type:
            </Col>
            <Col sm={4}>
              <FormControl componentClass="select"
              placeholder="select"
              value={this.state.moduleType}
              onChange={this.handleModuleTypeChange} >
                <option value="reader">Reader</option>
                <option value="processor">Processor</option>
                <option value="writer">Writer</option>
              </FormControl>
            </Col>
            <Col componentClass={ControlLabel} sm={2}>
              Node Type:
            </Col>
            <Col sm={4}>
              <FormControl componentClass="select"
                placeholder="select"
                value={this.state.nodeType}
                onChange={this.handleNodeTypeChange} >
                  <option value="default">Default</option>
                  <option value="ec2">EC2</option>
              </FormControl>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              Instances:
            </Col>
            <Col componentClass={ControlLabel} sm={1}>
              Min
            </Col>
            <Col sm={1}>
              <FormControl type="text" value={this.props.minInstances} onChange={this.handleMinInstancesChange} />
            </Col>
            <Col componentClass={ControlLabel} sm={1}>
              Max
            </Col>
            <Col sm={1}>
              <FormControl type="text" value={this.props.maxInstances} onChange={this.handleMaxInstancesChange} />
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
