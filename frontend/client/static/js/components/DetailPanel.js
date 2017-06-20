var React = require('react');
var PropertiesView = require('./PropertiesView.js');
var LoggingView = require('./LoggingView.js');
var ResultsView = require('./ResultsView.js');
var ThreadsView = require('./ThreadsView.js');
var Nav = require('react-bootstrap').Nav;
var NavItem = require('react-bootstrap').NavItem;
var FontAwesome = require('react-fontawesome');

/**
 * Component containing tabs to toggle between Properties, Logging, Results, and Threads
 * Also allows display to be hidden to give more room in the Project Editor
 */
var DetailPanel = React.createClass({
  // Initial state is display open with the tab set on Properties
  getInitialState: function() {
    return {
      showPanel: true,
      activeKey: "1"
    };
  },
  // Sets active tab to Properties when a new node/edge is selected in the Project Editor
  componentWillReceiveProps: function(nextProps) {
    if ((nextProps.selectedNode !== this.props.selectedNode && nextProps.selectedNode !== null) || (nextProps.selectedEdge !== this.props.selectedEdge && nextProps.selectedEdge !== null)) {
      this.setState({activeKey: "1"});
    }
  },
  // Updates currently selected tab when bootstrap nav is clicked
  handleTabSelect: function(eventKey) {
    this.setState({activeKey: eventKey});
  },
  // Toggles visibility of the display, mapped to terminal icon onClick
  toggleDisplay: function() {
    this.setState({showPanel: !this.state.showPanel});
  },
  render: function() {
    return (
      <div>
        <FontAwesome className="DetailIcon" size="2x" name="terminal" onClick={() => {this.toggleDisplay();}} />
        { this.state.showPanel ?
          <div className="DetailPanel">
            <Nav 
             bsStyle="tabs"
             activeKey={this.state.activeKey}
             onSelect={this.handleTabSelect}>
              <NavItem eventKey="1">
                Properties
              </NavItem>
              <NavItem eventKey="2">
                Logging
              </NavItem>
              <NavItem eventKey="3">
                Results
              </NavItem>
              <NavItem eventKey="4">
                Threads
              </NavItem>
            </Nav>
            { this.state.activeKey === "1" ? 
              <PropertiesView
                selectedNode={this.props.selectedNode}
                selectedEdge={this.props.selectedEdge}
                handleBreakpoint={this.props.handleBreakpoint}
                handleTaskUpdate={this.props.handleTaskUpdate}/> 
              : null }
            { this.state.activeKey === "2" ? 
              <LoggingView 
                logs={this.props.logs}/>
              : null }
            { this.state.activeKey === "3" ? 
              <ResultsView 
                results={this.props.results}/>
              : null }
            { this.state.activeKey === "4" ? 
              <ThreadsView 
                generateCurrentThreads={this.props.generateCurrentThreads}
                handleSaveSingleThread={this.props.handleSaveSingleThread}
                handleDeleteSingleThread={this.props.handleDeleteSingleThread}/>
              : null }
          </div>
        : null }
      </div>
    )
  }
});

module.exports = DetailPanel;
