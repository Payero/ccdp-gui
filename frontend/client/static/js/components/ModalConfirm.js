var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;

var ModalConfirm = React.createClass({
  render: function() {
    return (
      <Modal show={this.props.show} onHide={this.props.hideModal}>
        <Modal.Header>
          <Modal.Title id="contained-modal-title-lg">{this.props.modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.modalBody}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.hideModal}>Cancel</Button>
          <Button bsStyle="primary" onClick={this.props.modalCallback}>{this.props.confirmButtonText}</Button>
        </Modal.Footer>
      </Modal>
    );
  }
});

module.exports = ModalConfirm;
