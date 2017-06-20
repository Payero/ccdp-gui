/**
 * TaskForm component to handle uploading tasks (TODO)
 */
var TaskForm = React.createClass({
  getInitialState: function() {
    return {name: '', description: '', moduleId: '', className: ''};
  },
  handleNameChange: function(e) {
    this.setState({name: e.target.value});
  },
  handleDescriptionChange: function(e) {
    this.setState({description: e.target.value});
  },
  handleModuleIdChange: function(e) {
    this.setState({moduleId: e.target.value});
  },
  handleClassNameChange: function(e) {
    this.setState({className: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var name = this.state.name.trim();
    var description = this.state.description.trim();
    var moduleId = this.state.moduleId.trim();
    var className = this.state.className.trim();
    if (!name || !description || !moduleId || !className) {
      return;
    }
    // TODO: file upload & save task info in database
    this.setState({name: '', description: '', moduleId: '', className: ''});
  },
  render: function() {
    return (
      <form className="TaskForm" onSubmit={this.handleSubmit}>
        <div className="form-group">
          <h2 className="text-center">Add Task</h2>
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Name"
            value={this.state.name}
            onChange={this.handleNameChange}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Description"
            value={this.state.description}
            onChange={this.handleDescriptionChange}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Module ID"
            value={this.state.moduleId}
            onChange={this.handleModuleIdChange}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Class Name"
            value={this.state.className}
            onChange={this.handleClassNameChange}
          />
        </div>
        <div className="form-group">
          <input type="submit" value="Upload Task" className="form-control" onSubmit={this.handleSubmit} />
        </div>
      </form>
    );
  }
});

module.exports = TaskForm;
