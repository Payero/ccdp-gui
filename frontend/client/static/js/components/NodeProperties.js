/**
 * Component containing layout for selected node properties
 * Allows editing and saving of properties
 */
var NodeProperties = React.createClass({
  // Takes in props as initial state as state will change as edits are made to inputs
  getInitialState: function() {
    return {
      ccdpType: this.props.selectedNode.config["ccdp-type"],
      maxInstances: this.props.selectedNode.config["max-instances"],
      minInstances: this.props.selectedNode.config["min-instances"],
      cpu: this.props.selectedNode.config["cpu"],
      memory: this.props.selectedNode.config["memory"],
      taskProps: JSON.parse(JSON.stringify(this.props.selectedNode.config["task-props"]))
    };
  },
  // When a new node is selected, update state with new props
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.selectedNode !== null && nextProps.selectedNode !== this.props.selectedNode) {
      this.setState({
        ccdpType: nextProps.selectedNode.config["ccdp-type"],
        maxInstances: nextProps.selectedNode.config["max-instances"],
        minInstances: nextProps.selectedNode.config["min-instances"],
        cpu: nextProps.selectedNode.config["cpu"],
        memory: nextProps.selectedNode.config["memory"],
        taskProps: JSON.parse(JSON.stringify(nextProps.selectedNode.config["task-props"]))
      });
    }
  },
  // Updates state with changes to CCDPType input
  handleCCDPTypeChange: function(e) {
    this.setState({ccdpType: e.target.value});
  },
  // Updates state with changes to MaxInstances input
  handleMaxInstancesChange: function(e) {
    this.setState({maxInstances: e.target.value});
  },
  // Updates state with changes to MinInstances input
  handleMinInstancesChange: function(e) {
    this.setState({minInstances: e.target.value});
  },
  // Updates state with changes to CPU input
  handleCPUChange: function(e) {
    this.setState({cpu: e.target.value});
  },
  // Updates state with changes to Memory input
  handleMemoryChange: function(e) {
    this.setState({memory: e.target.value});
  },
  // Updates state with changes to TaskProps input, uses data-key attribute to find which prop to update
  handleTaskPropsChange: function(e) {
    var key = e.target.getAttribute('data-key');
    var taskProps = JSON.parse(JSON.stringify(this.state.taskProps));
    taskProps[key] = e.target.value;
    this.setState({taskProps: taskProps});
  },
  // Handles saving changes to properties, updates the node in App
  onSave: function() {
    var task = JSON.parse(JSON.stringify(this.props.selectedNode))
    task.config["ccdp-type"] = this.state.ccdpType;
    task.config["max-instances"] = this.state.maxInstances;
    task.config["min-instances"] = this.state.minInstances;
    task.config["cpu"] = this.state.cpu;
    task.config["memory"] = this.state.memory;
    task.config["task-props"] = JSON.parse(JSON.stringify(this.state.taskProps));
    this.props.handleTaskUpdate(task);
  },
  // Resets state to values from props
  onCancel: function() {
    this.setState({
      ccdpType: this.props.selectedNode.config["ccdp-type"],
      maxInstances: this.props.selectedNode.config["max-instances"],
      minInstances: this.props.selectedNode.config["min-instances"],
      cpu: this.props.selectedNode.config["cpu"],
      memory: this.props.selectedNode.config["memory"],
      taskProps: JSON.parse(JSON.stringify(this.props.selectedNode.config["task-props"]))
    });
  },
  render: function() {
    var node = this.props.selectedNode;
    var component = this;
    return (
      <div className="NodeProperties">
        <h3>{node.title}</h3>
        <div className="col-md-3">
          <row>
            <label>ID:</label>
            <p>{node.id}</p>
          </row>
          <row>
            <label>Task ID:</label>
            <p>{node.task}</p>
          </row>
          <row>
            <label>Class-Name:</label>
            <p>{node.config["class-name"]}</p>
          </row>
        </div>
        <div className="col-md-3">
          <row>
            <label>CCDP-Type:</label>
            <input type="text" value={this.state.ccdpType} onChange={this.handleCCDPTypeChange} />
          </row>
          <row>
            <label>Max-Instances:</label>
            <input type="text" value={this.state.maxInstances} onChange={this.handleMaxInstancesChange} />
          </row>
          <row>
            <label>Min-Instances:</label>
            <input type="text" value={this.state.minInstances} onChange={this.handleMinInstancesChange} />
          </row>
          <row>
            <label>CPU:</label>
            <input type="text" value={this.state.cpu} onChange={this.handleCPUChange} />
          </row>
          <row>
            <label>Memory(GB):</label>
            <input type="text" value={this.state.memory} onChange={this.handleMemoryChange} />
          </row>
        </div>
        <div className="col-md-3">
        { 
          Object.keys(node.config["task-props"]).map(function(key) {
            return <row key={key}><label>{key}:</label><input type="text" value={component.state.taskProps[key]} onChange={component.handleTaskPropsChange} data-key={key} /></row>;
          })
        }
        </div>
        <div className="col-md-3">
          <row>
            <button type="button" className="btn btn-primary" onClick={this.onSave}>Save</button>
          </row>
          <row>
            <button type="button" className="btn btn-primary" onClick={this.onCancel}>Cancel</button>
          </row>
        </div>
      </div>
    )
  }
});

module.exports = NodeProperties;
