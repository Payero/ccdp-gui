import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/InstanceViewTable.css";
import {getTaskinVM} from './REST_helpers'
import {withRouter} from "react-router-dom";
import {makeGraph} from './Utils';
import {
  dateRanges,
  InitializedTableColumns,
  updateTableColumns
} from './Utils';
import ReactJson from 'react-json-view';
class InstanceViewTable extends Component {
  constructor(props){
    super(props);
    this.state ={
      data : [],
      selected:{},
      selectAll:0,
      loading : true,
      columns:InitializedTableColumns(this, props.tableInstanceView, '','task-id','instance'),
      timeRange:dateRanges[props.timeDataRange],
    };
  }
componentDidMount (){
  getTaskinVM(this);
  this.interval3= setInterval(()=>   getTaskinVM(this),3000);
}
componentWillUnmount() {
 clearInterval(this.interval3);
}
componentDidUpdate(prevProps,prevState){
  if(this.state.timeRange != prevState.timeRange){
    getTaskinVM(this);
  }
}


componentWillReceiveProps(nextProps){
  updateTableColumns(this, nextProps.tableInstanceView, '','task-id','instance')
  this.setState({
    timeRange:dateRanges[nextProps.timeDataRange]
  })
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
    const {data,columns} = this.state;
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
          columns={columns}
          pageSizeOptions={[10, 20, 25, 50, 100]}
          minRows={10}
          defaultPageSize={10}
          className="-striped -highlight"
          noDataText={"No data found"}
          getTrProps={(state, rowInfo, column, instance) => ({
            style: {
              cursor: "pointer",
              backgroundColor:  rowInfo == null ? null
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

export default withRouter(InstanceViewTable);
