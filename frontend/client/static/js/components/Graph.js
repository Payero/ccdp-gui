var GraphD3 = require('./GraphD3.js');
var ZoomControls = require('./ZoomControls.js');
var GraphControls = require('./GraphControls.js');
var DetailPanel = require('./DetailPanel.js');
var DropTarget = require('react-dnd').DropTarget;
var ModalConfirm = require('./ModalConfirm.js');

/**
 * React DnD DropTarget functionality, handles task/thread/project creation when dropped in the Project Editor
 */
var graphDropTarget = {
  drop: function(props, monitor, component) {
    if (monitor.getItemType() === 'task') {
      var task = JSON.parse(monitor.getItem()["data"]);
      var x = ( monitor.getDifferenceFromInitialOffset().x - (window.innerWidth / 12) ) / component.graph.graphState.zoomLevel;
      var y = ( monitor.getClientOffset().y ) / component.graph.graphState.zoomLevel;
      task.x = x;
      task.y = y;
      props.handleTaskSubmit(task);
    }
    else if (monitor.getItemType() === 'thread') {
      var x = ( monitor.getDifferenceFromInitialOffset().x - (window.innerWidth / 12) ) / component.graph.graphState.zoomLevel;
      var y = ( monitor.getClientOffset().y ) / component.graph.graphState.zoomLevel;
      props.handleThreadSubmit(JSON.parse(monitor.getItem()["data"]), x, y);
    }
    else if (monitor.getItemType() === 'project') {
      var project = monitor.getItem();
      var modalTitle = "Open Project";
      var modalBody = <span>Are you sure you want to open the project (Any current unsaved project changes will be deleted)?</span>;
      var modalCallback = () => {component.graph.deleteGraph(true); props.handleOpenProject(JSON.parse(project["data"])); component.updateSelected(); component.hideModal();};
      var confirmButtonText = "OK";
      component.showModalConfirm(modalTitle, modalBody, modalCallback, confirmButtonText);
    }
    return;
  }
};

/**
 * React DnD collect function, necessary for drag-and-drop behavior
 */
function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
    itemType: monitor.getItemType()
  };
}

/**
 * Component to act as a wrapper for GraphD3, also includes GraphControls and ZoomControls
 * References GraphD3 object in lifecycle callbacks and sends information back to App as needed
 */
var Graph = React.createClass({
  // Initial state has no results and no node/edge selected
  getInitialState: function() {
    return {
      selectedNode: null,
      selectedEdge: null,
      results: [],
      showConfirm: false,
      modalTitle: '',
      modalBody: null,
      modalCallback: null,
      confirmButtonText: ''
    };
  },
  render: function() {
    var isOver = this.props.isOver;
    var canDrop = this.props.canDrop;
    var connectDropTarget = this.props.connectDropTarget;
    return connectDropTarget(
      <div className="col-xs-10 col-md-10">
        <GraphControls
          onRunGraph={this.props.handleRunGraph}
          onExportGraph={this.props.handleExportGraph} 
          onClearGraph={this.props.handleClearGraph}
          onSaveGraph={this.props.handleSaveProject}
          onNewGraph={this.props.handleNewProject}
          onGridToggle={this.handleGridToggle} />
        <ZoomControls 
          onZoom={this.handleZoom} />
        <DetailPanel
          selectedNode={this.state.selectedNode}
          selectedEdge={this.state.selectedEdge}
          handleBreakpoint={this.handleBreakpoint}
          handleTaskUpdate={this.props.handleTaskUpdate}
          generateCurrentThreads={this.props.generateCurrentThreads}
          handleSaveSingleThread={this.props.handleSaveSingleThread}
          handleDeleteSingleThread={this.props.handleDeleteSingleThread}
          logs={this.props.logs}
          results={this.state.results} />
        <ModalConfirm
          show={this.state.showConfirm}
          hideModal={this.hideModal}
          modalTitle={this.state.modalTitle}
          modalBody={this.state.modalBody}
          modalCallback={this.state.modalCallback}
          confirmButtonText={this.state.confirmButtonText}/>
      </div>
    );
  },
  // Creates an instance of GraphD3 when the component mounts
  componentDidMount: function() {
    this.graph = new GraphD3(this.getDOMNode(), this.updateSelected, this.updateAppState, this.getGraphState());
  },
  // Updates the GraphD3 object with new nodes and edges when props change (changes in App state)
  componentDidUpdate: function() {
    this.graph.update(this.getDOMNode(), this.getGraphState());
  },
  // Function for use with GraphD3 to send new nodes/edges
  getGraphState: function() {
    return {
      nodes: this.props.nodes,
      edges: this.props.edges
    }
  },
  // Calls GraphD3.destroy when component unmounts
  componentWillUnmount: function() {
    this.graph.destroy(this.getDOMNode());
  },
  // Function for use with GraphD3 to give a reference to the DOM node (to append svg elements as needed)
  getDOMNode: function() {
    return ReactDOM.findDOMNode(this);
  },
  // Looks at new log messages and checks for results
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.logs !== this.props.logs) {
      var newLogs = nextProps.logs.filter(function(log) { return this.props.logs.indexOf(log) < 0; }.bind(this));
      for (var i = 0; i < newLogs.length; i++) {
        var msg = JSON.parse(newLogs[i]);
        // If results are present in the logging message, add them to the graph edges
        if (msg["body"].hasOwnProperty('results')) {
          if (msg.hasOwnProperty('task-id')) {
            var resultsEdges = this.graph.edges.filter(function(edge) {
              return edge.source.id === msg["task-id"];
            });
            if (resultsEdges.length > 0) {
              for (var j = 0; j < resultsEdges.length; j++) {
                resultsEdges[j].output = JSON.stringify(msg["body"]["results"], undefined, 2);
              }
            } else {
              var results = this.state.results.concat([]);
              results.push({'thread-id': msg["thread-id"], 'result': msg["body"]["results"]});
              this.setState({results: results});
            }
          }
        }
      }
    }
    if (this.state.selectedNode !== null) {
      if (nextProps.nodes.filter(function(node) { return this.state.selectedNode.id === node.id; }.bind(this)).length === 0) {
        this.graph.graphState.selectedNode = null;
        this.setState({selectedNode: null});
      }
    }
    if (this.state.selectedEdge !== null) {
      if (nextProps.edges.filter(function(edge) { return this.state.selectedEdge.source.id === edge.source.id && this.state.selectedEdge.target.id === edge.target.id; }.bind(this)).length === 0) {
        this.graph.graphState.selectedEdge = null;
        this.setState({selectedEdge: null});
      }
    }
  },
  // Updates scaling of graph and updates graph zoomLevel to change drag behavior as needed
  handleZoom: function(zoomLevel) {
    this.graph.svg.attr("transform", "scale(" + zoomLevel + ")");
    this.graph.graphState.zoomLevel = zoomLevel;
  },
  // Callback for Toggle Grid button in GraphControls
  handleGridToggle: function() {
    if (this.graph.graphState.gridLayout) {
      this.graph.graphState.gridLayout = false;
      this.graph.svg.style('background-image', 'none');
      this.graph.svg.style('background-size', '0px 0px');
    } else {
      this.graph.graphState.gridLayout = true;
      this.graph.svg.style('background-image', 'repeating-linear-gradient(0deg,transparent,transparent 24px,#CCC 24px,#CCC 25px),repeating-linear-gradient(-90deg,transparent,transparent 24px,#CCC 24px,#CCC 25px)');
      this.graph.svg.style('background-size', '25px 25px');
    }
  },
  // Syncs selectedNode/Edge in state with d3 graph
  updateSelected: function() {
    this.setState({ selectedNode: this.graph.graphState.selectedNode, selectedEdge: this.graph.graphState.selectedEdge });
  },
  // Callback to update nodes/edge in App from GraphD3
  updateAppState: function() {
    this.props.updateStateCallback(this.graph.nodes, this.graph.edges);
  },
  // Callback for Toggle Breakpoint button in EdgeProperties
  handleBreakpoint: function() {
    this.graph.graphState.selectedEdge.breakpoint = !this.graph.graphState.selectedEdge.breakpoint;
    this.updateSelected();
  },
  showModalConfirm: function(modalTitle, modalBody, modalCallback, confirmButtonText) {
    this.setState({showConfirm: true, modalTitle: modalTitle, modalBody: modalBody, modalCallback: modalCallback, confirmButtonText: confirmButtonText});
  },
  hideModal: function() {
    this.setState({showConfirm: false, modalTitle: '', modalBody: null, modalCallback: null, confirmButtonText: ''});
  }
});

module.exports = DropTarget(['task', 'thread', 'project'], graphDropTarget, collect)(Graph);
