var Sidebar = require('./Sidebar.js');
var Graph = require('./Graph.js');
var React = require('react');
var ReactDOM = require('react-dom');
var DragDropContext = require('react-dnd').DragDropContext;
var HTML5Backend = require('react-dnd-html5-backend');
var Keybinding = require('react-keybinding');
var NotificationContainer = require('react-notifications').NotificationContainer;
var NotificationManager = require('react-notifications').NotificationManager;
var ModalPrompt = require('./ModalPrompt.js');
var io=require('socket.io-client')
const uuidv4 = require('uuid/v4')

//This generates the session id for the client
var sid = uuidv4();

/**
 * Top level components for React application, manages all computations involving top level state
 * Some computational functionality is moved down to Graph, however all ajax and node/edge logic present in App
 */
var App = React.createClass({
  // react-keybinding mixin, define keybindings and map them in the keybinding callback
  mixins: [Keybinding],
  keybindings: {
    'ctrl+s': 'SAVE',
    'ctrl+shift+s': 'SAVE AS',
    'ctrl+z': 'UNDO',
    'ctrl+y': 'REDO',
    'ctrl+shift+enter': 'RUN'
  },
  keybinding: function(event, action) {
    switch (action) {
      case 'SAVE': this.handleSaveProject(false); break;
      case 'SAVE AS': this.handleSaveProject(true); break;
      case 'UNDO': this.handleUndo(); break;
      case 'REDO': this.handleRedo(); break;
      case 'RUN': this.handleRunGraph(); break;
      case 'STOP': this.handleStopGraph(); break;
    }
    event.preventDefault();
  },


  // Stacks used for undo/redo functionality, separated from state to avoid performance issues
  undoStacks: {
    undo: [],
    redo: []
  },
  // Ctrl+Z keybinding, pop old state and push current state onto redo
  handleUndo: function() {
    if (this.state.isRunning) {
      NotificationManager.info("Project is currently running - stop the project or wait for it to finish before editing");
      return;
    }
    if (this.undoStacks.undo.length > 0) {
      var oldState = this.undoStacks.undo.pop();
      var currentState = this.state;
      this.undoStacks.redo.push(currentState);
      this.setState(oldState);
    } else {
      NotificationManager.info("No changes to undo");
    }
  },
  // Ctrl+Y keybinding, pop new state and push current state onto undo
  handleRedo: function() {
    if (this.state.isRunning) {
      NotificationManager.info("Project is currently running - stop the project or wait for it to finish before editing");
      return;
    }
    if (this.undoStacks.redo.length > 0) {
      var newState = this.undoStacks.redo.pop();
      var oldState = this.state;
      this.undoStacks.undo.push(oldState);
      this.setState(newState);
    } else {
      NotificationManager.info("No changes to redo");
    }
  },
  showModalPrompt: function(modalTitle, modalBody, modalCallback, confirmButtonText) {
    this.setState({showPrompt: true, modalTitle: modalTitle, modalBody: modalBody, modalCallback: modalCallback, confirmButtonText: confirmButtonText});
  },
  hideModal: function() {
    this.setState({showPrompt: false, modalTitle: '', modalBody: null, modalCallback: null, confirmButtonText: ''});
  },
  // Receives inital props from main.js as seed data
  getInitialState: function() {
    return {
      nodes: this.props.initialNodes,
      edges: this.props.initialEdges,
      idct: this.props.initialIdct,
      idctThread: this.props.initialIdctThread,
      tasks: [],
      threads: [],
      projects: [],
      currentProjectName: this.props.initialProjectName,
      currentProjectDescription: this.props.initialProjectDescription,
      logs: [],
      currentThreadIds: [],
      isRunning: false,
      showPrompt: false,
      modalTitle: '',
      modalBody: null,
      modalCallback: null,
      confirmButtonText: ''
    };
  },
  // Updates tasks, threads, and projects in state to populate sidebar, also connects to rmq using SockJS
  componentDidMount: function() {
    this.updateTasks();
    this.updateThreads();
    this.updateProjects();

    //Creates a socketio object which by default connects to the current domain
    var socket = io.connect();

    //Logs when the console has connected succesfully
    socket.on('connect', function() {
        console.log('WebSocket connection has been established');

    });

    // Handler to receive task update messages from the server
    socket.on('message', function(data){
        // Console logs to allow inspection of update messages
        console.log('Message has been received');
        //console.log(typeof(data))
        console.log(JSON.parse(data));

        // Once we receive a message need to check which task it belongs to and update the state
        var logs = this.state.logs.concat([]);
        var nodes = this.state.nodes.concat([]);
        var currentThreadIds = this.state.currentThreadIds.concat([]);
        logs.push(data);
        var msg = JSON.parse(data)['data']['task'];
        if (msg['state'] === 'STOPPED') {
          currentThreadIds.splice(currentThreadIds.indexOf(msg['thread-id']), 1);
        }
        if (currentThreadIds.length === 0) {
          this.setState({ isRunning: false });
        }
        // Set task status
        if (msg.hasOwnProperty('task-id')) {
          var node = nodes.filter(function(node) {return node.id == msg['task-id']; })[0];
          //console.log(node)
          if (msg["state"] === "RUNNING") {
            //console.log("task is running")
            node.status = "RUNNING";
          }
          else if (msg["state"] === "SUCCESSFUL") {
            //console.log("task is finished")
            node.status = "SUCCESS";
          }
        }
        //this.setState({ nodes: nodes, logs: logs, currentThreadIds: currentThreadIds });
        this.setState({ nodes: nodes });
        //this.setState({ logs: logs });
        this.setState({ currentThreadIds: currentThreadIds });
    }.bind(this));
  },

  // Updates array of tasks to be rendered in Sidebar.js as draggable divs
  updateTasks: function() {
    var tasks = [];
    var port   = location.port;
    var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
    // Tasks
    var request = $.ajax({
      url: apiURL + 'modules',
      type: 'GET',
      dataType: 'json'
    });
    request.done(function(msg) {
      // Add tasks to array following proper format
      for (var i = 0; i < msg.length; i++) {
        tasks.push({ name: msg[i].name, description: msg[i].short_description, type: msg[i].module_type.toLowerCase(), data: JSON.stringify(msg[i]), command: msg[i].command });
      }
      this.setState({tasks: tasks});
    }.bind(this));
    request.fail(function(jqXHR, textStatus) {
      NotificationManager.error("Could not load Tasks - Request failed: " + textStatus);
    });
  },
  // Updates array of threads to be rendered in Sidebar.js as draggable divs
  updateThreads: function() {
    var threads = [];
    var port   = location.port;
    var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
    // Threads
    var request = $.ajax({
      url: apiURL + 'threads',
      type: 'GET',
      dataType: 'json'
    });
    request.done(function(msg) {
      // Add threads to array following proper format
      for (var i = 0; i < msg.length; i++) {
        threads.push({ name: msg[i].name, description: msg[i]['short-description'], data: JSON.stringify(msg[i]) });
      }
      this.setState({threads: threads});
    }.bind(this));
    request.fail(function(jqXHR, textStatus) {
      NotificationManager.error("Could not load Threads - Request failed: " + textStatus);
    });
  },
  // Updates array of projects to be rendered in Sidebar.js as draggable divs
  updateProjects: function() {
    var projects = [];
    var port   = location.port;
    var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
    // Projects
    var request = $.ajax({
      url: apiURL + 'projects',
      type: 'GET',
      dataType: 'json'
    });
    request.done(function(msg) {
      // Add projects to array following proper format
      for (var i = 0; i < msg.length; i++) {
        projects.push({ name: msg[i].name, description: msg[i]['description'], data: JSON.stringify(msg[i]) });
      }
      this.setState({projects: projects});
    }.bind(this));
    request.fail(function(jqXHR, textStatus) {
      NotificationManager.error("Could not load Projects - Request failed: " + textStatus);
    });
  },
  // Open modal for Ctrl+S and Ctrl+Shift+S keybindings to record projectName and projectDescription
  handleSaveProject: function(saveAs) {
    var projectName = '';
    var projectDescription = '';
    if (saveAs) {
      // Prompt user for name and description regardless of current project being opened or not
      var modalTitle = "Save Project";
      var modalBody = ( <div>
                          <p>Enter a name and description to save the current project</p>
                          <p>Note: Saving a project with the same name as another will overwrite it in the database, project name cannot be empty or whitespace</p>
                        </div> );
      var modalCallback = (projectName, projectDescription) => {
                            if (!(projectName.length === 0 || !projectName.trim())) {
                              this.handleSaveProjectToSidebar(projectName, projectDescription);
                              this.hideModal();
                            } else {
                              NotificationManager.error("ERROR - Project name cannot be empty or whitespace");
                            }
                          };
      var confirmButtonText = "Save";
      this.showModalPrompt(modalTitle, modalBody, modalCallback, confirmButtonText);
    } else {
      // Check if a project is currently open, if it is overwrite it, if not it has same functionality as Save As
      if (this.state.currentProjectName !== null) {
        projectName = this.state.currentProjectName;
        projectDescription = this.state.currentProjectDescription;
        this.handleSaveProjectToSidebar(projectName, projectDescription);
      } else {
        var modalTitle = "Save Project";
        var modalBody = ( <div>
                            <p>Enter a name and description to save the current project</p>
                            <p>Note: Saving a project with the same name as another will overwrite it in the database, project name cannot be empty or whitespace</p>
                          </div> );
        var modalCallback = (projectName, projectDescription) => {
                              if (!(projectName.length === 0 || !projectName.trim())) {
                                this.handleSaveProjectToSidebar(projectName, projectDescription);
                                this.hideModal();
                              } else {
                                NotificationManager.error("ERROR - Project name cannot be empty or whitespace");
                              }
                            };
        var confirmButtonText = "Save";
        this.showModalPrompt(modalTitle, modalBody, modalCallback, confirmButtonText);
      }
    }
  },
  // Sends POST to endpoint to save Project to database
  handleSaveProjectToSidebar: function(projectName, projectDescription) {
    var project = {
      'name': projectName,
      'description': projectDescription,
      'nodes': this.state.nodes,
      'edges': this.state.edges,
      'idct': this.state.idct,
      'idctThread': this.state.idctThread
    };
    var projectJSON = JSON.stringify(project);
    this.setState({currentProjectName: projectName, currentProjectDescription: projectDescription});

    var port   = location.port;
    var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
    var request = $.ajax({
      url: apiURL + 'projects/save',
      type: 'POST',
      contentType: 'application/json',
      data: projectJSON,
      dataType: 'json'
    });
    request.done(function(msg) {
      NotificationManager.success("Successfully saved project");
      this.updateProjects();
    }.bind(this))
    request.fail(function(jqXHR, textStatus) {
      NotificationManager.error("Request failed: " + textStatus);
    });
  },
  // Sends a DELETE to endpoint with the param projectName
  handleDeleteProjectFromSidebar: function(projectName) {
    var port   = location.port;
    var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
    var request = $.ajax({
      url: apiURL + 'projects/delete/' + projectName,
      type: 'DELETE'
    });
    request.done(function(msg) {
      NotificationManager.success("Project successfully deleted from the database");
      this.updateProjects();
    }.bind(this));
    request.fail(function(jqXHR, textStatus) {
      NotificationManager.error("Request failed: " + textStatus);
    });
  },
  // Sends a POST to endpoint with param threadJSON as data
  handleSaveThread: function(threadJSON) {
    var port   = location.port;
    var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
    var request = $.ajax({
      url: apiURL + 'threads/save',
      type: 'POST',
      contentType: 'application/json',
      data: threadJSON,
      dataType: 'json'
    });
    request.done(function(msg) {
      // do something with the `msg` returned
      NotificationManager.success("Thread saved");
      this.updateThreads();
    }.bind(this))
    request.fail(function(jqXHR, textStatus) {
      NotificationManager.error("Request failed: " + textStatus);
    });
  },
  // Sends a POST to endpoint with param taskJSON as data
  handleSaveTask: function(taskFile) {
    console.log("Save task file " + taskFile.name)
    var formData = new FormData();
    formData.append("file", taskFile, taskFile.name);
    formData.append("upload_file", true);
    var port   = location.port;
    var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
    var request = $.ajax({
      url: apiURL + 'modules/save',
      type: 'POST',
      async: true,
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      timeout: 60000
    });
    request.done(function(msg) {
      NotificationManager.success("Task saved");
      this.updateThreads();
    }.bind(this))
    request.fail(function(jqXHR, textStatus) {
      var message = textStatus;
      if (jqXHR.responseText && jqXHR.responseText['message']) {
        message = jqXHR.responseText['message'];
      } else if (jqXHR.responseJSON && jqXHR.responseJSON['message']) {
        message = jqXHR.responseJSON['message'];
      }
      NotificationManager.error("Request failed: " + message);
    });
  },
  // Removes all edges and nodes in a specific thread from the Project Editor
  handleDeleteThreadFromGraph: function(thread) {
    if (this.state.isRunning) {
      NotificationManager.info("Project is currently running - stop the project or wait for it to finish before editing");
      return;
    }
    // Undo/redo functionality, clear out redo and push state to undo stack
    this.undoStacks.undo.push(this.state);
    this.undoStacks.redo = [];
    // Make a copy of current state, remove edges/nodes and use setState to avoid mutating state directly
    var nodes = this.state.nodes.concat([]);
    var edges = this.state.edges.concat([]);
    for (var i = 0; i < thread.nodes.length; i++) {
      nodes.splice(nodes.indexOf(thread.nodes[i]), 1);
    }
    for (var j = 0; j < thread.edges.length; j++) {
      edges.splice(edges.indexOf(thread.edges[j]), 1);
    }
    this.setState({ nodes: nodes, edges: edges });
  },
  // Sends a DELETE to the endpoint, removes thread from Sidebar
  handleDeleteThreadFromSidebar: function(threadName) {
    var port   = location.port;
    var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
    var request = $.ajax({
      url: apiURL + 'threads/delete/' + threadName,
      type: 'DELETE'
    });
    request.done(function(msg) {
      NotificationManager.success("Thread successfully deleted from the database");
      this.updateThreads();
    }.bind(this));
    request.fail(function(jqXHR, textStatus) {
      NotificationManager.error("Request failed: " + textStatus);
    });
  },
  // Callback for dropping a task from the Sidebar onto the Project Editor
  handleTaskSubmit: function(task) {
    if (this.state.isRunning) {
      NotificationManager.info("Project is currently running - stop the project or wait for it to finish before editing");
      return;
    }
    // Undo/redo functionality
    this.undoStacks.undo.push(this.state);
    this.undoStacks.redo = [];
    var id = this.state.idct + 1;
    var nodes = this.state.nodes;
    var newTask = {
      "id": id,
      "x": task['x'],
      "y": task['y'],
      "status": "",
      "title": task['name'],
      "task": task['module_id'],
      "config": {
        "command": task['command'],
        "class-name": task['class_name'],
        "ccdp-type": task['ccdp_type'],
        "max-instances": task['max_instances'],
        "min-instances": task['min_instances'],
        "cpu": task['cpu'],
        "memory": task['memory'],
        "task-props": task['configuration'],
        "tasks-running-mode": task['tasks-running-mode'],
        "use-single-node": task['use-single-node']
      }
    };
    var newNodes = nodes.concat([newTask]);
    this.setState({nodes: newNodes, idct: id});
    localStorage.setItem('nodes', JSON.stringify(newNodes));
    localStorage.setItem('idct', id);
  },
  // Callback for updating task properties in DetailView (NodeProperties)
  handleTaskUpdate: function(task) {
    if (this.state.isRunning) {
      NotificationManager.info("Project is currently running - stop the project or wait for it to finish before editing");
      return;
    }
    var nodes = this.state.nodes.concat([]);
    var edges = this.state.edges.concat([]);
    for (var i = 0; i < nodes.length; i++) {
      if (task.id === nodes[i].id) {
        nodes[i] = task;
        break;
      }
    }
    for (var j = 0; j < edges.length; j++) {
      if (edges[j].source.id === nodes[i].id) {
        edges[j].source = nodes[i];
      }
      else if (edges[j].target.id === nodes[i].id) {
        edges[j].target = nodes[i];
      }
    }
    this.setState({nodes: nodes, edges: edges});
    localStorage.setItem('nodes', JSON.stringify(nodes));
    localStorage.setItem('edges', JSON.stringify(edges));
  },
  // Callback for dropping a thread from Sidebar in the Project Editor
  handleThreadSubmit: function(thread, xDrop, yDrop) {
    if (this.state.isRunning) {
      NotificationManager.info("Project is currently running - stop the project or wait for it to finish before editing");
      return;
    }
    // Undo/redo functionality, clear out redo and push state to undo stack
    this.undoStacks.undo.push(this.state);
    this.undoStacks.redo = [];
    var x = xDrop;
    var y = yDrop;
    var id = this.state.idct + 1;
    var nodes = this.state.nodes;
    var newNodes = [];
    var edges = this.state.edges;
    var newEdges = [];
    var tasks = thread["tasks"];
    for (var i = 0; i < tasks.length; i++) {
      var config = {
        "class-name": tasks[i]['class-name'],
        "ccdp-type": tasks[i]['ccdp-type'],
        "max-instances": tasks[i]['max-instances'],
        "min-instances": tasks[i]['min-instances'],
        "cpu": tasks[i]['cpu'],
        "memory": tasks[i]['memory'],
        "task-props": tasks[i]['configuration'],
        "tasks-running-mode": tasks[i]['tasks-running-mode'],
        "use-single-node": tasks[i]['use-single-node']
      };
      newNodes.push({id: id, x: x, y: y, status: "", task: tasks[i]['module-id'], title: tasks[i]['name'], config: config});
      tasks[i].id = id;
      x += 200;
      if (i % 2 == 0) { y += 200; }
      else {y -= 200; }
      if (i < tasks.length - 1) { id += 1; }
    }
    for (var i = 0; i < tasks.length; i++) {
      for (var j = 0; j < tasks[i]["output-ports"].length; j++) {
        for (var k = 0; k < tasks.length; k++) {
          for (var l = 0; l < tasks[k]["input-ports"].length; l++) {
            if (tasks[i]["output-ports"][j]["port-id"] === tasks[k]["input-ports"][l]["from"]) {
              var sourceNode = newNodes.filter(function(node) { return tasks[i].id === node.id; })[0];
              var targetNode = newNodes.filter(function(node) { return tasks[k].id === node.id; })[0];
              newEdges.push({source: sourceNode, target: targetNode, breakpoint: false, output: "No output"});
            }
          }
        }
      }
    }
    this.setState({nodes: nodes.concat(newNodes), edges: edges.concat(newEdges), idct: id});
    localStorage.setItem('nodes', JSON.stringify(nodes.concat(newNodes)));
    localStorage.setItem('edges', JSON.stringify(edges.concat(newEdges)));
    localStorage.setItem('idct', id);
  },
  // Callback for dropping a project from Sidebar in the Project Editor
  handleOpenProject: function(project) {
    if (this.state.isRunning) {
      NotificationManager.info("Project is currently running - stop the project or wait for it to finish before editing");
      return;
    }
    // Undo/redo functionality, clear out redo and push state to undo stack
    this.undoStacks.undo.push(this.state);
    this.undoStacks.redo = [];
    var nodes = project['nodes'];
    var edges = project['edges'];
    var idct = project['idct'];
    var idctThread = project['idctThread'];
    var projectName = project['name'];
    var projectDescription = project['description']
    // Set edges to point to node objects (not a new object from JSON.parse)
    for (var i = 0; i < edges.length; i++) {
      for (var j = 0; j < nodes.length; j++) {
        if (edges[i]["source"]["id"] === nodes[j]["id"]) {
          edges[i]["source"] = nodes[j];
        }
        if (edges[i]["target"]["id"] === nodes[j]["id"]) {
          edges[i]["target"] = nodes[j];
        }
      }
    }
    this.setState({
      nodes: nodes,
      edges: edges,
      idct: idct,
      idctThread: idctThread,
      currentProjectName: projectName,
      currentProjectDescription: projectDescription
    });
    localStorage.setItem('nodes', JSON.stringify(nodes));
    localStorage.setItem('edges', JSON.stringify(edges));
    localStorage.setItem('idct', JSON.stringify(idct));
    localStorage.setItem('idctThread', JSON.stringify(idctThread));
    localStorage.setItem('currentProjectName', JSON.stringify(projectName));
    localStorage.setItem('currentProjectDescription', JSON.stringify(projectDescription));
  },
  // Callback for New Project button in GraphControls
  handleNewProject: function() {
    if (this.state.isRunning) {
      NotificationManager.info("Project is currently running - stop the project or wait for it to finish before editing");
      return;
    }
    // Undo/redo functionality, clear out redo and push state to undo stack
    this.undoStacks.undo.push(this.state);
    this.undoStacks.redo = [];
    var nodes = [];
    var edges = [];
    var idct = 0;
    var idctThread = 0;
    var projectName = null;
    var projectDescription = null;
    // Set current state to that of an empty graph
    this.setState({
      nodes: nodes,
      edges: edges,
      idct: idct,
      idctThread: idctThread,
      currentProjectName: projectName,
      currentProjectDescription: projectDescription
    });
    // Set local storage for empty project
    localStorage.setItem('nodes', JSON.stringify(nodes));
    localStorage.setItem('edges', JSON.stringify(edges));
    localStorage.setItem('idct', JSON.stringify(idct));
    localStorage.setItem('idctThread', JSON.stringify(idctThread));
    localStorage.setItem('currentProjectName', JSON.stringify(projectName));
    localStorage.setItem('currentProjectDescription', JSON.stringify(projectDescription));
  },
  // Sends a POST to the endpoint with project JSON, messages received back from engine are handled with SockJS
  handleRunGraph: function() {
    if (this.state.isRunning) {
      NotificationManager.info("Project is already running");
      return;
    }
    var port   = location.port;
    var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
    var generatedJSON = this.generateJSONRun();
    if (generatedJSON == null) {
      return;
    }
    if ($.isEmptyObject(generatedJSON)) {
        NotificationManager.info("No JSON generated - no workflow thread defined");
        return;
    }
    for (var k = 0; k < generatedJSON["threads"].length; k++) {
      var req = {
        "type": "REQUEST",
        "thread-id": "",
        "task-id": "",
        "action": "RUN",
        "body": generatedJSON["threads"][k]
      }
      var request = $.ajax({
          url: apiURL + 'run',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(req),
          dataType: 'json'
      });
      request.done(function(msg) {
          // do something with the `msg` returned
          NotificationManager.success("Successfully sent a Run request to the engine");
          var nodes = this.state.nodes.concat([]);
          for (var i = 0; i < nodes.length; i++) {
            nodes[i].status = "";
          }
          var edges = this.state.edges.concat([]);
          for (var j = 0; j < edges.length; j++) {
            edges[j].output = "No output";
          }
          this.setState({ nodes: nodes, edges: edges, isRunning: true });
      }.bind(this))
      request.fail(function(jqXHR, textStatus) {
          NotificationManager.error("Request failed: " + textStatus);
      });
    }
  },
  // Stops state so we don't have to manually refresh
  handleStopGraph: function() {
    if (this.state.isRunning) {
        NotificationManager.success("Successfully stopped the project");
        this.setState({ isRunning: false });
    }
  },
  // Callback for Export Graph button in GraphControls
  handleExportGraph: function() {
    //var generatedJSON = this.generateJSONExport();
    var generatedJSON = this.generateJSONRun();
    if ($.isEmptyObject(generatedJSON)) {
        NotificationManager.info("No JSON generated - no workflow thread defined");
        return null;
    } else {
      return generatedJSON;
    }
  },
  // Callback for Clear Graph button in GraphControls
  handleClearGraph: function() {
    if (this.state.isRunning) {
      NotificationManager.info("Project is currently running - stop the project or wait for it to finish before editing");
      return;
    }
    // Undo/redo functionality, clear out redo and push state to undo stack
    this.undoStacks.undo.push(this.state);
    this.undoStacks.redo = [];
    this.setState({ nodes: [], edges: [] });
  },
  // Generates list of current threads in the project using dfs, used when generating JSON and in Threads tab in DetailPanel
  generateCurrentThreads: function() {
    var currentProject = { threads: [], cyclesPresent: false };
    var nodes = this.state.nodes.concat([]);
    var edges = this.state.edges.concat([]);
    while (nodes.length > 0) {
      var thread = { nodes: [], edges: [], cyclesPresent: false }
      var dfsStack = [];
      dfsStack.push(nodes.pop());
      while (dfsStack.length > 0) {
        var node = dfsStack.pop();
        thread.nodes.push(node);
        var outEdges = edges.filter(function(edge) { return node.id === edge.source.id; });
        var inEdges = edges.filter(function(edge) { return node.id === edge.target.id; });
        for (var i = 0; i < outEdges.length; i++) {
          var targetNode = outEdges[i].target;
          if (thread.edges.indexOf(outEdges[i]) < 0) {
            thread.edges.push(outEdges[i]);
          }
          if (nodes.indexOf(targetNode) > -1) {
            dfsStack.push(targetNode);
            nodes.splice(nodes.indexOf(targetNode), 1);
          }
        }
        for (var j = 0; j < inEdges.length; j++) {
          var sourceNode = inEdges[j].source;
          if (thread.edges.indexOf(inEdges[j]) < 0) {
            thread.edges.push(inEdges[j]);
          }
          if (nodes.indexOf(sourceNode) > -1) {
            dfsStack.push(sourceNode);
            nodes.splice(nodes.indexOf(sourceNode), 1);
          }
        }
      }
      currentProject.threads.push(thread);
    }
    for (var i = 0; i < currentProject.threads.length; i++) {
      if (this.detectCycles(currentProject.threads[i].nodes, currentProject.threads[i].edges)) {
        currentProject.threads[i].cyclesPresent = true;
        currentProject.cyclesPresent = true;
      }
    }
    return currentProject;
  },
  // Topological sort of the edges and nodes for a thread to detect cycles, return true if a cycle exists, used for cycle detection in generateCurrentThreads
  detectCycles: function(threadNodes, threadEdges) {
    var nodes = threadNodes.concat([]);
    var edges = threadEdges.concat([]);
    var startingNodes = nodes.filter(function(node) {
      var targetEdges = edges.filter(function(edge) { return node.id === edge.target.id; });
      return targetEdges.length === 0;
    });
    while (startingNodes.length > 0) {
      var sourceNode = startingNodes.pop();
      var targetEdges = edges.filter(function(edge) { return sourceNode.id === edge.source.id; });
      for (var i = 0; i < targetEdges.length; i++) {
        edges.splice(edges.indexOf(targetEdges[i]), 1);
        if (edges.filter(function(edge) { return edge.target.id === targetEdges[i].target.id; }).length === 0) {
          startingNodes.push(targetEdges[i].target);
        }
      }
    }
    return edges.length > 0;
  },
  // Generates list of breakpoints in a thread, formatted as { source-id: ..., target-id: ... }
  generateThreadBreakpoints: function(thread) {
    var breakpoints = [];
    var breakpointEdges = thread.edges.filter(function(d) {
      return d.breakpoint;
    });
    for (var i = 0; i < breakpointEdges.length; i++) {
      breakpoints.push({ "source-id": breakpointEdges[i]["source"].id, "target-id": breakpointEdges[i]["target"].id });
    }
    return breakpoints;
  },
  // Generates JSON representation of project to send to engine in a Run request
  generateJSONRun: function() {
    var nodes = this.state.nodes;
    var edges = this.state.edges;
    var idctThread = this.state.idctThread;
    var currentThreadIds = [];
    var dictJSON = {
      "threads":[]
      };

    var currentProject = this.generateCurrentThreads();
    var threads = currentProject.threads;
    if (currentProject.cyclesPresent) {
      NotificationManager.error("ERROR: Cycle present in thread, remove cycles before continuing");
      return null;
    } else {
      if (threads.length === 0) {
        return {};
      }
      //console.log("Creating an object with " + threads.length + " threads.");

      for (var i = 0; i < threads.length; i++) {
        currentThreadIds.push(idctThread);
        dictJSON["threads"].push({
          "configuration":{},
          "msg-type": 12,
          "reply-to": sid,
          "request":{
            "description": "", //tool tip when you hover over the module, blank for now
            "name": "",
            "node-type": "",//from config ccdp type
            "reply-to": sid, //reply to a queue named by the session id
            "session-id": sid,
            "tasks": [],
            "tasks-running-mode": "PARALLEL",//add this to gui and then set here
            "thread-id": idctThread++,
            "use-single-node": false //an option if I want to add it, tells everything to run on single node
          },
        });
        for (var j = 0; j < threads[i]["nodes"].length; j++) {
          var node = nodes.filter(function(d) { return d.id === threads[i]["nodes"][j].id; })[0];
          dictJSON["threads"][i]["request"]["tasks"].push({
            "class-name": node.config["class-name"],
	    "command": node.config["command"],
	    "configuration": node.config["task-props"],
	    "cpu": node.config["cpu"],
	    "description": "",//tool tip when you hover over the task, blank for now
	    "host-id": "",
	    "input-ports": [],
	    "launched-time": 0,
	    "mem": node.config["memory"],
	    "name": node.title,
	    "node-type": node.config["ccdp-type"],
	    "output-ports": [],
	    "reply-to": sid,//can set as different than thread if you want 2 receivers
	    "retries": 3,//default value 3 but can give an option
	    "session-id": sid,
            "task-id": node.id
          });
        }
        //Insert the ccdp-type and use-single-node setting into the thread object
        //Both of these settings should really be set per thread and not pulled from a task
        dictJSON["threads"][i]["request"]["node-type"]=node.config["ccdp-type"];
        dictJSON["threads"][i]["request"]["use-single-node"]=node.config["use-single-node"];
        //dictJSON["threads"][i]["request"]["tasks-running-mode"]=node.config["tasks-running-mode"]


        // Setup input/output ports and keep track of i/o port number for each task in the thread
        var inputPortNums = [];
        var outputPortNums = [];
        var taskNum = threads[i]["nodes"].length;
        while (taskNum--) {
          inputPortNums.push(1);
          outputPortNums.push(1);
        }
        //Sets up the input and output ports of the tasks
        //Currently creating a new input and output port for each connection
        if (threads[i]["nodes"].length > 1) {
          for (var k = 0; k < threads[i]["edges"].length; k++) {
            var outputIndex = threads[i]["nodes"].indexOf(threads[i]["edges"][k].source);
            var inputIndex = threads[i]["nodes"].indexOf(threads[i]["edges"][k].target);
            if (inputIndex > -1 && outputIndex > -1) {
              dictJSON["threads"][i]["request"]["tasks"][inputIndex]["input-ports"].push({
                "port-id": dictJSON["threads"][i]["request"]["tasks"][inputIndex]["task-id"] + "_input-" + inputPortNums[inputIndex],
                "from-port": [threads[i]["edges"][k].source.id + "_output-" + outputPortNums[outputIndex]]
              });
              dictJSON["threads"][i]["request"]["tasks"][outputIndex]["output-ports"].push({
                "port-id": dictJSON["threads"][i]["request"]["tasks"][outputIndex]["task-id"] + "_output-" + outputPortNums[outputIndex],
                "to-port": [threads[i]["edges"][k].target.id + "_input-" + inputPortNums[inputIndex]]
              });
              inputPortNums[inputIndex]++;
              outputPortNums[outputIndex]++;
            }
          }
        }
      }
      this.setState({ idctThread: idctThread, currentThreadIds: currentThreadIds });
      localStorage.setItem('idctThread', idctThread);
      return dictJSON;
    }
  },
  // Generates JSON representation of project for Export
  // This function is unecessary since the generateJSONRun can be used for the Run and export
  // Currently unused in the code. Calls to this have been replaced with generateJSONRun
  // If there is a need to use it replace this code with a copy of generateJSONRun for the updated format
  generateJSONExport: function() {
    var nodes = this.state.nodes;
    var edges = this.state.edges;
    var currentThreadIds = [];
    var dictJSON = {
      "threads": []
    };
    var currentProject = this.generateCurrentThreads();
    var threads = currentProject.threads;
    if (currentProject.cyclesPresent) {
      NotificationManager.error("ERROR: Cycle present in thread, remove cycles before continuing");
      return null;
    } else {
      if (threads.length === 0) {
        return {};
      }
      for (var i = 0; i < threads.length; i++) {
        dictJSON["threads"].push({
          "starting-task": [],
          "tasks": [],
          "breakpoints": this.generateThreadBreakpoints(threads[i])
        });
        for (var j = 0; j < threads[i]["nodes"].length; j++) {
          var node = nodes.filter(function(d) { return d.id === threads[i]["nodes"][j].id; })[0];
          dictJSON["threads"][i]["tasks"].push({
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
        var taskNum = threads[i]["nodes"].length;
        while (taskNum--) {
          inputPortNums.push(1);
          outputPortNums.push(1);
        }
        if (threads[i]["nodes"].length > 1) {
          for (var k = 0; k < threads[i]["edges"].length; k++) {
            var outputIndex = threads[i]["nodes"].indexOf(threads[i]["edges"][k].source);
            var inputIndex = threads[i]["nodes"].indexOf(threads[i]["edges"][k].target);
            if (inputIndex > -1 && outputIndex > -1) {
              dictJSON["threads"][i]["tasks"][inputIndex]["input-ports"].push({
                "port-id": dictJSON["threads"][i]["tasks"][inputIndex]["task-id"] + "_input-" + inputPortNums[inputIndex],
                "from": threads[i]["edges"][k].source.id + "_output-" + outputPortNums[outputIndex]
              });
              dictJSON["threads"][i]["tasks"][outputIndex]["output-ports"].push({
                "port-id": dictJSON["threads"][i]["tasks"][outputIndex]["task-id"] + "_output-" + outputPortNums[outputIndex],
                "to": threads[i]["edges"][k].target.id + "_input-" + inputPortNums[inputIndex]
              });
              inputPortNums[inputIndex]++;
              outputPortNums[outputIndex]++;
            }
          }
        }
        for (var j = 0; j < dictJSON["threads"][i]["tasks"].length; j++) {
          if (dictJSON["threads"][i]["tasks"][j]["input-ports"].length == 0) {
            dictJSON["threads"][i]["starting-task"].push(dictJSON["threads"][i]["tasks"][j]["task-id"]);
          }
        }
      }
      return dictJSON;
    }
  },
  // Callback for updating nodes and edges from GraphD3 (d3 operates on a copy of state to avoid mutating it)
  updateStateCallback: function(nodes, edges) {
    if (this.state.isRunning) {
      NotificationManager.info("Project is currently running - stop the project or wait for it to finish before editing");
      return;
    }
    // Undo/redo functionality, clear out redo and push state to undo stack
    this.undoStacks.undo.push(this.state);
    this.undoStacks.redo = [];
    // Update state with new nodes/edges received from GraphD3
    this.setState({ nodes: nodes, edges: edges });
  },
  render: function() {
    return (
      <div className="container-fluid">
        <Sidebar
          tasks={this.state.tasks}
          threads={this.state.threads}
          projects={this.state.projects}
          handleDeleteThread={this.handleDeleteThreadFromSidebar}
          handleDeleteProject={this.handleDeleteProjectFromSidebar}
          handleSaveTask={this.handleSaveTask} />
        <Graph
          nodes={this.state.nodes}
          edges={this.state.edges}
          logs={this.state.logs}
          updateStateCallback={this.updateStateCallback}
          generateCurrentThreads={this.generateCurrentThreads}
          handleRunGraph={this.handleRunGraph}
          handleStopGraph={this.handleStopGraph}
          handleExportGraph={this.handleExportGraph}
          handleClearGraph={this.handleClearGraph}
          handleSaveProject={this.handleSaveProject}
          handleNewProject={this.handleNewProject}
          handleOpenProject={this.handleOpenProject}
          handleTaskSubmit={this.handleTaskSubmit}
          handleTaskUpdate={this.handleTaskUpdate}
          handleThreadSubmit={this.handleThreadSubmit}
          handleSaveSingleThread={this.handleSaveThread}
          handleDeleteSingleThread={this.handleDeleteThreadFromGraph} />
        <NotificationContainer/>
        <ModalPrompt
          show={this.state.showPrompt}
          hideModal={this.hideModal}
          modalTitle={this.state.modalTitle}
          modalBody={this.state.modalBody}
          modalCallback={this.state.modalCallback}
          confirmButtonText={this.state.confirmButtonText}/>
      </div>
    );
  }
});
/*
        <NodeProperties
          handleTaskUpdate={this.handleTaskUpdate} />
*/
module.exports = DragDropContext(HTML5Backend)(App);
