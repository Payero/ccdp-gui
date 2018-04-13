/*
* Class with funtions to make data request to the server
*
*/
import $ from 'jquery';

/* Function gets the System Data */
export function getSystemData(component){
 var port   = location.port;
 var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
 var dataSet =[];
 var graphSet = {};
 var request = $.ajax({
   url: apiURL + 'SysViewTable',
   type: 'GET',
   dataType: 'json'
 });
 request.done( (msg) => {
   var data = msg.hits.hits

   for(var i =0; i<data.length; i++)
   {
     var Obj = data[i]["_source"]["allSessionInfo"];
     var time =  new Date(data[i]["_source"]["@timestamp"]);
     time = time.toLocaleTimeString();
     var vmsInEngine = data[i]["_source"]["vmsInEngine"];
     var TaskInEngine = data[i]["_source"]["taskInEngine"];
     if(i === 0)
     {
       graphSet["Labels"]=[time];
        for(var key in Obj)
        {
          var thisData = Obj[key];
          thisData["session-id"] = key;
          thisData["VMsInEngine"] = vmsInEngine;
          thisData["TaskInEngine"] = TaskInEngine;
          thisData["@timestamp"] = time;
          dataSet.push(thisData);
          graphSet[key]={"cpu":[Obj[key]["curAvgCPU"]], "mem": [Obj[key]["curAvgMem"]]};
        }
     }
    else {
      graphSet["Labels"].unshift(time);
      for(var key in Obj)
      {
        graphSet[key]["cpu"].unshift(Obj[key]["curAvgCPU"]);
        graphSet[key]["mem"].unshift(Obj[key]["curAvgMem"]);
      }
    }
   }
   component.setState({
     data: dataSet,
     graphData:graphSet
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
 var graphSet = {};
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
        var time = new Date(data[i]["_source"]["@timestamp"]);
        var vm = data[i]["_source"]["instance-id"];
        var cpu = Number(data[i]["_source"]["system-cpu-load"] * 100).toFixed(2);
        var mem = data[i]["_source"]["system-mem-load"];
         time = time.toLocaleTimeString();
        if(i == 0){
          dataSet.push(data[i]["_source"])
          dataSet[i]["@timestamp"]=time;
          graphSet["Labels"]=[time];
          graphSet[vm]={"cpu":[cpu], "mem": [mem]};
        }
        else {
          let obj = dataSet.find((o, index) => {
            if(o["instance-id"]=== vm)
            {
              if(o["@timestamp"]< data[i]["_source"]["@timestamp"])
              {
                dataSet[index]=data[i]["_source"];
              }
              return true;
            }

          });
          if(obj == null)
          {
            dataSet.push(data[i]["_source"]);
            graphSet["Labels"].unshift(time);
            graphSet[vm]={"cpu":[cpu], "mem": [mem]};
          }
          else {
            graphSet["Labels"].unshift(time);
            graphSet[vm]["cpu"].unshift(cpu);
            graphSet[vm]["mem"].unshift(mem);
          }
          for(var vms in graphSet)
          {
            if(vms === vm || vms === "Labels" )
            {
              /*do nothing*/
            }
            else
            {
              var i_1=graphSet[vms]["cpu"][i-1];
              var i_2=graphSet[vms]["cpu"][i-2];
              var i_3=graphSet[vms]["cpu"][i-3];
              if(i_1==0 && i_2==0 & i_3==0)
              {
                graphSet[vms]["cpu"].unshift(null);
                graphSet[vms]["mem"].unshift(null);
              }
              else
              {
                graphSet[vms]["cpu"].unshift(0);
                graphSet[vms]["mem"].unshift(0);
              }

            }
          }

        }
     }
      component.setState({
        data: dataSet,
        graphData:graphSet
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
      //component.setState({ data: currentData})
    });
   request.fail(function(jqXHR, textStatus) {
      NotificationManager.error("Could not get system data" + textStatus);
    });

  });
  $(document).ajaxStop(function () {
    component.setState({ data:currentData})
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
     "vmId" : component.props.match.params.instance
   },
   dataType: 'json'
 });
 request.done( (msg) => {
   if(msg.hasOwnProperty("hits")){
     var data = msg.hits.hits
     for(var i =0; i<data.length; i++)
     {
       if(!data[i]["_source"].hasOwnProperty("completed"))
       {
         data[i]["_source"]["completed"] = "-"
       }
       if(!data[i]["_source"].hasOwnProperty("started"))
       {
         data[i]["_source"]["started"] = "-"
       }
       if(data[i]["_source"].hasOwnProperty("completed"))
       {
         var newDate = new Date( data[i]["_source"]["completed"]);
         //var date = newDate.getMonth()+"/" +newDate.getDate()+"/" + newDate.getYear()+"::"+newDate.getHours()+":"+newDate.getMinutes()+":"+newDate.getSeconds();
         data[i]["_source"]["completed"] = newDate.toLocaleString();
       }
       if(data[i]["_source"].hasOwnProperty("started"))
       {
         var newDate = new Date( data[i]["_source"]["started"]);
         //var date = newDate.getMonth()+"/" +newDate.getDate()+"/" + newDate.getYear()+"::"+newDate.getHours()+":"+newDate.getMinutes()+":"+newDate.getSeconds();
         data[i]["_source"]["started"] = newDate.toLocaleString();
       }
       var time = new Date(data[i]["_source"]["@timestamp"]);
        time = time.toLocaleTimeString();
       dataSet.push(data[i]["_source"])
       dataSet[i]["@timestamp"]=time;
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
