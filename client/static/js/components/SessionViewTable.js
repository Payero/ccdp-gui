import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/SessionViewTable.css";
import {getSessionData, get_number_task_perState,getSessionGraphData} from './REST_helpers'
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
      graphData:{},
      selected:{},
      selectAll:0,
      loading : true,
      columns:InitializedTableColumns(this, props.tableSessionView, '/instance','instance-id','session'),
      timeRangeForTable:dateRanges[props.tableDataRange],
      timeRangeForGraph:dateRanges[props.graphDataRange],
    };
  }

componentDidMount (){
  getSessionData(this);
  getSessionGraphData(this);
  this.interval2= setInterval(()=>{
    getSessionData(this);
    getSessionGraphData(this);
  },7000);

}
componentWillUnmount() {
  clearInterval(this.interval2);
}

componentDidUpdate(prevProps,prevState){
  if(this.state.timeRangeForTable != prevState.timeRangeForTable){
    getSessionData(this);
  }
  if(this.state.timeRangeForGraph != prevState.timeRangeForGraph){
    getSessionGraphData(this);
  }
}
componentWillReceiveProps(nextProps){
  updateTableColumns(this, nextProps.tableSessionView, '/instance','instance-id','session')
  this.setState({
    timeRangeForTable:dateRanges[nextProps.tableDataRange],
    timeRangeForGraph:dateRanges[nextProps.graphDataRange],
  })
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
          getTrProps={(state, rowInfo, column, instance) => ({
            style: {
              cursor: "pointer",
              backgroundColor:rowInfo == null ? "#add8e6"
                : rowInfo["row"]["AvgCPU"] >75 ? "#ffb3b3"
                : rowInfo["row"]["AvgCPU"] >=30 ? "#d3f8d3"
                : "#add8e6"

            }
          })}
        />
        <Graphs data={this.state.graphData} selectedData={this.state.selected} length={this.state.data.length}/>
      </div>
    );
  }
}

export default withRouter(SessionViewTable);
