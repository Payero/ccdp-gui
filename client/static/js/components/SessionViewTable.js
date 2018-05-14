import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/SessionViewTable.css";
import {getSessionData, getSessionGraphData, abortAllAjax} from './REST_helpers'
import {withRouter} from "react-router-dom";
import Graphs from './Graphs';
import {
  dateRanges,
  graphSessionData,
  InitializedTableColumns,
  updateTableColumns
} from './Utils';
class SessionViewTable extends Component {
  constructor(props){
    super(props);
    this.state ={
      data : [],
      lineGraphData:{},
      pieGraphData:{},
      selected:{},
      selectAll:0,
      loading : true,
      columns:InitializedTableColumns(this, props.tableSessionView, '/instance','instance-id','session'),
    };
    this.isComponentMounted = false;
    this.newDate = false;
  }

componentDidMount (){
  this.isComponentMounted = true;
  getSessionData(this, dateRanges[this.props.timeDataRange]);
  getSessionGraphData(this,dateRanges[this.props.timeDataRange]);
  this.interval2= setInterval(()=>{
    this.newDate = false;
    getSessionData(this,dateRanges[this.props.timeDataRange]);
    getSessionGraphData(this,dateRanges[this.props.timeDataRange]);
  },4000);

}
componentWillUnmount() {
  this.isComponentMounted = false;
  clearInterval(this.interval2);
}

componentDidUpdate(prevProps){
  if(Object.keys(this.props.tableSessionView).length !== Object.keys(prevProps.tableSessionView).length){
    updateTableColumns(this, this.props.tableSessionView, '/instance','instance-id','session')
  }
  if(this.props.timeDataRange !== prevProps.timeDataRange){
    this.newDate = true;
    getSessionData(this,dateRanges[this.props.timeDataRange]);
    getSessionGraphData(this,dateRanges[this.props.timeDataRange]);
  }
}

  render() {
    const {data, graphData, loading, columns} = this.state;
    return (
      <div  className="Session-table">
        <header className="Session-header">
          <h1 className="Session-title">Cloud Computing Data Processing-Session View: {this.props.match.params.sesId}</h1>
        </header>
        <ReactTable
          defaultSorteDesc={true}
          data= {data}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 20, 25, 50, 100]}
          minRows={10}
          defaultPageSize={10}
          style={{
            height: "414px" // This will force the table body to overflow and scroll, since there is not enough room
          }}
          noDataText={"No data found"}
          className="-striped -highlight"
          getTrProps={(state, rowInfo, column, instance) => ({
            style: {
              cursor: "pointer",
              backgroundColor:rowInfo == null ? null
                : rowInfo["row"]["AvgCPU"] >75 ? "#ffb3b3"
                : rowInfo["row"]["AvgCPU"] >=30 ? "#d3f8d3"
                : "#add8e6"

            }
          })}
        />
        <Graphs
          data={this.state.lineGraphData}
          selectedData={this.state.selected}
          length={this.state.data.length}
          graphTodisplay={this.props.graphTodisplay}
          pieData = { this.state.pieGraphData}
        />
      </div>
    );
  }
}

export default withRouter(SessionViewTable);
