import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/SysViewTable.css";
import {getSystemData, getSystemGraphData} from './REST_helpers'
import {withRouter} from "react-router-dom";
import Graphs from './Graphs';
import {
  dateRanges,
  graphSystemData,
  InitializedTableColumns,
  updateTableColumns
} from './Utils';
class SysViewTable extends Component {
  constructor(props){
    super(props);
    this.state ={
      data : [],
      lineGraphData:{},
      pieGraphData:{},
      selected:{},
      selectAll:0,
      loading : true,
      columns:InitializedTableColumns(this,props.tableSystemView, '/session','session-id', "system"),
      timeRange:dateRanges[props.timeDataRange],
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
  componentDidUpdate(prevProps,prevState){
    if(this.state.timeRange != prevState.timeRange){
      getSystemData(this);
      getSystemGraphData(this);
    }
  }
  componentWillReceiveProps(nextProps){
    updateTableColumns(this,nextProps.tableSystemView, '/session','session-id',"system")
    this.setState({
      timeRange:dateRanges[nextProps.timeDataRange]
    })
  }

  render() {
    const {data,loading, columns} = this.state;
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
      columns={columns}
      loading={loading}
      pageSizeOptions={[10, 20, 25, 50, 100]}
      minRows={10}
      defaultPageSize={10}
      className="-striped -highlight"
      noDataText={"No data found"}
      className="-striped -highlight"
      getTrProps={(state, rowInfo, column, instance) => ({
        style: {
          cursor: "pointer",
          backgroundColor:  rowInfo == null ? null
          : rowInfo["row"]["curAvgCPU"] >75 ? "#ffb3b3"
          : rowInfo["row"]["curAvgCPU"] >=30 ? "#d3f8d3"
          : "#add8e6"
        }
      })}
      style={{
        height: "414px" // This will force the table body to overflow and scroll, since there is not enough room
      }}
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
export default withRouter(SysViewTable);
