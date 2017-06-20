/**
 * Component containing layout for selected edge properties
 * Includes the ability to toggle the edge as a breakpoint and send a Continue request to the engine
 * Also displays any results from the edge's source node
 */
var EdgeProperties = React.createClass({
  render: function() {
    return (
      <div className="EdgeProperties">
        <h3>{this.props.selectedEdge.source.title + " -> " + this.props.selectedEdge.target.title}</h3>
        <div className="col-md-4">
          <row>
            <label>Source Task:</label>
            <p>{this.props.selectedEdge.source.task}</p>
          </row>
          <row>
            <label>Source ID:</label>
            <p>{this.props.selectedEdge.source.id}</p>
          </row>
          <row>
            <label>Target Task:</label>
            <p>{this.props.selectedEdge.target.task}</p>
          </row>
          <row>
            <label>Target ID:</label>
            <p>{this.props.selectedEdge.target.id}</p>
          </row>
          <row>
            <label>Breakpoint:</label>
            <p>{JSON.stringify(this.props.selectedEdge.breakpoint)}</p>
          </row>
        </div>
        <div className="col-md-4">
          <row>
            <label>Output:</label>
            <p>{this.props.selectedEdge.output}</p>
          </row>
        </div>
        <div className="col-md-4">
          <row>
            <button type="button" className="btn btn-primary" onClick={this.props.handleBreakpoint}>Toggle Breakpoint</button>
          </row>
          { this.props.selectedEdge.breakpoint === true ? <row><button type="button" className="btn btn-primary" >Continue</button></row> : null } 
        </div>
      </div>
    )
  }
});

module.exports = EdgeProperties;
