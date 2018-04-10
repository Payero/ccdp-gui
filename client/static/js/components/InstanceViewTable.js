import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/InstanceViewTable.css";
import {getTaskinVM} from './REST_helpers'
import {makeGraph} from './Utils';
class InstanceViewTable extends Component {
  constructor(){
    super();
    this.state ={
      data : []
    };
  }
componentDidMount (){
  getTaskinVM(this);
  this.interval3= setInterval(()=>   getTaskinVM(this),3000);
}
componentWillUnmount() {
 clearInterval(this.interval3);
}
componentDidUpdate(prevProps){
  if(this.props.match.params.instance !== prevProps.match.params.instance){
    getTaskinVM(this);
  }
}
  render() {
    const {data} = this.state;
    return (
      <div  className="Instance-table">
        <header className="Instance-header">
          <h1 className="Instance-title">Cloud Computing Data Processing-Instance View: {this.props.match.params.instance}</h1>
        </header>
        <ReactTable
          defaultSorteDesc={true}
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
              accessor:"started"
            },
            {
              Header:"Completed",
              accessor:"completed"
            },
            {
              Header:"Avg CPU (%)",
              accessor:"cpu"
            },
            {
              Header:"Avg Mem (MB)",
              accessor:"mem"
            }
          ]}
          minRows={0}
          defaultPageSize={10}
          className="-striped -highlight"
          getTrProps={(state, rowInfo, column, instance) => ({
            style: {
              cursor: "pointer",
              backgroundColor:  rowInfo == null ? "#add8e6"
                : rowInfo["row"]["cpu"] >75 ? "#ffb3b3"
                : rowInfo["row"]["cpu"] >=30 ? "#d3f8d3"
                : "#add8e6"
            }
          })}
        />
        {makeGraph(data,"@timestamp" , "cpu","Time","CPU (%)", "Overall CPU")}
        {makeGraph(data, "@timestamp","mem", "Time","Memory (MB)", "Overall Memory")}
      </div>
    );
  }
}

export default InstanceViewTable;
