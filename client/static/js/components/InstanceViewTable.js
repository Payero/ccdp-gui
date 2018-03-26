import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/InstanceViewTable.css";
import ReactDOM from 'react-dom';
import $ from 'jquery';

class InstanceViewTable extends Component {
  constructor(){
    super();
    this.state ={
      data : []
    };
  }
 getTaskinVM(){
  var port   = location.port;
  var apiURL = "http://" + location.hostname + (port ? ':' + port : "") + "/v1/";
  var dataSet = [];
  var request = $.ajax({
    url: apiURL + 'VMviewTable',
    type: 'GET',
    data: {
      "vmId" : "i-mock-ddb45b7a8069",
    },
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
  this.getTaskinVM();
}

  render() {
    const {data} = this.state;
    return (
      <div>
        <header className="Instance-header">
          <h1 className="Instance-title">Cloud Computing Data Processing-Instance View</h1>
        </header>
        <ReactTable
           data= {data}
          columns={[
            {
              Header: "Task ID",
              accessor:"task-id"
            },
            {
              Header:"State",
              accessor:"state"
            },
            {
              Header:"Started",
              accessor:"curTasknum"
            },
            {
              Header:"Completed",
              accessor:"curTasknum"
            },
            {
              Header:"Avg CPU (%)",
              accessor:"curAvgCPU"
            },
            {
              Header:"Avg Mem (MB)",
              accessor:"mem"
            }
          ]}
          defaultPageSize={10}
          className="-striped -highlight"
        />
      </div>
    );
  }
}

export default InstanceViewTable;