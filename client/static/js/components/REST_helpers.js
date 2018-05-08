/*
* Class with funtions to make data request to the server
*
*/
import $ from 'jquery';
import moment from 'moment-timezone';

export function getApplicationSettings(component, doc_ID){
  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
  var dataSet =[];
  var request = $.ajax({
    url: apiURL + 'Settings/Default',
    type: 'GET',
    dataType: 'json',
    data:{
      id:doc_ID
    }
  });
  request.done( (msg) => {
    if(msg.found){
      component.setState({
        settings:msg["_source"]
      })
    }
  });
  request.fail(function(jqXHR, textStatus) {
    NotificationManager.error("Could not get system settings" + textStatus);
  });
}

export function saveApplicationNewSetting(jsonData){
  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
  var dataSet =[];
  var request = $.ajax({
    url: apiURL + 'Settings/Update',
    type: 'POST',
    contentType: 'application/json',
    data:jsonData,
    dataType: 'json'
  });
  request.done( (msg) => {
    console.log(msg);
  });
  request.fail(function(jqXHR, textStatus) {
    NotificationManager.error("Could not save system new settings" + textStatus);
  });

}
export function getSystemData(component){
  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
  var dataSet =[];
  var request = $.ajax({
    url: apiURL + 'SysViewTable',
    type: 'GET',
    dataType: 'json',
    data:{
      size: component.state.timeRangeForTable["size"],
      gte:  component.state.timeRangeForTable["gte"],
      lte:  component.state.timeRangeForTable["lte"]
    }
  });
  request.done( (msg) => {
    if(msg.hasOwnProperty("hits"))
    {
      var data = msg.hits.hits;
       for(var i =0; i<data.length; i++)
       {
         dataSet.push(data[i]["_source"]);
       }
    }
    component.setState({
      data: dataSet,
      loading:false
    });
  });
  request.fail(function(jqXHR, textStatus) {
    NotificationManager.error("Could not get system data" + textStatus);
  });
}
/* Function gets the System Data */
export function getSystemGraphData(component){
  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
  var graphSet = {};
  var request = $.ajax({
    url: apiURL + 'SysViewGraph',
    type: 'GET',
    dataType: 'json',
    data:{
      time_zone: moment.tz.guess(),
      size: component.state.timeRangeForGraph["graphSize"],
      gte:  component.state.timeRangeForGraph["gte"],
      lte:  component.state.timeRangeForGraph["lte"],
      interval : component.state.timeRangeForGraph["interval"]
    }
  });
  request.done( (msg) => {
    var Labels = [];
    var bucket = msg["aggregations"]["2"]["buckets"];
    for(var i = 0; i<bucket.length; i++ )
    {
      var time = new Date(bucket[i]["key_as_string"]);
      time = time.toLocaleTimeString();
      Labels.push(time);
      var innerbucket = bucket[i]["3"]["buckets"];
      for(var j = 0; j<innerbucket.length; j++)
      {
        var session = innerbucket[j]["key"];
        var cpu = innerbucket[j]["1"]["value"];
        var mem = innerbucket[j]["5"]["value"];
        if(graphSet.hasOwnProperty(session))
        {
          graphSet[session]["cpu"].push(cpu);
          graphSet[session]["mem"].push(mem);
        }
        else {

          graphSet[session]={"cpu": [cpu], "mem": [mem]};

        }
      }
    }
    if(bucket.length > 0){
      graphSet["Labels"]=Labels;
      component.setState({
        graphData: graphSet
      });
    }
  });
  request.fail(function(jqXHR, textStatus) {
    NotificationManager.error("Could not get system data" + textStatus);
  });
}

/*Function gets VM data based on the session id */
export function getSessionData(component){
 var port   = location.port;
 var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
 var dataSet = [];
 var graphSet = {};
 var request = $.ajax({
   url: apiURL + 'SessionViewTable',
   type: 'GET',
   data:{
     session: component.props.match.params.sesId,
     size: component.state.timeRangeForTable["size"],
     gte:  component.state.timeRangeForTable["gte"],
     lte:  component.state.timeRangeForTable["lte"]
   },
   dataType: 'json'
 });
 request.done( (msg) => {
   if(msg.hasOwnProperty("hits")){
     var data = msg.hits.hits;
      for(var i =0; i<data.length; i++)
      {
        dataSet.push(data[i]["_source"]);
        var date = new Date(data[i]["_source"]["last-assignment"]);
        dataSet[i]["last-assignment"]=date.getFullYear()+"/"+date.getMonth()+"/"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds() + ":"+date.getMilliseconds();
        dataSet[i]["AvgCPU"]= Number(data[i]["_source"]["system-cpu-load"] * 100).toFixed(2);
        dataSet[i]["AvgMem"] =  data[i]["_source"]["system-mem-load"];
        get_number_task_perState(component, data[i]["_source"]["instance-id"], i)
      }
   }
   component.setState({
     data: dataSet,
     loading:false
   });
 });
 request.fail(function(jqXHR, textStatus) {
   NotificationManager.error("Could not get system data" + textStatus);
 });
}

export function getSessionGraphData(component){
  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
  var graphSet = {};
  var request = $.ajax({
    url: apiURL + 'SessionViewGraph',
    type: 'GET',
    data:{
      time_zone: moment.tz.guess(),
      session: component.props.match.params.sesId,
      size: component.state.timeRangeForGraph["graphSize"],
      gte:  component.state.timeRangeForGraph["gte"],
      lte:  component.state.timeRangeForGraph["lte"],
      interval : component.state.timeRangeForGraph["interval"]
    },
    dataType: 'json'
  });
  request.done( (msg) => {
    var Labels = [];
    var bucket = msg["aggregations"]["2"]["buckets"];
    for(var i = 0; i<bucket.length; i++ )
    {
      var time = new Date(bucket[i]["key_as_string"]);
      time = time.toLocaleTimeString();
      Labels.push(time);
      var innerbucket = bucket[i]["3"]["buckets"];
      for(var j = 0; j<innerbucket.length; j++)
      {
        var vm = innerbucket[j]["key"];
        var cpu = Number(innerbucket[j]["1"]["value"] * 100).toFixed(2);
        var mem = innerbucket[j]["5"]["value"];
        if(graphSet.hasOwnProperty(vm))
        {
          if(graphSet[vm]["cpu"][i-1]== null)
          {
            graphSet[vm]["cpu"][i-1]=cpu;
            graphSet[vm]["mem"][i-1]=mem;
          }
          graphSet[vm]["cpu"][i]=cpu;
          graphSet[vm]["mem"][i]=mem;
          graphSet[vm]["cpu"][i+1]=cpu;
          graphSet[vm]["mem"][i+1]=mem;
        }
        else {
          var cpuArray = new Array(bucket.length).fill(null);
          var memArray = new Array(bucket.length).fill(null);
          graphSet[vm]={"cpu": cpuArray, "mem": memArray};
          graphSet[vm]["cpu"][i]=cpu;
          graphSet[vm]["mem"][i]=mem;

        }
      }
    }
    if(bucket.length > 0){
      graphSet["Labels"]=Labels;
      component.setState({
        graphData: graphSet
      });
    }
  });

  request.fail(function(jqXHR, textStatus) {
    NotificationManager.error("Could not get system data" + textStatus);
  });
}
/*function get how many task are running, have been completed, or have failed
  based on a specific VM
*/
export function get_number_task_perState(component, vmid, index){
  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
  var currentData = component.state.data;
  var request = $.ajax({
    url: apiURL + 'TaskStatus',
    type: 'GET',
    data: {
      "vmId" : vmid,
     "state1": "RUNNING",
     "state2": "SUCCESSFUL",
     "state3": "FAILED"
   },
    dataType: 'json'
  });
  request.done( (msg) => {
    if(currentData[index] != null){
      currentData[index]["Task-RUNNING"]= msg[0];
      currentData[index]["Task-SUCCESSFUL"]= msg[1];
      currentData[index]["Task-FAILED"]= msg[2];
      component.setState({ data: currentData})
    }

  });
 request.fail(function(jqXHR, textStatus) {
    NotificationManager.error("Could not get system data" + textStatus);
  });

}

/*Function used to get that task data for a specific VM*/
export function getTaskinVM(component){
 var port   = location.port;
 var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
 var dataSet = [];
 var request = $.ajax({
   url: apiURL + 'VMviewTable',
   type: 'GET',
   data: {
     "vmId" : component.props.match.params.instance,
     size: component.state.timeRangeForTable["size"],
     gte:  component.state.timeRangeForTable["gte"],
     lte:  component.state.timeRangeForTable["lte"]
   },
   dataType: 'json'
 });
 request.done( (msg) => {
   if(msg.hasOwnProperty("hits")){
     var data = msg.hits.hits
     for(var i =0; i<data.length; i++)
     {
       if(data[i]["_source"].hasOwnProperty("completed"))
       {
         var newDate1 = new Date( data[i]["_source"]["completed"]);
        data[i]["_source"]["completed"] =newDate1.getFullYear()+"/"+newDate1.getMonth()+"/"+newDate1.getDate()+" "+newDate1.getHours()+":"+newDate1.getMinutes()+":"+newDate1.getSeconds() + ":"+newDate1.getMilliseconds();
       }
       if(data[i]["_source"].hasOwnProperty("started"))
       {
         var newDate2 = new Date( data[i]["_source"]["started"]);
         data[i]["_source"]["started"] =newDate2.getFullYear()+"/"+newDate2.getMonth()+"/"+newDate2.getDate()+" "+newDate2.getHours()+":"+newDate2.getMinutes()+":"+newDate2.getSeconds() + ":"+newDate2.getMilliseconds();
       }
       dataSet.push(data[i]["_source"])
     }
     component.setState({
       data: dataSet,
       loading:false
     });
   }

 });
 request.fail(function(jqXHR, textStatus) {
   NotificationManager.error("Could not get system data" + textStatus);
 });
}