/* GraphBuilder class adapted from https://github.com/cjrd/directed-graph-creator */
var GraphBuilder = function(svg, nodes, edges){
  var thisGraph = this;
  thisGraph.svg = svg;
  thisGraph.idctNode = 0;
  thisGraph.idctThread = 0;
  thisGraph.nodes = nodes || [];
  thisGraph.edges = edges || [];
  thisGraph.currentThreads = [];
  thisGraph.state = {
    selectedNode: null,
    selectedEdge: null,
    mouseDownNode: null,
    mouseDownLink: null,
    justDragged: false,
    justScaleTransGraph: false,
    lastKeyDown: -1,
    shiftNodeDrag: false,
    selectedText: null,
    contextMenuShowing: false
  };

  // Define arrow markers for graph links
  var defs = svg.append('svg:defs');
  defs.append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', "32")
    .attr('markerWidth', 3.5)
    .attr('markerHeight', 3.5)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

  // Define arrow markers for leading arrow
  defs.append('svg:marker')
    .attr('id', 'mark-end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 7)
    .attr('markerWidth', 3.5)
    .attr('markerHeight', 3.5)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');
  
  thisGraph.svgG = thisGraph.svg.append("g")
        .classed(thisGraph.consts.graphClass, true);

  // Displayed when dragging between nodes
  thisGraph.dragLine = thisGraph.svgG.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0')
        .style('marker-end', 'url(#mark-end-arrow)');

  // Svg nodes and edges
  thisGraph.paths = thisGraph.svgG.append("g").selectAll("g");
  thisGraph.circles = thisGraph.svgG.append("g").selectAll("g");

  thisGraph.drag = d3.behavior.drag()
        .origin(function(d){
          return {x: d.x, y: d.y};
        })
        .on("drag", function(args){
          thisGraph.state.justDragged = true;
          thisGraph.dragmove.call(thisGraph, args);
        });

  // Listen for key events
  d3.select(window).on("keydown", function(){
    thisGraph.svgKeyDown.call(thisGraph);
  })
  .on("keyup", function(){
    thisGraph.svgKeyUp.call(thisGraph);
  });
  thisGraph.svg.on("mousedown", function(d){
    thisGraph.svgMouseDown.call(thisGraph, d);
  });
  thisGraph.svg.on("mouseup", function(d){
    thisGraph.svgMouseUp.call(thisGraph, d);
  });

  // Listen for resize
  window.onresize = function(){thisGraph.updateWindow(svg);};
};

// Constants for the class (css class names, key values, etc)
GraphBuilder.prototype.consts =  {
  selectedClass: "selected",
  connectClass: "connect-node",
  circleGClass: "conceptG",
  graphClass: "graph",
  activeEditId: "active-editing",
  BACKSPACE_KEY: 8,
  DELETE_KEY: 46,
  ENTER_KEY: 13,
  nodeRadius: 50
};

// Node drag functionality
GraphBuilder.prototype.dragmove = function(d) {
  var thisGraph = this;
  if (thisGraph.state.shiftNodeDrag){
    thisGraph.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(thisGraph.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
  } else{
    if (d3.event.dx > 0) { 
      d.x = Math.min(d.x + d3.event.dx, $("#mainContainer").width());
    } else {
      d.x = Math.max(d.x + d3.event.dx, 0);
    }
    if (d3.event.dy > 0) {
      d.y = Math.min(d.y + d3.event.dy, $("#mainContainer").height());
    } else {
      d.y = Math.max(d.y + d3.event.dy, 0);
    }
/* Snippet will adjust graph draggining limits to be at node edge rather than center (replace above if preferred)
    d.x = Math.max(thisGraph.consts.nodeRadius, Math.min($("#mainContainer").width() - thisGraph.consts.nodeRadius, d3.event.x));
    d.y = Math.max(thisGraph.consts.nodeRadius, Math.min($("#mainContainer").height() - thisGraph.consts.nodeRadius, d3.event.y));
*/
    thisGraph.updateGraph();
  }
};

// Clears all nodes from graph and removes their property divs
GraphBuilder.prototype.deleteGraph = function(skipPrompt){
  var thisGraph = this,
      doDelete = true;
  if (!skipPrompt){
    doDelete = window.confirm("Press OK to delete this graph");
  }
  if(doDelete){
    // Remove hidden property divs for nodes
    for (var i = 0; i < thisGraph.nodes.length; i++) {
      $("#" + thisGraph.nodes[i].id + "-task-properties").remove();
    }
    thisGraph.nodes = [];
    thisGraph.edges = [];
    thisGraph.updateGraph();
    thisGraph.updateCurrentThreads();
  }
};

/* Insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
GraphBuilder.prototype.insertTitleLinebreaks = function (gEl, title) {
  var words = title.split(/\s+/g),
      nwords = words.length;
  var el = gEl.append("text")
        .attr("text-anchor","middle")
        .attr("dy", "-" + (nwords-1)*7.5);

  for (var i = 0; i < words.length; i++) {
    var tspan = el.append('tspan').text(words[i]);
    if (i > 0)
      tspan.attr('x', 0).attr('dy', '15');
  }
};

// Remove edges associated with a node
GraphBuilder.prototype.spliceLinksForNode = function(node) {
  var thisGraph = this,
      toSplice = thisGraph.edges.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    thisGraph.edges.splice(thisGraph.edges.indexOf(l), 1);
  });
};

// Replace selected edge when selecting another edge
GraphBuilder.prototype.replaceSelectEdge = function(d3Path, edgeData){
  var thisGraph = this;
  d3Path.classed(thisGraph.consts.selectedClass, true);
  if (thisGraph.state.selectedEdge){
    thisGraph.removeSelectFromEdge();
  }
  thisGraph.state.selectedEdge = edgeData;
};

// Replace selected node when selecting another node
GraphBuilder.prototype.replaceSelectNode = function(d3Node, nodeData){
  var thisGraph = this;
  d3Node.classed(this.consts.selectedClass, true);
  if (thisGraph.state.selectedNode){
    thisGraph.removeSelectFromNode();
  }
  thisGraph.state.selectedNode = nodeData;
};

// Remove selected node from state
GraphBuilder.prototype.removeSelectFromNode = function(){
  var thisGraph = this;
  thisGraph.circles.filter(function(cd){
    return cd.id === thisGraph.state.selectedNode.id;
  }).classed(thisGraph.consts.selectedClass, false);
  thisGraph.state.selectedNode = null;
};

// Remove selected edge from state
GraphBuilder.prototype.removeSelectFromEdge = function(){
  var thisGraph = this;
  thisGraph.paths.filter(function(cd){
    return cd === thisGraph.state.selectedEdge;
  }).classed(thisGraph.consts.selectedClass, false);
  thisGraph.state.selectedEdge = null;
};

// Mousedown on graph edge
GraphBuilder.prototype.pathMouseDown = function(d3path, d){
  var thisGraph = this,
      state = thisGraph.state;
  d3.event.stopPropagation();
  state.mouseDownLink = d;
  if (state.selectedNode){
    thisGraph.removeSelectFromNode();
  }
  var prevEdge = state.selectedEdge;
  if (!prevEdge || prevEdge !== d){
    thisGraph.replaceSelectEdge(d3path, d);
  } else{
    thisGraph.removeSelectFromEdge();
  }
};

// Mousedown on node
GraphBuilder.prototype.circleMouseDown = function(d3node, d){
  var thisGraph = this,
      state = thisGraph.state;
  d3.event.stopPropagation();
  state.mouseDownNode = d;
  if (d3.event.shiftKey){
    state.shiftNodeDrag = d3.event.shiftKey;
    // reposition dragged directed edge
    thisGraph.dragLine.classed('hidden', false)
      .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
    return;
  }
};

// Mouseup on node
GraphBuilder.prototype.circleMouseUp = function(d3node, d){
  var thisGraph = this,
      state = thisGraph.state,
      consts = thisGraph.consts;
  // Reset the states
  state.shiftNodeDrag = false;
  d3node.classed(consts.connectClass, false);

  var mouseDownNode = state.mouseDownNode;

  if (!mouseDownNode) return;

  thisGraph.dragLine.classed("hidden", true);

  if (mouseDownNode !== d){
    // Create new edge for mousedown edge and add to graph
    var newEdge = {source: mouseDownNode, target: d};
    var filtRes = thisGraph.paths.filter(function(d){
      if (d.source === newEdge.target && d.target === newEdge.source){
        thisGraph.edges.splice(thisGraph.edges.indexOf(d), 1);
      }
      return d.source === newEdge.source && d.target === newEdge.target;
    });
    if (!filtRes[0].length){
      thisGraph.edges.push(newEdge);
      thisGraph.updateGraph();
      thisGraph.updateCurrentThreads();
    }
  } else{
    if (state.justDragged) {
      // Dragged, not clicked
      state.justDragged = false;
    } else{
      // Clicked, not dragged
      if (state.selectedEdge){
        thisGraph.removeSelectFromEdge();
      }
      var prevNode = state.selectedNode;

      if (!prevNode || prevNode.id !== d.id){
        thisGraph.replaceSelectNode(d3node, d);
      } else{
        thisGraph.removeSelectFromNode();
      }
    }
  }
  state.mouseDownNode = null;
  return;
};

// Mousedown on main svg
GraphBuilder.prototype.svgMouseDown = function(){
  this.state.graphMouseDown = true;
};

// Mouseup on main svg
GraphBuilder.prototype.svgMouseUp = function(){
  var thisGraph = this,
      state = thisGraph.state;
  if (state.justScaleTransGraph) {
    // Dragged not clicked
    state.justScaleTransGraph = false;
  } 
  else if (state.shiftNodeDrag){
    // Dragged from node
    state.shiftNodeDrag = false;
    thisGraph.dragLine.classed("hidden", true);
  }
  state.graphMouseDown = false;
};

// Keydown on main svg
GraphBuilder.prototype.svgKeyDown = function() {
  var thisGraph = this,
      state = thisGraph.state,
      consts = thisGraph.consts;
  // Make sure repeated key presses don't register for each keydown
  if(state.lastKeyDown !== -1) return;

  state.lastKeyDown = d3.event.keyCode;
  var selectedNode = state.selectedNode,
      selectedEdge = state.selectedEdge;

  switch(d3.event.keyCode) {
  case consts.BACKSPACE_KEY:
    if (selectedNode && !thisGraph.state.contextMenuShowing){
      d3.event.preventDefault();
      thisGraph.nodes.splice(thisGraph.nodes.indexOf(selectedNode), 1);

      // Remove hidden properties div for the node
      $("#" + selectedNode.id + "-task-properties").remove();
      thisGraph.spliceLinksForNode(selectedNode);
      state.selectedNode = null;
      thisGraph.updateGraph();
      thisGraph.updateCurrentThreads();
    } 
    else if (selectedEdge){
      d3.event.preventDefault();
      thisGraph.edges.splice(thisGraph.edges.indexOf(selectedEdge), 1);
      state.selectedEdge = null;
      thisGraph.updateGraph();
      thisGraph.updateCurrentThreads();
    }
    break;
  case consts.DELETE_KEY:
    if (selectedNode && !thisGraph.state.contextMenuShowing){
      d3.event.preventDefault();
      thisGraph.nodes.splice(thisGraph.nodes.indexOf(selectedNode), 1);

      // Remove hidden properties div for the node
      $("#" + selectedNode.id + "-task-properties").remove();
      thisGraph.spliceLinksForNode(selectedNode);
      state.selectedNode = null;
      thisGraph.updateGraph();
      thisGraph.updateCurrentThreads();
    } 
    else if (selectedEdge){
      d3.event.preventDefault();
      thisGraph.edges.splice(thisGraph.edges.indexOf(selectedEdge), 1);
      state.selectedEdge = null;
      thisGraph.updateGraph();
      thisGraph.updateCurrentThreads();
    }
    break;
  }
};

// Keyup on main svg
GraphBuilder.prototype.svgKeyUp = function() {
  this.state.lastKeyDown = -1;
};

// Get current count for the thread id number
GraphBuilder.prototype.getThreadCount = function() {
  return this.idctThread;
};

// Set count for the thread id number
GraphBuilder.prototype.setThreadCount = function(idctThread) {
  this.idctThread = idctThread;
};

// Add node to graph and add hidden properties div
GraphBuilder.prototype.createNode = function(xVal, yVal, titleVal, taskId) {
  var d = {id: taskId.replace(/\s+/g, '') + "-" + this.idctNode++, title: titleVal, x: xVal, y: yVal, task: taskId};
  this.nodes.push(d);
  this.updateGraph();
  this.updateCurrentThreads();
  nodeProperties = d3.select("#taskProperties")
      .append("div")
      .attr("id", d.id + "-task-properties")
      .attr("task-id", d.task)
      .attr("class-name", $("#" + taskId).attr("class-name"))
      .attr("task-name", titleVal)
      .attr("selected-instance", "0")
      .attr("ccdp-type", $("#" + taskId).attr("ccdp-type-default"))
      .attr("min-instances", $("#" + taskId).attr("min-instances-default"))
      .attr("max-instances", $("#" + taskId).attr("max-instances-default"));

  // Add extra config properties from endpoint
  nodeConfig = nodeProperties.append("ul")
      .attr("id", d.id + "-task-properties-config");
  $("#" + taskId + "-config").find("li").each(function() {
    nodeConfig.append("li")
        .attr("attribute-name", $(this).attr("attribute-name"))
        .text($(this).text());
  });
  return d.id;
};

// Call to propagate changes to graph
GraphBuilder.prototype.updateGraph = function(){
  var thisGraph = this,
      consts = thisGraph.consts,
      state = thisGraph.state;

  thisGraph.paths = thisGraph.paths.data(thisGraph.edges, function(d){
    return String(d.source.id) + "+" + String(d.target.id);
  });
  var paths = thisGraph.paths;
  // Update existing paths
  paths.style('marker-end', 'url(#end-arrow)')
    .classed(consts.selectedClass, function(d){
      return d === state.selectedEdge;
    })
    .attr("d", function(d){
      return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
    });

  // Add new paths
  paths.enter()
    .append("path")
    .style('marker-end','url(#end-arrow)')
    .classed("link", true)
    .attr("d", function(d){
      return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
    })
    .on("mousedown", function(d){
      thisGraph.pathMouseDown.call(thisGraph, d3.select(this), d);
      })
    .on("mouseup", function(d){
      state.mouseDownLink = null;
    });

  // TODO: Add popup context menu to edges to allow setting breakpoints
  paths.on('contextmenu', function (d, i) {
    d3.event.preventDefault();
    if (thisGraph.state.contextMenuShowing) {
        // TODO: do work with breakpoint settings?
        if ($(".popup").find("select").val() == 1) {
          d3.select(this).classed("breakpoint", true);
        } else {
          d3.select(this).classed("breakpoint", false);
        }
        d3.select(".popup").remove();
    } else {
        popup = d3.select("#mainContainer")
            .append("div")
            .attr("class", "popup")
            .style("left", "8px")
            .style("top", "8px");

        // Set up popup contextmenu
        popup.append("h2").text("Edge: [" + d.source.id + "]->[" + d.target.id + "]");
        list = popup.append("ul").attr("class", "property-list");
        listItem1 = list.append("li");
        listItem1.append("span").text("Set Breakpoint?").attr("class", "task-property-label");
        select = listItem1.append("select").attr("class", "task-property-element");
        option1 = select.append("option").attr("value", 0).text("No");
        option2 = select.append("option").attr("value", 1).text("Yes");
        outputButton = list.append("input").attr("class", "task-property-element")
              .attr("type", "button")
              .attr("value", "View Output")
              .on("click", function(d) {
                  alert("Output from engine goes here");
                });
        continueButton = list.append("input").attr("class", "task-property-element")
              .attr("type", "button")
              .attr("value", "Continue")
              .on("click", function(d) {
                  alert("Tell engine to continue processing thread");
                });
        if (d3.select(this).classed("breakpoint")) {
          option2.attr("selected", "true");
        } else {
          option1.attr("selected", "true");
          continueButton.attr("style", "display: none;");
        }
        select.on("change", function(d) {
            if ($(".popup").find("select").val() == 1) { $(".popup").find("input").show(); }
            else { $(".popup").find("input[value='Continue']").hide(); }
          });

        // Make popup draggable inside of the container
        $(".popup").draggable({ containment: "#mainContainer" });
    }
    thisGraph.state.contextMenuShowing = !thisGraph.state.contextMenuShowing;
  });

  // Remove old links
  paths.exit().remove();

  // Update existing nodes
  thisGraph.circles = thisGraph.circles.data(thisGraph.nodes, function(d){ return d.id;});
  thisGraph.circles.attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";});

  // Add new nodes
  var newGs= thisGraph.circles.enter()
        .append("g");

  newGs.classed(consts.circleGClass, true)
    .attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";})
    .on("mouseover", function(d){
      if (state.shiftNodeDrag){
        d3.select(this).classed(consts.connectClass, true);
      }
    })
    .on("mouseout", function(d){
      d3.select(this).classed(consts.connectClass, false);
    })
    .on("mousedown", function(d){
      thisGraph.circleMouseDown.call(thisGraph, d3.select(this), d);
    })
    .on("mouseup", function(d){
      thisGraph.circleMouseUp.call(thisGraph, d3.select(this), d);
    })
    .call(thisGraph.drag);

  // Add popup context menu to nodes
  newGs.classed(consts.circleGClass, true).on('contextmenu', function (d, i) {
    d3.event.preventDefault();
    if (!thisGraph.state.contextMenuShowing) {
        popup = d3.select("#mainContainer")
            .append("div")
            .attr("class", "popup")
            .style("left", "8px")
            .style("top", "8px");

        // Set up popup contextmenu
        popup.append("h2").text($(this).text());
        list = popup.append("ul").attr("class", "property-list");
        listItem1 = list.append("li").attr("class", "required-property");
        listItem1.append("span").text("ccdp-type").attr("class", "task-property-label");
        select = listItem1.append("select").attr("id", "property-instance-select").attr("class", "task-property-element");
        option1 = select.append("option").attr("value", 0).text("EC2");
        option2 = select.append("option").attr("value", 1).text("EMR");
        if($("#" + d.id + "-task-properties").attr("selected-instance") === "1") {
          option2.attr("selected", "true");
        } else {
          option1.attr("selected", "true");
        }
        listItem2 = list.append("li");
        listItem2.append("span").text("min instances").attr("class", "task-property-label");
        listItem2.append("input").attr("type", "text").attr("id", "property-min-num").attr("value", $("#" + d.id + "-task-properties").attr("min-instances")).attr("class", "task-property-element");
        listItem3 = list.append("li");
        listItem3.append("span").text("max instances").attr("class", "task-property-label");
        listItem3.append("input").attr("type", "text").attr("id", "property-max-num").attr("value", $("#" + d.id + "-task-properties").attr("max-instances")).attr("class", "task-property-element");

        // Set up popup contextmenu with config properties
        $("#" + d.id + "-task-properties-config").find("li").each(function() {
          configListItem = list.append("li").attr("class", "config-property");
          configListItem.append("span").attr("class", "task-property-label").text($(this).attr("attribute-name"));
          configListItem.append("input").attr("type", "text").attr("class", "task-property-element").attr("value", $(this).text());
        });

        // Add Save/Cancel buttons and give them onClicks
        popup.append("button").attr("type", "submit").attr("id", "save-task-config-button").attr("class", "contextMenuButton").html("<i class='fa fa-floppy-o' aria-hidden='true'></i> Save");
        popup.append("button").attr("type", "submit").attr("id", "cancel-task-config-button").attr("class", "contextMenuButton").html("<i class='fa fa-ban' aria-hidden='true'></i> Cancel");
        $("#save-task-config-button").click(function() {
          // Saves properties in hidden div
          $("#" + d.id + "-task-properties")
            .attr("selected-instance", $("#property-instance-select").val())
            .attr("ccdp-type", $("#property-instance-select :selected").text())
            .attr("min-instances", $("#property-min-num").val())
            .attr("max-instances", $("#property-max-num").val());
          // Write extra config properties to $("#" + d.id + "-task-properties-config")
          $(".config-property").each(function() {
            $("#" + d.id + "-task-properties-config [attribute-name='" + $(this).find("span").text() + "']").text($(this).find("input").val());
          });
          d3.select(".popup").remove();
          thisGraph.state.contextMenuShowing = false;
        });
        $("#cancel-task-config-button").click(function() {
          d3.select(".popup").remove();
          thisGraph.state.contextMenuShowing = false;
        });

        // Make popup draggable inside of the container
        $(".popup").draggable({ containment: "#mainContainer" });
        thisGraph.state.contextMenuShowing = true;
    }
  });

  newGs.append("circle")
    .attr("r", String(consts.nodeRadius));

  newGs.each(function(d){
    thisGraph.insertTitleLinebreaks(d3.select(this), d.title);
  });

  // Remove old nodes
  thisGraph.circles.exit().remove();
};

// Call to update window size on resize
GraphBuilder.prototype.updateWindow = function(svg){
  var x = $("#mainContainer").width();
  var y = $("#mainContainer").height();
  svg.attr("width", x).attr("height", y);
};

// Update node color with their status
GraphBuilder.prototype.updateNodeStatus = function(taskId, statusCode) {
  var thisGraph = this;
  thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("running", false);
  thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("success", false);
  thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("failed", false);
  thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("paused", false);
  if (statusCode === "RUNNING") {
    thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("running", true);
  }
  else   if (statusCode === "PAUSED") {
    thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("paused", true);
  }
  else if (statusCode === "SUCCESS") {
    thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("success", true);
  }
  else if (statusCode === "FAILED") {
    thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("failed", true);
  }
};

// Build thread from JSON representation
GraphBuilder.prototype.buildThread = function(threadJSON) {
  // TODO: improve time complexity
  var thisGraph = this;
  var result = JSON.parse(threadJSON);
  var newNodes = [];
  var x = 100;
  var y = 100;
  for (var i = 0; i < result.length; i++) {
    var nodeId = thisGraph.createNode(x, y, result[i]["name"], result[i]["module-id"]);
    $("#" + nodeId + "-task-properties").attr("class-name", $("#" + result[i]["task-id"]).attr("class-name"));
    $("#" + nodeId + "-task-properties").attr("ccdp-type", result[i]["ccdp-type"]);
    $("#" + nodeId + "-task-properties").attr("max-instances", result[i]["max-instances"]);
    $("#" + nodeId + "-task-properties").attr("min-instances", result[i]["min-instances"]);
    if (result[i]["ccdp-type"] === "EC2") {
      $("#" + nodeId + "-task-properties").attr("selected-instance", "0");
    } else {
      $("#" + nodeId + "-task-properties").attr("selected-instance", "1");
    }
    for (key in result[i]["configuration"]) {
      d3.select("#" + nodeId + "-task-properties-config [attribute-name=" + key + "]").text(result[i]["configuration"][key]);
    }
    newNodes.push({id: nodeId, outPorts: result[i]["output-ports"], inPorts: result[i]["input-ports"]});

    x += 200;
    if (i % 2 == 0) { y += 200; }
    else {y -= 200; }
  }
  for (var i = 0; i < newNodes.length; i++) {
    if (newNodes[i].outPorts.length > 0) {
      // TODO: create edges based on ports
      for (var j = 0; j < newNodes[i].outPorts.length; j++) {
        var outPort = newNodes[i].outPorts[j]["port-id"];
        var inPort = newNodes[i].outPorts[j]["to"];
        for (var k = 0; k < newNodes.length; k++) {
          for (var l = 0; l < newNodes[k].inPorts.length; l++) {
            if (newNodes[k].inPorts[l]["port-id"] === inPort) {
              var sourceNode = {};
              var targetNode = {};
              for (var z = 0; z < thisGraph.nodes.length; z++) {
                if (newNodes[i].id === thisGraph.nodes[z].id) { sourceNode = thisGraph.nodes[z]; }
                if (newNodes[k].id === thisGraph.nodes[z].id) { targetNode = thisGraph.nodes[z]; }
              }
              thisGraph.edges.push({source: sourceNode, target: targetNode});
            }
          }
        }
      }
    }
  }
  thisGraph.updateGraph();
  thisGraph.updateCurrentThreads();
};

// removeSublists method to handle sublists generated by backwards flow paths (used to generate list of current threads)
function removeSublists(nestedList) {
  var sublistIndices = [];
  for (var i = 0; i < nestedList.length; i++) {
    for (var j = 0; j < nestedList.length; j++) {
      var sublist = true;
      if (i !== j) {
        for (var a = 0; a < nestedList[i].length; a++) {
          if (nestedList[j].indexOf(nestedList[i][a]) == -1) {
            sublist = false;
            break;
          }
        }
        if (sublist && sublistIndices.indexOf(i) == -1) {
          sublistIndices.push(i);
        }
      }
    }
  }
  sublistIndices.sort(function(a, b) {
      if (a > b) { return -1; }
      if (a < b) { return 1; }
      return 0;
    });
  for (var i = 0; i < sublistIndices.length; i++) {
    nestedList.splice(sublistIndices[i], 1);
    nestedList.join();
  }
};

// Updates currentThreads for graph, call when adding nodes/edges
GraphBuilder.prototype.updateCurrentThreads = function(){
  var thisGraph = this;
  // Set up currentThreads array
  thisGraph.currentThreads = [];
  var flows = [];
  var flowNum = -1;
  if (thisGraph.nodes === undefined) {
    return [];
  }
  for (var i = 0; i < thisGraph.nodes.length; i++) {
    var missingNode = true;
    for (var j = 0; j < flows.length; j++) {
      if (flows[j].indexOf(thisGraph.nodes[i].id) > -1) {
        missingNode = false;
        break;
      }
    }
    if (missingNode) {
      flowNum++;
      flows.push([thisGraph.nodes[i].id]);
      for (var k = 0; k < thisGraph.edges.length; k++) {
        if (flows[flowNum].includes(thisGraph.edges[k].target.id) && !flows[flowNum].includes(thisGraph.edges[k].source.id)) {
          flows[flowNum].splice(flows[flowNum].indexOf(thisGraph.edges[k].target.id), 0, thisGraph.edges[k].source.id);
          flows[flowNum].join();
        }
        if (flows[flowNum].includes(thisGraph.edges[k].source.id) && !flows[flowNum].includes(thisGraph.edges[k].target.id)) {
          flows[flowNum].splice(flows[flowNum].indexOf(thisGraph.edges[k].source.id) + 1, 0, thisGraph.edges[k].target.id);
          flows[flowNum].join();
        }
      }
    }
  }
  removeSublists(flows);
  for (var k = 0; k < flows.length; k++) {
    thisGraph.currentThreads.push({
      "thread-id": "thread-" + thisGraph.idctThread++,
      "tasks": flows[k]
    });
  }
};
