var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
var ControlLabel = require('react-bootstrap').ControlLabel;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;

var ModalPrompt = React.createClass({
  getInitialState: function() {
    return {modalName: '', modalDescription: ''};
  },
  hideModal: function() {
    this.setState({modalName: '', modalDescription: ''});
    this.props.hideModal();
  },
  handleModalNameChange: function(e) {
    this.setState({modalName: e.target.value});
  },
  handleModalDescriptionChange: function(e) {
    this.setState({modalDescription: e.target.value});
  },
  render: function() {
    return (
      <Modal show={this.props.show} onHide={this.hideModal}>
        <Modal.Header>
          <Modal.Title id="contained-modal-title-lg">{this.props.modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.modalBody}
          <FormGroup>
            <ControlLabel>Name:</ControlLabel><FormControl type="text" value={this.state.modalName} onChange={this.handleModalNameChange}/>
            <ControlLabel>Description:</ControlLabel><FormControl type="text" value={this.state.modalDescription} onChange={this.handleModalDescriptionChange}/>
          </FormGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.hideModal}>Cancel</Button>
          <Button bsStyle="primary" onClick={() => {this.props.modalCallback(this.state.modalName, this.state.modalDescription);} }>{this.props.confirmButtonText}</Button>
        </Modal.Footer>
      </Modal>
    );
  }
});

module.exports = ModalPrompt;
