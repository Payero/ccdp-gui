var NodeProperties = require('./NodeProperties.js');
var EdgeProperties = require('./EdgeProperties.js');
var Scrollbars = require('react-custom-scrollbars').Scrollbars;

/**
 * Component to act as a wrapper for Node and Edge Properties
 * Displays child component based on whether a node or edge is selected
 */
var PropertiesView = React.createClass({
  render: function() {
    return (
      <div className="PropertiesView">
        <Scrollbars style={{ height: '100%'}} autoHide={ true } hideTracksWhenNotNeeded={ true }>
        { this.props.selectedNode === null ? null :
          <NodeProperties selectedNode={this.props.selectedNode} handleTaskUpdate={this.props.handleTaskUpdate} />
        }        
        { this.props.selectedEdge === null ? null :
          <EdgeProperties selectedEdge={this.props.selectedEdge} handleBreakpoint={this.props.handleBreakpoint} />
        }
        { this.props.selectedEdge === null && this.props.selectedNode === null ?
          <div className="col-md-12">
            <p>No task or edge selected - click on a task or edge in the Project Editor to view and edit its properties</p>
          </div>
        : null }
        </Scrollbars>
      </div>
    )
  }
});

module.exports = PropertiesView;
