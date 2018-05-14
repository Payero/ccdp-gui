    /*
    * Class with funtions to make data request to the server
    *
    */
    import $ from 'jquery';
    import moment from 'moment-timezone';
    var xhrPool=[];
    export function abortAllAjax(){
      for (var queries= 0; queries< xhrPool.length; queries++){
        console.log(xhrPool[queries])
        xhrPool[queries].abort;
        xhrPool.splice(queries,1);
      }
    }
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
      var pieData ={};
      var request = $.ajax({
        beforeSend: function(jqXHR) {
          xhrPool.push(jqXHR);
        },
        url: apiURL + 'SysViewTable',
        type: 'GET',
        dataType: 'json',
        data:{
          size: component.state.timeRange["size"],
          gte:  component.state.timeRange["gte"],
          lte:  component.state.timeRange["lte"]
        }
      });
      request.done( (msg) => {
        if(msg.hasOwnProperty("hits"))
        {
          var data = msg.hits.hits;
           for(var i =0; i<data.length; i++)
           {
             dataSet.push(data[i]["_source"]);
             pieData[data[i]["_source"]["session-id"]]= {
               "disk":[data[i]["_source"]["assigned-disk"], data[i]["_source"]["free-disk-space"]],
               "mem" : [data[i]["_source"]["assigned-mem"], data[i]["_source"]["free-mem"]]
             }
           }
        }
        component.setState({
          data: dataSet,
          loading:false,
          pieGraphData:pieData
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
          size: component.state.timeRange["graphSize"],
          gte:  component.state.timeRange["gte"],
          lte:  component.state.timeRange["lte"],
          interval : component.state.timeRange["interval"]
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
            lineGraphData: graphSet
          });
        }
      });
      request.fail(function(jqXHR, textStatus) {
        NotificationManager.error("Could not get system data" + textStatus);
      });
    }

    /*Function gets VM data based on the session id */
    export function getSessionData(component, propsDataRanges){
     var port   = location.port;
     var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
     var numberOfresults= propsDataRanges["size"];
     var currentNumberOfResults = 0;
     while(currentNumberOfResults < numberOfresults){
       var dataSet = component.newDate ? [] : component.state.data.slice();
       var pieData = Object.assign({}, component.state.pieGraphData);
       var request = $.ajax({
         url: apiURL + 'SessionViewTable',
         type: 'GET',
         data:{
           from: currentNumberOfResults,
           session: component.props.match.params.sesId,
           size: 10,
           gte: propsDataRanges["gte"],
           lte:  propsDataRanges["lte"]
         },
         dataType: 'json'
       });
       request.done( (msg) => {
         if(msg.results.hasOwnProperty("hits")){
           var data = msg.results.hits.hits;
           var index= parseInt(msg.page);
            for(var i =0; i<data.length; i++)
            {
              var num = index + i;
              if(dataSet.length < num)
              {
                dataSet.push(data[i]["_source"]);
                num = i;
              }else {
                  dataSet.splice(num,1,data[i]["_source"]);
              }
              var date = new Date(data[i]["_source"]["last-assignment"]);
              dataSet[num]["last-assignment"]=date.getFullYear()+"/"+date.getMonth()+"/"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds() + ":"+date.getMilliseconds();
              dataSet[num]["AvgCPU"]= Number(data[i]["_source"]["system-cpu-load"] * 100).toFixed(2);
              dataSet[num]["AvgMem"] =  data[i]["_source"]["system-mem-load"];
              pieData[data[i]["_source"]["instance-id"]]= {
                "disk":[data[i]["_source"]["assigned-disk"], data[i]["_source"]["free-disk-space"]],
                "mem" : [data[i]["_source"]["assigned-mem"], data[i]["_source"]["free-mem"]]
              }
            }
         }
          var resultsTotal = parseInt(msg.results.hits.total) + (parseInt(msg.results.hits.total)%10);
          if(index <= resultsTotal && component.isComponentMounted && msg.gte == propsDataRanges["gte"])
          {
            component.setState({
              data: dataSet,
              loading:false,
              pieGraphData:pieData
            });
          }
       });
       request.fail(function(jqXHR, textStatus) {
         NotificationManager.error("Could not get system data" + textStatus);
       });
       currentNumberOfResults = currentNumberOfResults + 10;
     }

    }

    export function getSessionGraphData(component,propsDataRanges){
      var port   = location.port;
      var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
      var graphSet = {};
      var request = $.ajax({
        url: apiURL + 'SessionViewGraph',
        type: 'GET',
        data:{
          time_zone: moment.tz.guess(),
          session: component.props.match.params.sesId,
          size: propsDataRanges["graphSize"],
          gte:  propsDataRanges["gte"],
          lte: propsDataRanges["lte"],
          interval : propsDataRanges["interval"]
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
            lineGraphData: graphSet
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
        if(component.state.data[index] != null){
          component.state.data[index]["Task-RUNNING"]= msg[0];
          component.state.data[index]["Task-SUCCESSFUL"]= msg[1];
          component.state.data[index]["Task-FAILED"]= msg[2];
          component.forceUpdate();
          //component.setState({ data: currentData})
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
         size: component.state.timeRange["size"],
         gte:  component.state.timeRange["gte"],
         lte:  component.state.timeRange["lte"]
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
