$(document).ready(function(){
  // Initial graph data
  var nodes = [];
  var edges = [];

  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";

  var isRunning = false;

  // Set up svg element and create graph
  var svg = d3.select("#graph").append("svg")
        .attr("width", $("#mainContainer").width())
        .attr("height", $("#mainContainer").height());
  var graph = new GraphBuilder(svg, nodes, edges);
  graph.updateGraph();

  // SockJS functionality, will connect to RabbitMQ directly and consume messages
  var ws = new SockJS('http://' + location.hostname + ':15674/stomp');
  var client = Stomp.over(ws);
  client.heartbeat.outgoing = 0;
  client.heartbeat.incoming = 0;
  var on_connect = function() {
    console.log('Connected');
    client.subscribe('/queue/CCDP-WebServer', function(data) {
      msg = JSON.parse(data["body"]);
      console.log(msg);
      if ("task-id" in msg) {
        updateTasks(graph, msg);
      }
      d3.select("#logging-view").append("p").text(JSON.stringify(msg));
      if ("results" in msg["body"]) {
        d3.select("#results-view").append("p").text(JSON.stringify(msg["body"]["results"]));
      }
    });
  };
  var on_error =  function() {
    console.log('Error');
  };
  client.connect('guest', 'guest', on_connect, on_error, '/');

  // Set up accordian functionality
  $('#accordion').accordion({
    collapsible:true,
    heightStyle: "content",
    beforeActivate: function(event, ui) {
      if (ui.newHeader[0]) {
        var currHeader  = ui.newHeader;
        var currContent = currHeader.next('.ui-accordion-content');
      } else {
        var currHeader  = ui.oldHeader;
        var currContent = currHeader.next('.ui-accordion-content');
      }
      var isPanelSelected = currHeader.attr('aria-selected') == 'true';
      currHeader.toggleClass('ui-corner-all',isPanelSelected).toggleClass('accordion-header-active ui-state-active ui-corner-top',!isPanelSelected).attr('aria-selected',((!isPanelSelected).toString()));
      currHeader.children('.ui-icon').toggleClass('ui-icon-triangle-1-e',isPanelSelected).toggleClass('ui-icon-triangle-1-s',!isPanelSelected);
      currContent.toggleClass('accordion-content-active',!isPanelSelected)    
      if (isPanelSelected) { currContent.slideUp(); }  else { currContent.slideDown(); }
      return false;
    }
  });

  // onClick for icons to expand/collapse sidebars
  $("#task-toggle-icon").click(function() {
    var taskVisible = $("#task-sidebar").is(":visible");
    var threadVisible = $("#thread-sidebar").is(":visible");
    $("#task-toggle-icon").hide();
    $("#task-sidebar").toggle("slide", { direction: "left" }, function() {
      $("#task-toggle-icon").show();
    });
    if (taskVisible) {
      $("#task-toggle-icon").attr("class", "fa fa-arrow-circle-right fa-2x").css("color", "#3E3F40");
      if (threadVisible) { $("#mainContainer").css("width", "85%").css("margin-left", "0%"); }
      else { $("#mainContainer").css("width", "100%").css("margin-left", "0%"); }
    } else {
      $("#task-toggle-icon").attr("class", "fa fa-arrow-circle-left fa-2x").css("color", "#DDE2E5");
      if (threadVisible) {  $("#mainContainer").css("width", "70%").css("margin-left", "15%");}
      else { $("#mainContainer").css("width", "85%").css("margin-left", "15%"); }
    }
    // Adjust x value of all nodes on the graph by difference between new and old width
    for (var i = 0; i < graph.nodes.length; i++) { graph.nodes[i].x += $("#mainContainer").width() - svg.attr("width"); }
    svg.attr("width", $("#mainContainer").width());
    graph.updateGraph();
  });
  $("#thread-toggle-icon").click(function() {
    var taskVisible = $("#task-sidebar").is(":visible");
    var threadVisible = $("#thread-sidebar").is(":visible");
    $("#thread-toggle-icon").hide();
    $("#thread-sidebar").toggle("slide", { direction: "right" }, function() {
      $("#thread-toggle-icon").show();
    });
    if (threadVisible) {
      $("#thread-toggle-icon").attr("class", "fa fa-arrow-circle-left fa-2x").css("color", "#3E3F40");
      if (taskVisible) { $("#mainContainer").css("width", "85%").css("margin-left", "15%"); }
      else { $("#mainContainer").css("width", "100%").css("margin-left", "0%"); }
      // Add margin when sidebar not visible to avoid sidebar expand icon overlapping
      $("#taskbar").css("margin-right", "3%");
    } else {
      $("#thread-toggle-icon").attr("class", "fa fa-arrow-circle-right fa-2x").css("color", "#DDE2E5");
      if (taskVisible) { $("#mainContainer").css("width", "70%").css("margin-left", "15%"); }
      else { $("#mainContainer").css("width", "85%").css("margin-left", "0%"); }
      // Take away margin when sidebar is visible
      $("#taskbar").css("margin-right", "0%");
    }
    svg.attr("width", $("#mainContainer").width());
  });

  $("#tabs").tabs();

  // Set onClick for logging display button
  $("#logging-toggle-button").click(function() {
    $("#tabs").slideToggle({ direction: "down" }, function() {
      $("#tabs").scrollTop($("#tabs").prop("scrollHeight"));
    });
  });

  // Set onClick for zoom control buttons
  var zoomLevel = 1;
  var centerX = 0;
  var centerY = 0;
  $("#zoom-out-button").click(function() {
    if (zoomLevel > .25) {
      zoomLevel *= .5;
      if (zoomLevel == 1) {
        centerX = 0;
        centerY = 0;
      } else {
        centerX += $("#mainContainer").width() * zoomLevel / 2;
        centerY += $("#mainContainer").height() * zoomLevel / 2;
      }
      graph.svg.select(".graph").transition().duration(500).attr("transform", "translate(" + centerX + "," + centerY + ") scale(" + zoomLevel + ")");
    }
  });
  $("#zoom-reset-button").click(function() {
    centerX = 0;
    centerY = 0;
    zoomLevel = 1;
    graph.svg.select(".graph").transition().duration(500).attr("transform", "translate(" + centerX + "," + centerY + ") scale(" + zoomLevel + ")");
  });
  $("#zoom-in-button").click(function() {
    if (zoomLevel < 4) {
      zoomLevel *= 2;
      if (zoomLevel == 1) {
        centerX = 0;
        centerY = 0;
      } else {
        centerX -= $("#mainContainer").width() * zoomLevel / 4;
        centerY -= $("#mainContainer").height() * zoomLevel / 4;
      }
      graph.svg.select(".graph").transition().duration(500).attr("transform", "translate(" + centerX + "," + centerY + ") scale(" + zoomLevel + ")");
    }
  });

  // Add tooltip to Tasks in sidebar
  $('.addTask').tooltip({
    items: ".addTask",
    position: {
                my: "right top", at: "right bottom"
              },
    content: function() {
               return $(this).attr("description");
             }
  });

  // Add tooltip to Threads in sidebar
  $('.addThread').tooltip({
    items: ".addThread",
    position: {
                my: "right top", at: "right bottom"
              },
    content: function() {
               return $(this).attr("description");
             }
  });

  // Add right-click context menu to Threads with save/delete options
  $.contextMenu({
    selector: ".addThread",
    items: {
        saveThread: { 
          name: "<i class='fa fa-floppy-o' aria-hidden='true'></i> Save Thread", 
          callback: function(key, opt){ alert("You clicked save!"); }
        },
        deleteThread: { 
          name: "<i class='fa fa-trash-o' aria-hidden='true'></i> Delete Thread", 
          callback: function(key, opt){
                      var delThread = window.confirm("Are you sure you want to delete the thread " + opt.$trigger.text() + "?");
                      if (delThread) {
                        var request = $.ajax({
                          url: apiURL + 'threads/delete/' + opt.$trigger.text(),
                          type: 'DELETE'
                        });

                        request.done(function(msg) {
                          alert(msg + " threads deleted from the database");
                          opt.$trigger.remove();
                        });

                        request.fail(function(jqXHR, textStatus) {
                          alert("Request failed: " + textStatus);
                        });
                      }
                    }
        }
    }
  });

  // Add right-click context menu to Tasks with delete option
  $.contextMenu({
    selector: ".addTask",
    items: {
        deleteTask: { 
          name: "<i class='fa fa-trash-o' aria-hidden='true'></i> Delete Task", 
          callback: function(key, opt){ alert("You clicked delete!"); }
        }
    }
  });

  // Add filter functionality to search bars
  $("#task-filter-text").change(function() {
    $(".addTask").show();
    $(".addTask").each(function() {
      if (!(($(this).text().toLowerCase()).includes($("#task-filter-text").val().toLowerCase()))) {
        $(this).hide();
      }
    });
  });
  $("#thread-filter-text").change(function() {
    $(".addThread").show();
    $(".addThread").each(function() {
      if (!(($(this).text().toLowerCase()).includes($("#thread-filter-text").val().toLowerCase()))) {
        $(this).hide();
      }
    });
  });

  // Drag and drop functionality to add nodes/threads
  $('.addTask').draggable({
    helper: function () { 
              $copy = $(this).clone();
              $copy.css({"width":$(this).outerWidth(),"margin":"0"});
               return $copy; 
            },
    revert: "invalid" ,
    appendTo: 'body',
    containment: 'body',
    scroll: false
    });
  $('.addThread').draggable({
    helper: function () { 
              $copy = $(this).clone();
              $copy.css({"width":$(this).outerWidth(),"margin":"0"});
               return $copy; 
            },
    revert: "invalid" ,
    appendTo: 'body',
    containment: 'body',
    scroll: false
    });
  $('.addThread').draggable({
    helper: function () { 
              $copy = $(this).clone();
              $copy.css({"list-style":"none","width":$(this).outerWidth()});
               return $copy; 
            },
    revert: "invalid" ,
    appendTo: 'body',
    scroll: false
    });
  $('#mainContainer').droppable({
    drop: function(event, ui){
      if ($(ui.draggable).hasClass("addTask")) {
        graph.createNode($(ui.helper).position().left, $(ui.helper).position().top, $(ui.draggable).text(), $(ui.draggable).attr("id"));
        ui.draggable.draggable('option','revert',true);
      }
      else if ($(ui.draggable).hasClass("addThread")) {
        graph.buildThread($(ui.draggable).attr("tasks"));
        ui.draggable.draggable('option','revert',true);
      }
    }
  });

  // Set onClick for Run button
  $("#run-graph").click(function() {
    var generatedJSON = generateJSON(graph);
    graph.circles.classed("running", false);
    graph.circles.classed("success", false);
    graph.circles.classed("failed", false);
    graph.circles.classed("paused", false);
    if ($.isEmptyObject(generatedJSON)) {
        alert("No JSON generated... probably because no workflow thread defined!");
        return;
    }
    var req = {
      "type": "REQUEST",
      "thread-id": "",
      "task-id": "",
      "action": "RUN",
      "body": generatedJSON
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
        isRunning = true;
        alert("Successfully sent a Run request to the engine");
    })

    request.fail(function(jqXHR, textStatus) {
        alert("Request failed: " + textStatus);
    });
  });

  // Set onClick for Pause button
  $("#pause-graph").click(function() {
    // TODO: Send json to endpoint to pause running threads
    alert("Pausing is not currently implemented");
    /*
    if (!isRunning) {
        alert("Nothing is currently running!");
        return;
    }
    var request = $.ajax({
        url: apiURL + 'pause',
        type: 'POST',
        data: {
            // TODO: id? unsure
        },
        dataType: 'json'
    });

    request.done(function(msg) {
        alert();
    });

    request.fail(function(jqXHR, textStatus) {
        alert("Request failed: " + textStatus);
    });
    */
  });

  // Set onClick for Cancel button
  $("#cancel-graph").click(function() {
    // TODO: Send json to endpoint to cancel running threads
    alert("Canceling is not currently implemented");
    /*
    if (!isRunning) {
        alert("Nothing is currently running!");
        return;
    }
    var request = $.ajax({
        url: apiURL + 'cancel',
        type: 'POST',
        data: {
            // TODO: id? unsure
        },
        dataType: 'json'
    });

    request.done(function(msg) {
        alert(msg);
    });

    request.fail(function(jqXHR, textStatus) {
        alert("Request failed: " + textStatus);
    });
    */
  });

  // Set onClick for Export Graph button
  $("#export-graph").click(function() {
    var generatedJSON = generateJSON(graph);
    if ($.isEmptyObject(generatedJSON)) {
        alert("No JSON generated... probably because no workflow thread defined!");
        return;
    }
    alert(JSON.stringify(generatedJSON, undefined, 2));
  });

  // Set onClick for Clear Graph button
  $("#clear-graph").click(function() {
    graph.deleteGraph(false);
  });

  // Set onClick for Save Threads button
  $("#save-thread").click(function() {
    var threads = generateJSON(graph);
    for (var i = 0; i < threads["threads"].length; i++) {
      var threadSaveMsg = "Would you like to save the thread " + threads["threads"][i]["name"] + "? (This thread consists of the tasks ";
      for (var j = 0; j < threads["threads"][i]["tasks"].length - 1; j++) {
        threadSaveMsg += threads["threads"][i]["tasks"][j]["name"] + ", ";
      }
      if (threads["threads"][i]["tasks"].length > 1) {
        threadSaveMsg += "and " + threads["threads"][i]["tasks"][j]["name"] + ")";
      } else {
        threadSaveMsg += threads["threads"][i]["tasks"][j]["name"] + ")";
      }
      var saveThread = window.confirm(threadSaveMsg);
      if (saveThread) {
        threads["threads"][i]["name"] = prompt("Enter a name for this thread:", threads["threads"][i]["name"]);
        threads["threads"][i]["short-description"] = prompt("Enter a description for this thread:", threads["threads"][i]["short-description"]);
        var request = $.ajax({
          url: apiURL + 'threads/save',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(threads["threads"][i]),
          dataType: 'json'
        });
     
        request.done(function(msg) {
          // do something with the `msg` returned
          alert(msg + " threads updated");
          updateThreads(apiURL, graph);
        })

        request.fail(function(jqXHR, textStatus) {
          alert("Request failed: " + textStatus);
        });
      }
    }
  });

  // Set onClick for Upload Task Module button
  $("#upload-task").click(function() {
    // TODO: Upload Task
    alert("Use this button to upload a task");
  });

});

function generateJSON(graph) {
  var dictJSON = {
    "threads": []
  };
  var threads = graph.currentThreads;
  if (threads.length === 0) {
    return {};
  }
  for (var i = 0; i < threads.length; i++) {
    dictJSON["threads"].push({
      "thread-id": threads[i]["thread-id"],
      "name": "",
      "starting-task": [],
      "short-description": "",
      "tasks": []
    });

    for (var j = 0; j < threads[i]["tasks"].length; j++) {
      dictJSON["threads"][i]["tasks"].push({
        "task-id": threads[i]["tasks"][j],
        "module-id": $("#" + threads[i]["tasks"][j] + "-task-properties").attr("task-id"),
        "name": $("#" + threads[i]["tasks"][j] + "-task-properties").attr("task-name"),
        "class-name": $("#" + threads[i]["tasks"][j] + "-task-properties").attr("class-name"),
        "ccdp-type": $("#" + threads[i]["tasks"][j] + "-task-properties").attr("ccdp-type"),
        "max-instances": $("#" + threads[i]["tasks"][j] + "-task-properties").attr("max-instances"),
        "min-instances": $("#" + threads[i]["tasks"][j] + "-task-properties").attr("min-instances"),
        "configuration": {},
        "input-ports": [],
        "output-ports": []
      });
      $("#" +  threads[i]["tasks"][j] + "-task-properties-config").find("li").each(function() {
        dictJSON["threads"][i]["tasks"][j]["configuration"][$(this).attr("attribute-name")] = $(this).text();
      });
    }

    // Setup input/output ports and keep track of i/o port number for each task in the thread
    var inputPortNums = [];
    var outputPortNums = [];
    var taskNum = threads[i]["tasks"].length;
    while (taskNum--) {
      inputPortNums.push(1);
      outputPortNums.push(1);
    }
    if (threads[i]["tasks"].length > 1) {
      for (var k = 0; k < graph.edges.length; k++) {
        var outputIndex = threads[i]["tasks"].indexOf(graph.edges[k].source.id);
        var inputIndex = threads[i]["tasks"].indexOf(graph.edges[k].target.id);
        if (inputIndex > -1 && outputIndex > -1) {
          dictJSON["threads"][i]["tasks"][inputIndex]["input-ports"].push({
            "port-id": dictJSON["threads"][i]["tasks"][inputIndex]["task-id"] + "_input-" + inputPortNums[inputIndex],
            "from": graph.edges[k].source.id + "_output-" + outputPortNums[outputIndex]
          });
          dictJSON["threads"][i]["tasks"][outputIndex]["output-ports"].push({
            "port-id": dictJSON["threads"][i]["tasks"][outputIndex]["task-id"] + "_output-" + outputPortNums[outputIndex],
            "to": graph.edges[k].target.id + "_input-" + inputPortNums[inputIndex]
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
};

// Update list of threads when a thread is added
function updateThreads(apiURL, graph) {
  var request = $.ajax({
      url: apiURL + 'threads',
      type: 'GET',
      dataType: 'json'
  });

  request.done(function(msg) {
    $("#thread-container").empty();
    var threads = msg;
    for (var i = 0; i < threads.length; i++) {
      d3.select("#thread-container").append("div")
        .attr("class", "addThread")
        .attr("description", threads[i]["short-description"])
        .attr("tasks", JSON.stringify(threads[i]["tasks"]))
        .text(threads[i]["name"]);
    }
    // Add draggable behavior to new divs
    $('.addThread').draggable({
      helper: function () {
                $copy = $(this).clone();
                $copy.css({"width":$(this).outerWidth(),"margin":"0"});
                 return $copy;
              },
      revert: "invalid" ,
      appendTo: 'body',
      containment: 'body',
      scroll: false
    });
    // Add context menu to new divs
    $.contextMenu({
      selector: ".addThread",
      items: {
          saveThread: {
            name: "<i class='fa fa-floppy-o' aria-hidden='true'></i> Save Thread",
            callback: function(key, opt){ alert("You clicked save!"); }
          },
          deleteThread: {
            name: "<i class='fa fa-trash-o' aria-hidden='true'></i> Delete Thread",
            callback: function(key, opt){
                        var delThread = window.confirm("Are you sure you want to delete the thread " + opt.$trigger.text() + "?");
                        if (delThread) {
                          var request = $.ajax({
                            url: apiURL + 'threads/delete/' + opt.$trigger.text(),
                            type: 'DELETE'
                          });

                          request.done(function(msg) {
                            alert(msg + " threads deleted from the database");
                            opt.$trigger.remove();
                          });

                          request.fail(function(jqXHR, textStatus) {
                            alert("Request failed: " + textStatus);
                          });
                        }
                      }
          }
      }
    });
    // Add tooltip to new divs
    $('.addThread').tooltip({
      items: ".addThread",
      position: {
                  my: "right top", at: "right bottom"
                },
      content: function() {
                 return $(this).attr("description");
               }
    });
  });

  request.fail(function(jqXHR, textStatus) {
      alert("Could not load threads: " + textStatus);
  });
};

// Update colors of task nodes with msg received from engine
function updateTasks(graph, msg) {
  if (msg["status"] === "SUCCESS" || msg["status"] === "SUCCES"){
    if (msg["state"] === "RUNNING") {
      graph.updateNodeStatus(msg["task-id"], "RUNNING");
    }
    else if (msg["state"] === "FINISHED") {
      graph.updateNodeStatus(msg["task-id"], "SUCCESS");
    }
  }
  else if (msg["status"] === "FAILED") {
    graph.updateNodeStatus(msg["task-id"], "FAILED");
  }
};
