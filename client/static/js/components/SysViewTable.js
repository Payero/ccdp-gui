import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/SysViewTable.css";
import {getSystemData, getSystemGraphData} from './REST_helpers'
import {withRouter} from "react-router-dom";
import Graphs from './Graphs';
import {toggleSelectAll, toggleRow} from './Utils';
class SysViewTable extends Component {
  constructor(){
    super();
    this.state ={
      data : [],
      graphData:{},
      selected:{},
      selectAll:0,
      loading : true
    };
  }

  componentDidMount (){
    getSystemData(this)
    getSystemGraphData(this)
    this.interval= setInterval(()=> {
      getSystemData(this)
      getSystemGraphData(this)
    },4000);

  }
  componentWillUnmount() {
   clearInterval(this.interval);
 }
  render() {
    const {data,loading} = this.state;
    return (
      <div className="Sys-table">
        <header className="Sys-header">
          <h1 className="Sys-title">Cloud Computing Data Processing-System View</h1>
        </header>
        <ReactTable
          defaultSorted={[
            {
              id: "session-id",
              desc: false
            }
          ]}
          data= {data}
          loading={loading}
          pageSizeOptions={[10, 20, 25, 50, 100]}
          columns={[
            {
  						id: "checkbox",
  						accessor: "",
  						Cell: ({ original }) => {
  							return (
  								<input
  									type="checkbox"
  									className="checkbox"
  									checked={this.state.selected[original["session-id"]] === true}
  									onChange={() => toggleRow(this, original["session-id"])}
  								/>
  							);
  						},
  						Header: x => {
  							return (
  								<input
  									type="checkbox"
  									className="checkbox"
  									checked={this.state.selectAll === 1}
  									ref={input => {
  										if (input) {
  											input.indeterminate = this.state.selectAll === 2;
  										}
  									}}
  									onChange={() => toggleSelectAll(this, "session-id")}
  								/>
  							);
  						},
  						sortable: false,
  						width: 40,
              resizable: false
  					},
            {
              Header: "Session ID",
              accessor:"session-id",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=>this.props.history.push('/session'+rowInfo["row"]["session-id"])
              })
            },
            {
              Header:"Number of VM",
              accessor:"curVMnum",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=>this.props.history.push('/session'+rowInfo["row"]["session-id"])
              })
            },
            {
              Header:"Number of Task",
              accessor:"curTasknum",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=>this.props.history.push('/session'+rowInfo["row"]["session-id"])
              })
            },
            {
              Header:"Avg CPU (%)",
              accessor:"curAvgCPU",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=>this.props.history.push('/session'+rowInfo["row"]["session-id"])
              })

            },
            {
              Header:"Avg Mem (MB)",
              accessor:"curAvgMem",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=>this.props.history.push('/session'+rowInfo["row"]["session-id"])
              })
            }
          ]}
          minRows={10}
          defaultPageSize={10}
          className="-striped -highlight"
          noDataText={"No data found"}
          getTrProps={(state, rowInfo, column, instance) => ({
            style: {
              cursor: "pointer",
              backgroundColor:  rowInfo == null ? "#add8e6"
                : rowInfo["row"]["curAvgCPU"] >75 ? "#ffb3b3"
                : rowInfo["row"]["curAvgCPU"] >=30 ? "#d3f8d3"
                : "#add8e6"
            }
          })}
          style={{
            height: "414px" // This will force the table body to overflow and scroll, since there is not enough room
          }}
        />
        <Graphs data={this.state.graphData} selectedData={this.state.selected} length={this.state.data.length}/>
      </div>
    );
  }

}
export default withRouter(SysViewTable);
