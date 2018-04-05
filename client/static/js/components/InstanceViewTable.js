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
  this.interval= setInterval(()=>   getTaskinVM(this),5000);
}
componentWillUnmount() {
 clearInterval(this.interval);
}
componentDidUpdate(prevProps){
  if(this.props.match.params.instance !== prevProps.match.params.instance){
    getTaskinVM(this);
  }
}
  render() {
    const {data} = this.state;
    return (
      <div>
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
              accessor:"curTasknum"
            },
            {
              Header:"Completed",
              accessor:"curTasknum"
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
          defaultPageSize={10}
          className="-striped -highlight"
          getTrProps={(state, rowInfo, column, instance) => ({
            style: {
              cursor: "pointer",
              backgroundColor:  rowInfo == null ? "#d9ffb3"
                : rowInfo["row"]["cpu"] >=80 ? "#ffb3b3"
                : rowInfo["row"]["cpu"] >=55 ? "#ffff99"
                : "#d9ffb3"
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
