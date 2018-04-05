/*
* Class with funtions to make data request to the server
*
*/
import $ from 'jquery';

/* Function gets the System Data */
export function getSystemData(component){
 var port   = location.port;
 var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
 var dataSet = [];
 var request = $.ajax({
   url: apiURL + 'SysViewTable',
   type: 'GET',
   dataType: 'json'
 });
 request.done( (msg) => {
   var data = msg.hits.hits
   for(var i =0; i<data.length; i++)
   {
    dataSet.push(data[i]["_source"])
   }
   component.setState({
     data: dataSet,
     loading: false
   });
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
 var request = $.ajax({
   url: apiURL + 'SessionViewTable',
   type: 'GET',
   data:{
     session: component.props.match.params.sesId
   },
   dataType: 'json'
 });
 request.done( (msg) => {
   if(msg.hasOwnProperty("hits")){
     var data = msg.hits.hits;
      for(var i =0; i<data.length; i++)
      {
      dataSet.push(data[i]["_source"])
     }
      component.setState({
        data: dataSet
      });
   }
   else {
     component.setState({data: []});
   }
 });

 request.fail(function(jqXHR, textStatus) {
   NotificationManager.error("Could not get system data" + textStatus);
 });
}

/*function get how many task are running, have been completed, or have failed
  based on a specific VM
*/
export function get_number_task_perState(component){
  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
  var currentData = component.state.data;
  currentData.forEach((obj, index)=>{
    var VMid = obj["instance-id"];
    currentData[index]["AvgCPU"]= Number(obj["system-cpu-load"] * 100).toFixed(2);
    currentData[index]["AvgMem"] =  obj["system-mem-load"];
    var request = $.ajax({
      url: apiURL + 'TaskStatus',
      type: 'GET',
      data: {
        "vmId" : VMid,
       "state1": "RUNNING",
       "state2": "SUCCESSFUL",
       "state3": "FAILED"
     },
      dataType: 'json'
    });
    request.done( (msg) => {
      currentData[index]["Task-RUNNING"]= msg[0];
      currentData[index]["Task-SUCCESSFUL"]= msg[1];
      currentData[index]["Task-FAILED"]= msg[2];
      component.setState({ data: currentData})
    });
   request.fail(function(jqXHR, textStatus) {
      NotificationManager.error("Could not get system data" + textStatus);
    });

  });
  /*$(document).ajaxStop(function () {
    component.setState({ data:currentData})
  });*/

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
     "vmId" : component.props.match.params.instance
   },
   dataType: 'json'
 });
 request.done( (msg) => {
   if(msg.hasOwnProperty("hits")){
     var data = msg.hits.hits
     for(var i =0; i<data.length; i++)
     {
      dataSet.push(data[i]["_source"])
     }
     component.setState({data: dataSet});
   }
   else {
       component.setState({data: []});
   }

 });
 request.fail(function(jqXHR, textStatus) {
   NotificationManager.error("Could not get system data" + textStatus);
 });
}
