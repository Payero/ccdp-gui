var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;

var ModalView = React.createClass({
  getInitialState: function() {
    return {modalName: '', modalDescription: ''};
  },
  hideModal: function() {
    this.setState({modalName: '', modalDescription: ''});
    this.props.hideModal();
  },
  render: function() {
    return (
      <Modal
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
        show={this.props.show}
        onHide={this.hideModal}>
        <Modal.Header>
          <Modal.Title id="contained-modal-title-lg">{this.props.modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.modalBody}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.hideModal}>Cancel</Button>
          <Button bsStyle="primary" onClick={() => {this.props.modalCallback(this.props.modalBody);} }>{this.props.confirmButtonText}</Button>
        </Modal.Footer>
      </Modal>
    );
  }
});

module.exports = ModalView;