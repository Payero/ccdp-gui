import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/SysViewTable.css";
import ReactDOM from 'react-dom';
import $ from 'jquery';
import SessionViewTable from './SessionViewTable';
import {
 Route,
 NavLink,
 HashRouter
} from "react-router-dom";

class SysViewTable extends Component {
  constructor(){
    super();
    this.state ={
      data : [],
      sessionId : ""
    };
  }
 getSystemData1(){
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
    return (
      <div>
        <header className="Sys-header">
          <h1 className="Sys-title">Cloud Computing Data Processing-System View</h1>
        </header>
        <ReactTable
           data= {data}
          columns={[
            {
              Header: "Session ID",
              accessor:"session-id"
            },
            {
              Header:"Number of VM",
              accessor:"curVMnum"
            },
            {
              Header:"Number of Task",
              accessor:"curTasknum"
            },
            {
              Header:"Avg CPU (%)",
              accessor:"curAvgCPU"
            },
            {
              Header:"Avg Mem (MB)",
              accessor:"curAvgMem"
            }
          ]}
          defaultPageSize={10}
          className="-striped -highlight"
          getTrProps={(state, rowInfo, column, instance) => ({
            onClick: (e, handleOriginal) => {
              console.log('click on :', rowInfo["row"]["session-id"])
              this.setState({sessionId:rowInfo["row"]["session-id"]})
            },
            style: {
              cursor: "pointer"
            }
          })}
        />
        <SessionViewTable sesId = {this.state.sessionId}/>
      </div>
    );
  }
}

export default SysViewTable;
