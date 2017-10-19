var FontAwesome = require('react-fontawesome');
var ModalConfirm = require('./ModalConfirm.js');

/**
 * GraphControls component for use in Graph, contains icons with onClicks mapped to callbacks in App/Graph
 */
var GraphControls = React.createClass({
  getInitialState: function() {
    return {showConfirm: false, modalTitle: '', modalBody: null, modalCallback: null, confirmButtonText: ''};
  },
  onRun: function() {
    this.props.onRunGraph();
  },
  onPause: function() {
    // TODO
  },
  onStop: function() {
    // TODO - This function still needs to be fleshed out, currently just resets the state flag
    this.props.onStopGraph();
  },
  onExport: function() {
    var generatedJSON = this.props.onExportGraph();
    if (generatedJSON !== null) {
      var modalTitle = "Export Project JSON";
      var modalBody = <pre>{JSON.stringify(generatedJSON, undefined, 2)}</pre>;
      var modalCallback = () => {
        var data = new Blob([JSON.stringify(generatedJSON)], {type: 'text/json'});
        if (navigator.msSaveBlob) {
          navigator.msSaveBlob(data, 'ccdp.json');
        } else {
          var jsonURL = window.URL.createObjectURL(data);
          var tempLink = document.createElement('a');
          tempLink.setAttribute("href", jsonURL);
          tempLink.setAttribute('download', 'ccdp.json');
          tempLink.style.visibility = 'hidden';
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
        }
        this.hideModal();
      };
      var confirmButtonText = "Download";
      this.showModalConfirm(modalTitle, modalBody, modalCallback, confirmButtonText);
    }
  },
  onClear: function() {
    var modalTitle = "Clear Project";
    var modalBody = <span>Are you sure you want to clear the project?</span>;
    var modalCallback = () => {this.props.onClearGraph(); this.hideModal();};
    var confirmButtonText = "OK";
    this.showModalConfirm(modalTitle, modalBody, modalCallback, confirmButtonText);
  },
  onSave: function() {
    this.props.onSaveGraph(false);
  },
  onNew: function() {
    var modalTitle = "New Project";
    var modalBody = <span>Are you sure you want to open a new project (Unsaved changes to an existing project will be deleted)?</span>;
    var modalCallback = () => {this.props.onNewGraph(); this.hideModal();};
    var confirmButtonText = "OK";
    this.showModalConfirm(modalTitle, modalBody, modalCallback, confirmButtonText);
  },
  onGrid: function() {
    this.props.onGridToggle();
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
        <div className="GraphControls" >
          <FontAwesome className="GraphIcon" title="Run" name="play" onClick={() => {this.onRun();} } />
          <FontAwesome className="GraphIcon" title="Pause" name="pause" onClick={() => {this.onPause();} } />
          <FontAwesome className="GraphIcon" title="Stop" name="stop" onClick={() => {this.onStop();} } />
          <FontAwesome className="GraphIcon" title="Export" name="share-square-o" onClick={() => {this.onExport();} } />
          <FontAwesome className="GraphIcon" title="Clear" name="trash-o" onClick={() => {this.onClear();} } />
          <FontAwesome className="GraphIcon" title="Save Project" name="floppy-o" onClick={() => {this.onSave();} } />
          <FontAwesome className="GraphIcon" title="New Project" name="file-o" onClick={() => {this.onNew();} } />
          <FontAwesome className="GraphIcon" title="Toggle Grid" name="th" onClick={() => {this.onGrid();} } />
        </div>
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

module.exports = GraphControls;
