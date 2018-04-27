import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/InstanceViewTable.css";
import {getTaskinVM} from './REST_helpers'
import {makeGraph} from './Utils';
import {toggleSelectAll, toggleRow} from './Utils';
import ReactJson from 'react-json-view';
class InstanceViewTable extends Component {
  constructor(){
    super();
    this.state ={
      data : [],
      selected:{},
      selectAll:0,
      loading : true
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
displayTaskFile(){

  let data = this.state.data.map((currentTask) => {
    if(this.state.selected.hasOwnProperty(currentTask["task-id"])){
      return (
        <div className="JSON-file">
          <ReactJson
            src={currentTask}
            theme={"apathy:inverted"}
            displayDataTypes={false}
            name={"Task context"}
          />
        </div>
      )
    }
  })
  return(
    <div className="JSON-display">
      {data}
    </div>
  )
}
  render() {
    const {data} = this.state;
    return (
      <div  className="Instance-table">
        <header className="Instance-header">
          <h1 className="Instance-title">Cloud Computing Data Processing-Instance View: {this.props.match.params.instance}</h1>
        </header>
        <ReactTable
        defaultSorted={[
          {
            id: "started",
            desc: false
          }
        ]}
          data= {data}
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
  									checked={this.state.selected[original["task-id"]] === true}
  									onChange={() => toggleRow(this, original["task-id"])}
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
  									onChange={() => toggleSelectAll(this, "task-id")}
  								/>
  							);
  						},
  						sortable: false,
  						width: 40,
              resizable: false
  					},
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
          minRows={10}
          defaultPageSize={10}
          className="-striped -highlight"
          noDataText={"No data found"}
          getTrProps={(state, rowInfo, column, instance) => ({
            style: {
              cursor: "pointer",
              backgroundColor:  rowInfo == null ? "#add8e6"
                : rowInfo["row"]["cpu"] >75 ? "#ffb3b3"
                : rowInfo["row"]["cpu"] >=30 ? "#d3f8d3"
                : "#add8e6"
            }
          })}
          style={{
            height: "414px" // This will force the table body to overflow and scroll, since there is not enough room
          }}
        />
        {this.displayTaskFile()}
      </div>
    );
  }
}

export default InstanceViewTable;
