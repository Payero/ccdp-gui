var Modal = require('react-modal');
var Task = require('./Task.js');

const customStyles = {
  content : {
    top                   : '20%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)',
    border                : '5px'
  }
};

var ModuleForm = React.createClass({
  getInitialState: function(){
    return { modalOpened: false };
  },
  toggleModal: function() {
    this.setState(prevState => ({ modalOpened: !prevState.modalOpened }));
  },
  render: function() {
    const { data } = this.props;
    const dragHandle = "modal-header";
    // Modal.setAppElement(this.props.app);
    return (
      <div>
        <Modal
          style={customStyles}
          isOpen={this.state.modalOpened}
          onRequestClose={this.toggleModal}
          contentLabel="New Module"
          appElement={document.getElementById('content')} >
            <div ref={(div) => {
                     const target = $(div).parent();
                     // target.draggable({handle: `.${dragHandle}`});
                     this.props.forcedWidth && target.width(this.props.forcedWidth);
                 }}>
              <div className="modal-header">
                <h4 className="modal-title">New Module</h4>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4"> Module Name:<input type="text" /></div>
                  <div className="col-md-4">Module ID: <input type="text" /></div>
                </div>
                <div className="row">
                  <div className="col-md-4">Description:<input type="text" /></div>
                  <div className="col-md-4">CCDP Ttype:<input type="text" /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={this.toggleModal}>Close</button>
              </div>
            </div>
        </Modal>
        <div className="addTask">
          <input type="button" value="New Module" className="transpNoBorder" onClick={this.toggleModal} />
        </div>
        <div className="addTask" >
          <input type="button" value="From Existing JSON Fie" className="transpNoBorder" />
        </div>
      </div>
    );
  }
});

module.exports = ModuleForm;
