var Upload = function (file) {
    this.file = file;
};

Upload.prototype.getType = function() {
    return this.file.type;
};
Upload.prototype.getSize = function() {
    return this.file.size;
};
Upload.prototype.getName = function() {
    return this.file.name;
};
Upload.prototype.doUpload = function () {
    var that = this;
    var formData = new FormData();

    // add assoc key values, this will be posts values
    formData.append("file", this.file, this.getName());
    formData.append("upload_file", true);

    $.ajax({
        type: "POST",
        url: "script", //make endpoint in flash server to receive file
        xhr: function () {
            var myXhr = $.ajaxSettings.xhr();
            return myXhr;
        },
        success: function (data) {
          console.log("uploaded " + data)
        },
        error: function (error) {
          console.log("file upload error " + error)
        },
        async: true,
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        timeout: 60000
    });
};

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
      // return;
    }

    var file = e.target.files[0];
    var upload = new Upload(file);

    // maby check size or type here with upload.getSize() and upload.getType()

    // execute upload
    upload.doUpload();
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
          <input type="file" name="upload_file" id = "upload_file" value="" className="form-control"onChange={this.handleSubmit} />
        </div>
      </form>
    );
  }
});

$("#upload_file").on("change", function (e) {
    console.log("click")
});

module.exports = TaskForm;
