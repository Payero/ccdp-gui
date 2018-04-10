import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/SysViewTable.css";
import {getSystemData} from './REST_helpers'
import {withRouter} from "react-router-dom";
import {makeGraph} from './Utils';
class SysViewTable extends Component {
  constructor(){
    super();
    this.state ={
      data : [],
      sessionId : ""
    };
  }
  componentDidMount (){
    getSystemData(this)
    this.interval= setInterval(()=> getSystemData(this),4000);
  }
  componentWillUnmount() {
   clearInterval(this.interval);
 }
  render() {
    const {data} = this.state;
    return (
      <div className="Sys-table">
        <header className="Sys-header">
          <h1 className="Sys-title">Cloud Computing Data Processing-System View</h1>
        </header>
          <ReactTable
            defaultSorteDesc={true}
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
                accessor:"curAvgCPU",

              },
              {
                Header:"Avg Mem (MB)",
                accessor:"curAvgMem"
              }
            ]}
            minRows={0}
            defaultPageSize={10}
            className="-striped -highlight"
            getTrProps={(state, rowInfo, column, instance) => ({
              onClick: ()=>this.props.history.push('/session'+rowInfo["row"]["session-id"]),
              style: {
                cursor: "pointer",
                backgroundColor:  rowInfo == null ? "#add8e6"
                  : rowInfo["row"]["curAvgCPU"] >75 ? "#ffb3b3"
                  : rowInfo["row"]["curAvgCPU"] >=30 ? "#d3f8d3"
                  : "#add8e6"
              }
            })}
          />
        <div className="Left-col">
          {makeGraph(data,"@timestamp" , "curAvgCPU","Time","CPU (%)", "Overall CPU")}
        </div>
        <div className="Right-col">
          {makeGraph(data, "@timestamp","curAvgMem", "Time","Memory (MB)", "Overall Memory")}
        </div>
      </div>
    );
  }

}
export default withRouter(SysViewTable);
