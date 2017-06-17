class GraphD3 {
  constructor(el, updateSelectedCallback, updateStateCallback, props = {}) {
    var thisGraph = this;
    thisGraph.svg = d3.select(el).append("svg");

    thisGraph.consts =  {
      selectedClass: "selected",
      connectClass: "connect-node",
      circleGClass: "conceptG",
      graphClass: "graph",
      BACKSPACE_KEY: 8,
      DELETE_KEY: 46,
      nodeRadius: 50
    };

    thisGraph.nodes = props.nodes.concat([]);
    thisGraph.edges = props.edges.concat([]);
    thisGraph.updateSelectedCallback = updateSelectedCallback;
    thisGraph.updateStateCallback = updateStateCallback;

    thisGraph.graphState = {
      selectedNode: null,
      selectedEdge: null,
      mouseDownNode: null,
      mouseDownLink: null,
      justDragged: false,
      lastKeyDown: -1,
      shiftNodeDrag: false,
      gridLayout: true,
      zoomLevel: 1
    };

    // Set up grid layout for Graph
    thisGraph.svg.style('background-image', 'repeating-linear-gradient(0deg,transparent,transparent 24px,#CCC 24px,#CCC 25px),repeating-linear-gradient(-90deg,transparent,transparent 24px,#CCC 24px,#CCC 25px)');
    thisGraph.svg.style('background-size', '25px 25px');

    // Define arrow markers for graph links
    var defs = thisGraph.svg.append('svg:defs');
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
          thisGraph.graphState.justDragged = true;
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
    
    thisGraph.updateGraph();
  }

  // Update function to call when Graph component is updated
  update(el, props) {
    var thisGraph = this;
    thisGraph.nodes = props.nodes.concat([]);
    thisGraph.edges = props.edges.concat([]);
    // Set edges to point to the correct node instances
    for (var i = 0; i < thisGraph.nodes.length; i++) {
      for (var j = 0; j < thisGraph.edges.length; j++) {
        if (thisGraph.edges[j].source.id === thisGraph.nodes[i].id) {
          thisGraph.edges[j].source = thisGraph.nodes[i];
        }
        else if (thisGraph.edges[j].target.id === thisGraph.nodes[i].id) {
          thisGraph.edges[j].target = thisGraph.nodes[i];
        }
      }
    }
    // Update selectedNode and selectedEdge
    if (thisGraph.graphState.selectedNode !== null) {
      for (var k = 0; k < thisGraph.nodes.length; k++) {
        if (thisGraph.nodes[k].id === thisGraph.graphState.selectedNode.id) {
          thisGraph.graphState.selectedNode = thisGraph.nodes[k];
        }
      }
    }
    if (thisGraph.graphState.selectedEdge !== null) {
      for (var l = 0; l < thisGraph.edges.length; l++) {
        if (thisGraph.edges[l].source.id === thisGraph.graphState.selectedEdge.source.id && thisGraph.edges[l].target.id === thisGraph.graphState.selectedEdge.target.id) {
          thisGraph.graphState.selectedEdge = thisGraph.edges[l];
        }
      }
    }
    thisGraph.updateGraph();
  }

  // UpdateGraph function to redraw graph
  updateGraph(){
    var thisGraph = this,
      consts = thisGraph.consts,
      graphState = thisGraph.graphState;

    thisGraph.paths = thisGraph.paths.data(thisGraph.edges, function(d){
      return String(d.source.id) + "+" + String(d.target.id);
    });
    var paths = thisGraph.paths;
    // Update existing paths
    paths.style('marker-end', 'url(#end-arrow)')
      .classed(consts.selectedClass, function(d){
        return d === graphState.selectedEdge;
      })
      .classed("breakpoint", function(d) {
        return d.breakpoint;
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
      .classed("breakpoint", function(d) {
        return d.breakpoint;
      })
      .on("mouseup", function(d){
        graphState.mouseDownLink = null;
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
        if (graphState.shiftNodeDrag){
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

    newGs.append("circle")
      .attr("r", String(thisGraph.consts.nodeRadius));

    newGs.each(function(d){
      d3.select(this).append("text")
        .attr("x", 0)
        .attr("dy", ".35em")
        .attr("text-anchor","middle")
        .text(d.title);
    });
    
    // Clear node color before updating
    thisGraph.circles.classed("running", false);
    thisGraph.circles.classed("success", false);
    thisGraph.circles.classed("failed", false);
    thisGraph.circles.classed("paused", false);
    // Update node color based on status
    thisGraph.circles.filter(function(d, i) { return d.status === "RUNNING"; }).classed("running", true);
    thisGraph.circles.filter(function(d, i) { return d.status === "PAUSED"; }).classed("paused", true);
    thisGraph.circles.filter(function(d, i) { return d.status === "FAILED"; }).classed("failed", true);
    thisGraph.circles.filter(function(d, i) { return d.status === "SUCCESS"; }).classed("success", true);

    // Remove old nodes
    thisGraph.circles.exit().remove();
    localStorage.setItem('nodes', JSON.stringify(thisGraph.nodes));
    localStorage.setItem('edges', JSON.stringify(thisGraph.edges));
  }

  // Node drag functionality
  dragmove(d) {
    var thisGraph = this;
    if (thisGraph.graphState.shiftNodeDrag){
      thisGraph.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(thisGraph.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
    } else{
      if (thisGraph.graphState.gridLayout) {
        d.x = Math.round( Math.max(0, Math.min(d3.event.x, parseFloat(thisGraph.svg.style("width")) / thisGraph.graphState.zoomLevel)) / 25) * 25;
        d.y = Math.round( Math.max(0, Math.min(d3.event.y, parseFloat(thisGraph.svg.style("height")) / thisGraph.graphState.zoomLevel)) / 25) * 25;
      } else {
        d.x = Math.max(0, Math.min(d3.event.x, parseFloat(thisGraph.svg.style("width")) / thisGraph.graphState.zoomLevel));
        d.y = Math.max(0, Math.min(d3.event.y, parseFloat(thisGraph.svg.style("height")) / thisGraph.graphState.zoomLevel));
      }
      thisGraph.updateGraph();
    }
  }

  // Remove all nodes/edges from the graph
  deleteGraph(skipPrompt){
    var thisGraph = this,
        doDelete = true;
    if (!skipPrompt){
      doDelete = window.confirm("Press OK to delete this graph");
    }
    if(doDelete){
      thisGraph.nodes.splice(0, thisGraph.nodes.length);
      thisGraph.edges.splice(0, thisGraph.edges.length);
      thisGraph.graphState.selectedNode = null;
      thisGraph.graphState.selectedEdge = null;
      thisGraph.updateGraph();
      thisGraph.updateSelectedCallback();
      thisGraph.updateStateCallback();
    }
  }

  // Remove edges associated with a node
  spliceLinksForNode(node) {
    var thisGraph = this,
        toSplice = thisGraph.edges.filter(function(l) {
      return (l.source === node || l.target === node);
    });
    toSplice.map(function(l) {
      thisGraph.edges.splice(thisGraph.edges.indexOf(l), 1);
    });
  }

  // Replace selected edge when selecting another edge
  replaceSelectEdge(d3Path, edgeData){
    var thisGraph = this;
    d3Path.classed(thisGraph.consts.selectedClass, true);
    if (thisGraph.graphState.selectedEdge){
      thisGraph.removeSelectFromEdge();
    }
    thisGraph.graphState.selectedEdge = edgeData;
  }

  // Replace selected node when selecting another node
  replaceSelectNode(d3Node, nodeData){
    var thisGraph = this;
    d3Node.classed(this.consts.selectedClass, true);
    if (thisGraph.graphState.selectedNode){
      thisGraph.removeSelectFromNode();
    }
    thisGraph.graphState.selectedNode = nodeData;
  }

  // Remove selected node from graphState
  removeSelectFromNode(){
    var thisGraph = this;
    thisGraph.circles.filter(function(cd){
      return cd.id === thisGraph.graphState.selectedNode.id;
    }).classed(thisGraph.consts.selectedClass, false);
    thisGraph.graphState.selectedNode = null;
  }

  // Remove selected edge from graphState
  removeSelectFromEdge(){
    var thisGraph = this;
    thisGraph.paths.filter(function(cd){
      return cd === thisGraph.graphState.selectedEdge;
    }).classed(thisGraph.consts.selectedClass, false);
    thisGraph.graphState.selectedEdge = null;
  }

  // Mousedown on graph edge
  pathMouseDown(d3path, d){
    var thisGraph = this,
        graphState = thisGraph.graphState;
    d3.event.stopPropagation();
    graphState.mouseDownLink = d;
    if (graphState.selectedNode){
      thisGraph.removeSelectFromNode();
    }
    var prevEdge = graphState.selectedEdge;
    if (!prevEdge || prevEdge !== d){
      thisGraph.replaceSelectEdge(d3path, d);
    } else{
      thisGraph.removeSelectFromEdge();
    }
    thisGraph.updateSelectedCallback();
  }

  // Mousedown on node
  circleMouseDown(d3node, d){
    var thisGraph = this,
        graphState = thisGraph.graphState;
    d3.event.stopPropagation();
    graphState.mouseDownNode = d;
    if (d3.event.shiftKey){
      graphState.shiftNodeDrag = d3.event.shiftKey;
      // reposition dragged directed edge
      thisGraph.dragLine.classed('hidden', false)
        .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
      return;
    }
  }

  // Mouseup on node
  circleMouseUp(d3node, d){
    var thisGraph = this,
      graphState = thisGraph.graphState,
      consts = thisGraph.consts;
    // Reset the graphStates
    graphState.shiftNodeDrag = false;
    d3node.classed(consts.connectClass, false);

    var mouseDownNode = graphState.mouseDownNode;

    if (!mouseDownNode) return;

    thisGraph.dragLine.classed("hidden", true);
  
    if (mouseDownNode !== d){
      // Create new edge for mousedown edge and add to graph
      var newEdge = {source: mouseDownNode, target: d, breakpoint: false, output: "No output"};
      var filtRes = thisGraph.paths.filter(function(d){
        if (d.source === newEdge.target && d.target === newEdge.source){
          thisGraph.edges.splice(thisGraph.edges.indexOf(d), 1);
        }
        return d.source === newEdge.source && d.target === newEdge.target;
      });
      if (!filtRes[0].length){
        thisGraph.edges.push(newEdge);
        thisGraph.updateGraph();
        thisGraph.updateStateCallback();
      }
    } else{
      if (graphState.justDragged) {
        // Dragged, not clicked
        graphState.justDragged = false;
      } else{
        // Clicked, not dragged
        if (graphState.selectedEdge){
          thisGraph.removeSelectFromEdge();
        }
        var prevNode = graphState.selectedNode;
  
        if (!prevNode || prevNode.id !== d.id){
          thisGraph.replaceSelectNode(d3node, d);
        } else{
          thisGraph.removeSelectFromNode();
        }
      }
    }
    graphState.mouseDownNode = null;
    thisGraph.updateSelectedCallback();
    return;
  }

  // Mousedown on main svg
  svgMouseDown(){
    this.graphState.graphMouseDown = true;
  }

  // Mouseup on main svg
  svgMouseUp(){
    var thisGraph = this,
        graphState = thisGraph.graphState;
    if (graphState.shiftNodeDrag){
      // Dragged from node
      graphState.shiftNodeDrag = false;
      thisGraph.dragLine.classed("hidden", true);
    }
    graphState.graphMouseDown = false;
  }

  // Keydown on main svg
  svgKeyDown() {
    var thisGraph = this,
        graphState = thisGraph.graphState,
        consts = thisGraph.consts;
    // Make sure repeated key presses don't register for each keydown
    if(graphState.lastKeyDown !== -1) return;

    graphState.lastKeyDown = d3.event.keyCode;
    var selectedNode = graphState.selectedNode,
        selectedEdge = graphState.selectedEdge;

    switch(d3.event.keyCode) {
    case consts.BACKSPACE_KEY:
      if (selectedNode && document.activeElement.tagName === 'BODY'){
        console.log(document.activeElement.tagName);
        d3.event.preventDefault();
        thisGraph.nodes.splice(thisGraph.nodes.indexOf(selectedNode), 1);
        thisGraph.spliceLinksForNode(selectedNode);
        graphState.selectedNode = null;
        thisGraph.updateGraph();
        thisGraph.updateStateCallback();
      } 
      else if (selectedEdge && document.activeElement.tagName === 'BODY'){
        d3.event.preventDefault();
        thisGraph.edges.splice(thisGraph.edges.indexOf(selectedEdge), 1);
        graphState.selectedEdge = null;
        thisGraph.updateGraph();
        thisGraph.updateStateCallback();
      }
      break;
    case consts.DELETE_KEY:
      if (selectedNode && document.activeElement.tagName === 'BODY'){
        d3.event.preventDefault();
        thisGraph.nodes.splice(thisGraph.nodes.indexOf(selectedNode), 1);
        thisGraph.spliceLinksForNode(selectedNode);
        graphState.selectedNode = null;
        thisGraph.updateGraph();
        thisGraph.updateStateCallback();
      } 
      else if (selectedEdge && document.activeElement.tagName === 'BODY'){
        d3.event.preventDefault();
        thisGraph.edges.splice(thisGraph.edges.indexOf(selectedEdge), 1);
        graphState.selectedEdge = null;
        thisGraph.updateGraph();
        thisGraph.updateStateCallback();
      }
      break;
    }
    thisGraph.updateSelectedCallback();
  }

  // Keyup on main svg
  svgKeyUp() {
    this.graphState.lastKeyDown = -1;
  }

  // Clears all status classes from node circle
  clearNodeStatus(taskId) {
    var thisGraph = this;
    thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("running", false);
    thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("success", false);
    thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("failed", false);
    thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("paused", false);
  }

  // Update node color with their status
  updateNodeStatus(taskId, statusCode) {
    var thisGraph = this;
    thisGraph.clearNodeStatus(taskId);
    if (statusCode === "RUNNING") {
      thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("running", true);
    }
    else if (statusCode === "PAUSED") {
      thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("paused", true);
    }
    else if (statusCode === "SUCCESS") {
      thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("success", true);
    }
    else if (statusCode === "FAILED") {
      thisGraph.circles.filter(function(d, i) { return d.id === taskId; }).classed("failed", true);
    }
  }

  // Update colors of task nodes with msg received from engine
  updateTasks(msg) {
    var graph = this;
    // NOTE: "SUCCES" addresses a typo in the engine we were unable to solve, remove it when the typo is fixed on return JSON
    if (msg.status === "SUCCESS" || msg.status === "SUCCES"){
      if (msg.state === "RUNNING") {
        graph.updateNodeStatus(msg["task-id"], "RUNNING");
      }
      else if (msg.state === "FINISHED") {
        graph.updateNodeStatus(msg["task-id"], "SUCCESS");
      }
    }
    else if (msg.status === "FAILED") {
      graph.updateNodeStatus(msg["task-id"], "FAILED");
    }
  }

  destroy(el) { }

}

module.exports = GraphD3;
