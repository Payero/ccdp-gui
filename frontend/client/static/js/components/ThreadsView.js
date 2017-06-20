var Scrollbars = require('react-custom-scrollbars').Scrollbars;
var NotificationManager = require('react-notifications').NotificationManager;
var ModalConfirm = require('./ModalConfirm.js');
var ModalPrompt = require('./ModalPrompt.js');

/**
 * ThreadsView component for displaying current threads in the Project Editor
 * Corresponds to the 'Threads' tab in the DetailPanel
 * Includes Save and Delete buttons for each thread
 */
var ThreadsView = React.createClass({
  getInitialState: function() {
    return {showConfirm: false, showPrompt: false, modalTitle: '', modalBody: null, modalCallback: null, confirmButtonText: ''};
  },
  showModalConfirm: function(modalTitle, modalBody, modalCallback, confirmButtonText) {
    this.setState({showConfirm: true, modalTitle: modalTitle, modalBody: modalBody, modalCallback: modalCallback, confirmButtonText: confirmButtonText});
  },
  showModalPrompt: function(modalTitle, modalBody, modalCallback, confirmButtonText) {
    this.setState({showPrompt: true, modalTitle: modalTitle, modalBody: modalBody, modalCallback: modalCallback, confirmButtonText: confirmButtonText});
  },
  hideModal: function() {
    this.setState({showConfirm: false, showPrompt: false, modalTitle: '', modalBody: null, modalCallback: null, confirmButtonText: ''});
  },
  // Prompts user for name and description for a thread, then uses App callback to save thread to db
  onSave: function(thread) {
    var nodeString = "";
    for (var i = 0; i < thread["nodes"].length - 1; i++) {
      nodeString += thread["nodes"][i].title + "(" + thread["nodes"][i].id + "), ";
    }
    nodeString += thread["nodes"][thread["nodes"].length - 1].title + "(" + thread["nodes"][thread["nodes"].length - 1].id + ")";
    var confirmString = "Enter a name and description to save the thread consisting of " + nodeString;
    var modalTitle = "Save Thread";
    var modalBody = ( <div>
                        <p>{confirmString}</p>
                        <p>Note: Saving a thread with the same name as another will overwrite it in the database, thread name cannot be empty or whitespace</p>
                      </div> );
    var modalCallback = (threadName, threadDescription) => {
                            if (!(threadName.length === 0 || !threadName.trim())) {
                              var threadJSON = this.generateThreadJSON(thread, threadName, threadDescription);
                              this.props.handleSaveSingleThread(threadJSON);
                              this.hideModal();
                            } else {
                              NotificationManager.error("ERROR - Thread name cannot be empty or whitespace");
                            }
                          };
    var confirmButtonText = "Save";
    this.showModalPrompt(modalTitle, modalBody, modalCallback, confirmButtonText);
  },
  // Prompts user for confirmation to delete thread, then uses App callback to remove thread from db
  onDelete: function(thread) {
    var nodeString = "";
    for (var i = 0; i < thread["nodes"].length - 1; i++) {
      nodeString += thread["nodes"][i].title + "(" + thread["nodes"][i].id + "), ";
    }
    nodeString += thread["nodes"][thread["nodes"].length - 1].title + "(" + thread["nodes"][thread["nodes"].length - 1].id + ")";
    var confirmString = "Are you sure you want to delete the thread consisting of " + nodeString + "?";
    var modalTitle = "Delete Thread";
    var modalBody = <span>{confirmString}</span>;
    var modalCallback = () => {this.props.handleDeleteSingleThread(thread); this.hideModal();};
    var confirmButtonText = "Delete";
    this.showModalConfirm(modalTitle, modalBody, modalCallback, confirmButtonText);
  },
  // Generates JSON representation for a single thread, for use with save
  generateThreadJSON: function(thread, threadName, threadDescription) {
    var threadDict = {
      "name": threadName,
      "short-description": threadDescription,
      "tasks": []
    };
    for (var j = 0; j < thread["nodes"].length; j++) {
      var node = thread["nodes"][j];
      threadDict["tasks"].push({
        "task-id": node.id,
        "module-id": node.task,
        "name": node.title,
        "class-name": node.config["class-name"],
        "ccdp-type": node.config["ccdp-type"],
        "max-instances": node.config["max-instances"],
        "min-instances": node.config["min-instances"],
        "cpu": node.config["cpu"],
        "memory": node.config["memory"],
        "configuration": node.config["task-props"],
        "input-ports": [],
        "output-ports": []
      });
    }
    // Setup input/output ports and keep track of i/o port number for each task in the thread
    var inputPortNums = [];
    var outputPortNums = [];
    var taskNum = thread["nodes"].length;
    while (taskNum--) {
      inputPortNums.push(1);
      outputPortNums.push(1);
    }
    if (thread["nodes"].length > 1) {
      for (var k = 0; k < thread["edges"].length; k++) {
        var outputIndex = thread["nodes"].indexOf(thread["edges"][k].source);
        var inputIndex = thread["nodes"].indexOf(thread["edges"][k].target);
        if (inputIndex > -1 && outputIndex > -1) {
          threadDict["tasks"][inputIndex]["input-ports"].push({
            "port-id": threadDict["tasks"][inputIndex]["task-id"] + "_input-" + inputPortNums[inputIndex],
            "from": thread["edges"][k].source.id + "_output-" + outputPortNums[outputIndex]
          });
          threadDict["tasks"][outputIndex]["output-ports"].push({
            "port-id": threadDict["tasks"][outputIndex]["task-id"] + "_output-" + outputPortNums[outputIndex],
            "to": thread["edges"][k].target.id + "_input-" + inputPortNums[inputIndex]
          });
          inputPortNums[inputIndex]++;
          outputPortNums[outputIndex]++;
        }
      }
    }
    return JSON.stringify(threadDict);
  },
  render: function() {
    var currentProject = this.props.generateCurrentThreads();
    var currentThreads = currentProject.threads;
    var threadCount = 0;
    return (
      <div className="ThreadsView container-fluid">
        <Scrollbars style={{ height: '100%'}} autoHide={ true } hideTracksWhenNotNeeded={ true }>
        {currentThreads.map(thread => {
          var nodeString = "";
          for (var i = 0; i < thread["nodes"].length - 1; i++) {
            nodeString += thread["nodes"][i].title + "(" + thread["nodes"][i].id + "), ";
          }
          nodeString += thread["nodes"][thread["nodes"].length - 1].title + "(" + thread["nodes"][thread["nodes"].length - 1].id + ")";
          return (
            <div className="row" key={threadCount++}>
              <div className="col-md-10">
                <row>
                  <label>Tasks:</label>
                  <p>{nodeString}</p>
                  { thread.cyclesPresent ?
                    <p style={{ backgroundColor: '#FF0000' }}>ERROR: Thread contains a cycle in a thread, remove cycles before running project</p>
                  : null }
                </row>
              </div>
              <div className="col-md-1">
                <row>
                  <button type="button" onClick={() => { this.onSave(thread); } } className="btn btn-primary btn-block">Save</button>
                </row>
              </div>
              <div className="col-md-1">
                <row>
                  <button type="button" onClick={() => { this.onDelete(thread); } } className="btn btn-primary btn-block">Delete</button>
                </row>
              </div>
            </div>
          )
        })}
        { currentThreads.length === 0 ?
          <div className="col-md-12">
            <p>No threads to display - a valid thread must have at least one starting task and cannot contain cycles</p>
          </div>
        : null }
        </Scrollbars>
        <ModalPrompt
          show={this.state.showPrompt}
          hideModal={this.hideModal}
          modalTitle={this.state.modalTitle}
          modalBody={this.state.modalBody}
          modalCallback={this.state.modalCallback}
          confirmButtonText={this.state.confirmButtonText}/>
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

module.exports = ThreadsView;
