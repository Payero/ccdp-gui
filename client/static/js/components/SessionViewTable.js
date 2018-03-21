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
      data : []
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
   var data = msg.hits.hits
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
  var dataSet = [];
  var request = $.ajax({
    url: apiURL + 'TaskState',
    type: 'GET',
    dataType: 'json'
  });
  request.done( (msg) => {
   var data = msg.hits.hits
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

  componentDidMount (){
    this.getSystemData1();
  }

  render() {
    const {data} = this.state;
    {console.log(data)}
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
              accessor:"Task-running"
            },
            {
              Header:"Task Completed",
              accessor:"Task-completed"
            },
            {
              Header:"Task Failed",
              accessor:"Task-failed"
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
