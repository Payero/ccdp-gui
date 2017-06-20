var ContextMenu = require('react-contextmenu').ContextMenu;
var MenuItem = require('react-contextmenu').MenuItem;
var ModalConfirm = require('./ModalConfirm.js');

/**
 * ThreadContextMenu component for use with React ContextMenu
 * Delete option has an onClick to remove the Thread from the Sidebar
 */
var ThreadContextMenu = React.createClass({
  getInitialState: function() {
    return {showConfirm: false, modalTitle: '', modalBody: null, modalCallback: null, confirmButtonText: ''};
  },
  onDeleteThread: function(e, data) {
    var modalTitle = "Delete Thread";
    var modalBody = <span>Are you sure you want to delete the thread {data.name}?</span>;
    var modalCallback = () => {this.props.handleDeleteThread(data.name); this.hideModal();};
    var confirmButtonText = 'Delete';
    this.showModalConfirm(modalTitle, modalBody, modalCallback, confirmButtonText);
  },
  showModalConfirm: function(modalTitle, modalBody, modalCallback, confirmButtonText) {
    this.setState({showConfirm: true, modalTitle: modalTitle, modalBody: modalBody, modalCallback: modalCallback, confirmButtonText: confirmButtonText});
  },
  hideModal: function() {
    this.setState({showConfirm: false, modalTitle: '', modalBody: null, modalCallback: null, confirmButtonText: ''});
  },
  render: function() {
    return (
      <div>
        <ContextMenu identifier='thread'>
          <MenuItem onClick={this.onDeleteThread}>Delete</MenuItem>
        </ContextMenu>
        <ModalConfirm
          show={this.state.showConfirm}
          hideModal={this.hideModal}
          modalTitle={this.state.modalTitle}
          modalBody={this.state.modalBody}
          modalCallback={this.state.modalCallback}
          confirmButtonText={this.state.confirmButtonText}/>
      </div>
    )
  }
});

module.exports = ThreadContextMenu;
