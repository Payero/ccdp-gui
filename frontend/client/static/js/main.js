/*** Main ***/
var App = require('./components/App.js');
var React = require('react');
var ReactDOM = require('react-dom');

// Load Project Editor state from local storage
var nodes = JSON.parse(localStorage.getItem('nodes')) || [];
var edges = JSON.parse(localStorage.getItem('edges')) || [];
var idct = JSON.parse(localStorage.getItem('idct')) || 0;
var idctThread = JSON.parse(localStorage.getItem('idctThread')) || 0;
var projectName = JSON.parse(localStorage.getItem('currentProjectName')) || null;
var projectDescription = JSON.parse(localStorage.getItem('currentProjectDescription')) || null;

// Set edges to point to node objects (not a new object from JSON.parse)
for (var i = 0; i < edges.length; i++) {
  for (var j = 0; j < nodes.length; j++) {
    if (edges[i].source.id === nodes[j].id) {
      edges[i].source = nodes[j];
    }
    if (edges[i].target.id === nodes[j].id) {
      edges[i].target = nodes[j];
    }
  }
}

ReactDOM.render(
  <App 
    initialIdct={idct}
    initialIdctThread={idctThread}
    initialNodes={nodes}
    initialEdges={edges}
    initialProjectName={projectName}
    initialProjectDescription={projectDescription} />,
  document.getElementById('content')
);
