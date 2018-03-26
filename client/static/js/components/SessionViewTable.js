import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/SessionViewTable.css";
import ReactDOM from 'react-dom';
import $ from 'jquery';

class SessionViewTable extends Component {
  constructor(){
    super();
    this.state ={
      data : [],
      sizeOfData : 0
    };
  }
 getSystemData1(){
  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
  var dataSet = [];
  var request = $.ajax({
    url: apiURL + 'SessionViewTable',
    type: 'GET',
    dataType: 'json'
  });
  request.done( (msg) => {
   var data = msg.hits.hits;
   var status = ["RUNNING", "SUCCESSFUL", "FAILED"];
    for(var i =0; i<data.length; i++)
    {
    dataSet.push(data[i]["_source"])
   }
    this.setState({data: dataSet});
  });
  request.fail(function(jqXHR, textStatus) {
    NotificationManager.error("Could not get system data" + textStatus);
  });
}

get_number_task_perState(){
  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
  if(this.state.sizeOfData != this.state.data.length)
  {
    this.setState({
      sizeOfData : this.state.data.length
    });
    var currentData = this.state.data;

    currentData.forEach((obj, index)=>{
      var VMid = obj["instance-id"];

      var AvgCPU = obj["assigned-cpu"]
      if (AvgCPU != 0){
        AvgCPU = (AvgCPU/obj["total-cpu"])*100
      }
      currentData[index]["AvgCPU"]= AvgCPU
      var AvgMem = obj["assigned-mem"]
      if (AvgMem != 0){
        AvgMem = (AvgMem/obj["total-mem"])*100
      }
      currentData[index]["AvgMem"] = AvgMem
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
        currentData[index]["Task-RUNNING"]= msg[0]
        currentData[index]["Task-SUCCESSFUL"]= msg[1]
        currentData[index]["Task-FAILED"]= msg[2]
        this.setState({
        data:currentData
        })
      });
      request.fail(function(jqXHR, textStatus) {
        NotificationManager.error("Could not get system data" + textStatus);
      });
    });
  }
}

  componentDidMount (){
    this.getSystemData1();
    //this.get_number_task_perState();
  }
componentDidMount(){
  this.getSystemData1();
}
componentDidUpdate()
{
  this.get_number_task_perState();
}
  render() {
    const {data} = this.state;
    return (
      <div>
      <header className="Session-header">
        <h1 className="Session-title">Cloud Computing Data Processing-Session View</h1>
      </header>
        <ReactTable
           data= {data}
          columns={[
            {
              Header: "Instance ID",
              accessor:"instance-id"
            },
            {
              Header:"VM Status",
              accessor:"status"
            },
            {
              Header:"Task Running",
              accessor:"Task-RUNNING"
            },
            {
              Header:"Task Completed",
              accessor:"Task-SUCCESSFUL"
            },
            {
              Header:"Task Failed",
              accessor:"Task-FAILED"
            },
            {
              Header:"Avg CPU (%)",
              accessor:"AvgCPU"
            },
            {
              Header:"Avg Mem (MB)",
              accessor:"AvgMem"
            }

          ]}
          defaultPageSize={10}
          className="-striped -highlight"
        />
      </div>
    );
  }
}

export default SessionViewTable;
