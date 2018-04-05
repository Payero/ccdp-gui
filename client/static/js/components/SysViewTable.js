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
    this.interval= setInterval(()=> getSystemData(this),5000);
  }
  componentWillUnmount() {
   clearInterval(this.interval);
 }
  render() {
    const {data} = this.state;
    return (
      <div>
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
          defaultPageSize={10}
          className="-striped -highlight"
          getTrProps={(state, rowInfo, column, instance) => ({
            onClick: ()=>this.props.history.push('/session'+rowInfo["row"]["session-id"]),
            style: {
              cursor: "pointer",
              backgroundColor:  rowInfo == null ? "#d9ffb3"
                : rowInfo["row"]["curAvgCPU"] >=80 ? "#ffb3b3"
                : rowInfo["row"]["curAvgCPU"] >=55 ? "#ffff99"
                : "#d9ffb3"
            }
          })}
        />
        {makeGraph(data,"@timestamp" , "curAvgCPU","Time","CPU (%)", "Overall CPU")}
        {makeGraph(data, "@timestamp","curAvgMem", "Time","Memory (MB)", "Overall Memory")}
      </div>
    );
  }

}
export default withRouter(SysViewTable);
