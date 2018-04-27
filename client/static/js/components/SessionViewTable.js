import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/SessionViewTable.css";
import {getSessionData, get_number_task_perState,getSessionGraphData} from './REST_helpers'
import {withRouter} from "react-router-dom";
import Graphs from './Graphs';
import {toggleSelectAll, toggleRow} from './Utils';
class SessionViewTable extends Component {
  constructor(props){
    super(props);
    this.state ={
      data : [],
      graphData:{},
      selected:{},
      selectAll:0,
      loading : true
    };
  }

componentDidMount (){
  getSessionData(this);
  getSessionGraphData(this);
  this.interval2= setInterval(()=>{
    getSessionData(this);
    getSessionGraphData(this);
    get_number_task_perState(this);
  },8000);

}
componentWillUnmount() {
  clearInterval(this.interval2);
}
componentDidUpdate(prevProps,prevState)
{
  if( prevState.data.length <=0)
  {
    get_number_task_perState(this);
  }
}
  render() {
    const {data, graphData, loading} = this.state;
    return (
      <div  className="Session-table">
        <header className="Session-header">
          <h1 className="Session-title">Cloud Computing Data Processing-Session View: {this.props.match.params.sesId}</h1>
        </header>
        <ReactTable
          defaultSorteDesc={true}
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
                    checked={this.state.selected[original["instance-id"]] === true}
                    onChange={() => toggleRow(this, original["instance-id"])}
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
                    onChange={() => toggleSelectAll(this, "instance-id")}
                  />
                );
              },
              sortable: false,
              width: 40,
              resizable: false
            },
            {
              Header: "Instance ID",
              accessor:"instance-id",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=> this.props.history.push('/instance'+rowInfo["row"]["instance-id"])
              })
            },
            {
              Header:"VM Status",
              accessor:"status",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=> this.props.history.push('/instance'+rowInfo["row"]["instance-id"])
              })
            },
            {
              Header:"Task Running",
              accessor:"Task-RUNNING",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=> this.props.history.push('/instance'+rowInfo["row"]["instance-id"])
              })
            },
            {
              Header:"Task Completed",
              accessor:"Task-SUCCESSFUL",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=> this.props.history.push('/instance'+rowInfo["row"]["instance-id"])
              })
            },
            {
              Header:"Task Failed",
              accessor:"Task-FAILED",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=> this.props.history.push('/instance'+rowInfo["row"]["instance-id"])
              })
            },
            {
              Header:"Avg CPU (%)",
              accessor:"AvgCPU",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=> this.props.history.push('/instance'+rowInfo["row"]["instance-id"])
              })
            },
            {
              Header:"Avg Mem (MB)",
              accessor:"AvgMem",
              getProps:(state, rowInfo, column, instance) => ({
                onClick: ()=> this.props.history.push('/instance'+rowInfo["row"]["instance-id"])
              })
            }

          ]}
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
