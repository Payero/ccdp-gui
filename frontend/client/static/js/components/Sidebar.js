var Collapse = require('rc-collapse');
var Panel = Collapse.Panel;
var TaskForm = require('./TaskForm.js');
var FontAwesome = require('react-fontawesome');
var Task = require('./Task.js');
var Thread = require('./Thread.js');
var Project = require('./Project.js');
var TaskContextMenu = require('./TaskContextMenu.js');
var ThreadContextMenu = require('./ThreadContextMenu.js');
var ProjectContextMenu = require('./ProjectContextMenu.js');
var Scrollbars = require('react-custom-scrollbars').Scrollbars;
import SearchInput, {createFilter} from 'react-search-input';

const KEYS_TO_FILTERS = ['name'];

/**
 * Sidebar contains React Collapse components with headers for each category
 * - Tasks: Contains draggable tasks for dropping on Project Editor, divided by Reader/Processor/Writer type
 * - Threads: Contains draggable threads for dropping on Project Editor
 * - Projects: Contains draggable projects for dropping on Project Editor
 * - Add Tasks: Contains TaskForm for uploading tasks (TODO)
 * - About: Contains overview information about CCDP (TODO)
 * - Help: Contains information about controls and using the CCDP webapp
 * - Contact Us: Contains information on how to contact CCDP members (TODO)
 */
var Sidebar = React.createClass({
  // Initial state has emoty search terms
  getInitialState: function() {
    return {
      taskSearchTerm: '',
      threadSearchTerm: '',
      projectSearchTerm: ''
    };
  },
  // Updates task search term when input is edited
  taskSearchUpdated: function(term) {
    this.setState({taskSearchTerm: term});
  },
  // Updates thread search term when input is edited
  threadSearchUpdated: function(term) {
    this.setState({threadSearchTerm: term});
  },
  // Updates project search term when input is edited
  projectSearchUpdated: function(term) {
    this.setState({projectSearchTerm: term});
  },
  handleUploadFile: function(e) {
    var file = e.target.files[0];
    this.props.handleSaveTask(file);
  },
  // Tasks/Threads/Projects filtered using React Search Input
  render: function() {
    var tasks = this.props.tasks;
    var threads = this.props.threads;
    var projects = this.props.projects;
    const filteredTasks = tasks.filter(createFilter(this.state.taskSearchTerm, KEYS_TO_FILTERS));
    const filteredThreads = threads.filter(createFilter(this.state.threadSearchTerm, KEYS_TO_FILTERS));
    const filteredProjects = projects.filter(createFilter(this.state.projectSearchTerm, KEYS_TO_FILTERS));
    return (
      <div className="col-xs-2 col-md-2" style={{ height: '100vh' }}>
        <Scrollbars style={{ height: '100%'}} autoHide={ true } hideTracksWhenNotNeeded={ true }>
        <h4 className="text-center">Cloud Computing Data Processing</h4>
        <Collapse>
          <Panel header={<FontAwesome name="cube"> Tasks</FontAwesome>} key="1">
            <SearchInput className="search-input" onChange={this.taskSearchUpdated} />
            <Collapse>
              <Panel header={<FontAwesome name="book"> Readers</FontAwesome>} key="1">
                {filteredTasks.map(task => {
                  return (
                    ( task.type === "reader" ? <Task name={task.name} description={task.description} data={task.data} type={task.type} key={task.name} /> : null )
                  )
                })}
              </Panel>
              <Panel header={<FontAwesome name="cogs"> Processors</FontAwesome>} key="2">
                {filteredTasks.map(task => {
                  return (
                    ( task.type === "processor" ? <Task name={task.name} description={task.description} data={task.data} type={task.type} key={task.name} /> : null )
                  )
                })}
              </Panel>
              <Panel header={<FontAwesome name="pencil"> Writers</FontAwesome>} key="3">
                {filteredTasks.map(task => {
                  return (
                    ( task.type === "writer" ? <Task name={task.name} description={task.description} data={task.data} type={task.type} key={task.name} /> : null )
                  )
                })}
              </Panel>
            </Collapse>
          </Panel>
          <Panel header={<FontAwesome name="cubes"> Threads</FontAwesome>} key="2">
            <SearchInput className="search-input" onChange={this.threadSearchUpdated} />
            {filteredThreads.map(thread => {
              return (
                <Thread name={thread.name} description={thread.description} data={thread.data} key={thread.name} />
              )
            })}
          </Panel>
          <Panel header={<FontAwesome name="folder-open-o"> Projects</FontAwesome>} key="3">
            <SearchInput className="search-input" onChange={this.projectSearchUpdated} />
            {filteredProjects.map(project => {
              return (
                <Project name={project.name} description={project.description} data={project.data} key={project.name} />
              )
            })}
          </Panel>
          <Panel header={<FontAwesome name="plus"> Add Task</FontAwesome>} key="4">
            <TaskForm/>
          </Panel>
          <Panel header={<FontAwesome name="plus"> Add Task (JSON File)</FontAwesome>} key="5">
            <div>
              <input type="file" id="upload_file" style={{display: "none"}} onChange={this.handleUploadFile} />
              <input type="button" value="Choose JSON File" onClick={() => {$("#upload_file").trigger('click')}} />
            </div>
          </Panel>
          <Panel header={<FontAwesome name="info-circle"> About</FontAwesome>} key="6">
            About
          </Panel>
          <Panel header={<FontAwesome name="question-circle"> Help</FontAwesome>} key="7">
            <h4 style={{ backgroundColor: '#f4f4f4'}}>Project Editor</h4>
            <div>
              <label>Basic Controls</label>
              <p>Drag tasks from the sidebar to add them to the project editor panel. Hold the shift key and drag the cursor from a task to link two tasks together. The task at the beginning of the drag will be the source (input) to the target (output) task. Linking tasks together will pipe output from one task as input to another, creating a thread of tasks. A project can contain multiple threads, and each thread can contain multiple tasks. Therefore, in terms of complexity the data structures can be though of as Project > Thread > Task.</p>
              <p>Clicking on a task or edge will highlight it, indicating that it has been selected. To remove a task or edge, first select it then press the delete or backspace key. Selecting a task or edge will also display details about its properties in the bottom Detail Panel which will be described in further detail below.</p>
            </div>
            <h4 style={{ backgroundColor: '#f4f4f4'}}>Detail Panel</h4>
            <div>
              <label>Properties Tab</label>
              <p>Displays the properties of the current selected task or edge. Tasks will allow their properties to be edited, and changes to these can be reset to the last saved set of properties by using the Cancel button. The Save button will save the properties so that unselecting the task or using the Cancel button will not undo edits to the properties. NOTE: changes properties that have not been saved will not appear in the JSON sent in an engine request.</p>
              <p>Edges will display basic identifying information about the source and target tasks as well as results that may have been reported for running the source task. The Toggle Breakpoint button will add an edge as a breakpoint if it is currently not one and vice versa. Breakpoints will be highlighted in red and function similarly to a stopped thread. To continue thread execution at a breakpoint, use the Continue button displayed in the Properties Tab for the selected breakpoint edge.</p>
              <label>Logging Tab</label>
              <p>Displays a logging component that will display messages received from the engine. All information reported back, including any errors, informational messages, and results will be displayed. The logging component offers various filtering tools to search for messages given specific queries.</p>
              <label>Results Tab</label>
              <p>Displays the results of each thread that has been sent to the engine in a run request. Intermediate results from individual tasks can be viewed in by selecting the corresponding edge in the Properties tab.</p>
              <label>Threads Tab</label>
              <p>Displays the current threads present in the project. Thread details consist of the list of tasks along with their ids in parentheses. The Save button will prompt for a name and description for the thread and will save it to the database. Saved threads can be found in the sidebar and dragged into the Project Editor to reuse them. The Delete button will remove the thread from the project.</p>
              <label>Toggle Button</label>
              <p>The terminal icon to the left of the Detail Panel will toggle the panel to be displayed or hidden when clicked.</p>
            </div>
            <h4 style={{ backgroundColor: '#f4f4f4'}}>Project Controls</h4>
            <div>
              <label>Run</label>
              <p>Generates a JSON representation of the current open project and sends it as a request to the engine for processing. Output from the engine will be displayed in the Logging tab of the Detail Panel, results from each thread will appear in the Results tab, and tasks in the Project Editor will have their clor updated according to their status (SUCCESS: Green, RUNNING: Yellow, PAUSED: Orange, FAILED: Red).</p>
              <label>Pause</label>
              <p>Sends a request to the engine to pause all currently running threads in the project. If a task can be paused in the middle of execution, it will be highlighted orange. Otherwise, tasks will finish and the next task will wait to start.</p>
              <label>Stop</label>
              <p>Sends a request to the engine to stop all currently running threads in the project.</p>
              <label>Export</label>
              <p>Exports the JSON representation of the current open project as text. This is the same JSON that will be sent in a Run request, making it useful for debugging errors.</p>
              <label>Clear</label>
              <p>Removes all tasks and edges from the current project. This behavior is fundamentally different from New Project in that it will keep the same project open. Saving after a Clear will result in the project being overwritten with an empty project, however the operation can be undone using the keyboard shortcut Ctrl+Z.</p>
              <label>Save Project</label>
              <p>Save the current open project. This will write the current project to the database, writing over any existing project with the same name.</p>
              <label>New Project</label>
              <p>Opens an empty project. This will overwrite any changes that have not been saved for the current project that is open, so a confirmation prompt is displayed before opening a new project.</p>
              <label>Toggle Grid</label>
              <p>Toggles the grid overlay for the Project Editor. When the grid is displayed, dragging tasks will snap them to a 25x25 grid, whereas turning off the grid will result in the default smooth drag behavior.</p>
            </div>
            <h4 style={{ backgroundColor: '#f4f4f4'}}>Zoom Controls</h4>
            <div>
              <p>The zoom controls in the bottom right corner of the Project Editor control the current zoom level of the editor. Zoom in and out by using the left and right buttons respectively, and use the center button to reset the zoom level to the default.</p>
            </div>
            <h4 style={{ backgroundColor: '#f4f4f4'}}>Keybindings</h4>
            <div>
              <label>Ctrl+Shift+Enter</label>
              <p>Generates a JSON representation of the current project and sends a Run request to the engine</p>
              <label>Ctrl+S</label>
              <p>Save the current open project</p>
              <label>Ctrl+Shift+S</label>
              <p>Save As for the current open project</p>
              <label>Ctrl+Z</label>
              <p>Undo the last deletion/addition operation for tasks, edges, and projects</p>
              <label>Ctrl+Y</label>
              <p>Redo the last deletion/addition operation for tasks, edges, and projects</p>
            </div>
          </Panel>
          <Panel header={<FontAwesome name="life-ring"> Contact Us</FontAwesome>} key="8">
            Contact
          </Panel>
        </Collapse>
        <TaskContextMenu />
        <ThreadContextMenu handleDeleteThread={this.props.handleDeleteThread} />
        <ProjectContextMenu handleDeleteProject={this.props.handleDeleteProject} />
        </Scrollbars>
      </div>
    );
  }
});

module.exports = Sidebar;
