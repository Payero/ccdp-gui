import React, { Component } from 'react';
import ReactTable from "react-table";
import "react-table/react-table.css";
import "../../css/SessionViewTable.css";
import {getSessionData, get_number_task_perState} from './REST_helpers'
import {withRouter} from "react-router-dom";
import {makeGraph} from './Utils';
import { Scrollbars } from 'react-custom-scrollbars';
class SessionViewTable extends Component {
  constructor(props){
    super(props);
    this.state ={
      data : [],
      instance : "",
    };
  }

componentDidMount (){
  getSessionData(this);
  this.interval2= setInterval(()=>{
    getSessionData(this);
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
    const {data} = this.state;
    return (
      <div  className="Session-table">
        <header className="Session-header">
          <h1 className="Session-title">Cloud Computing Data Processing-Session View: {this.props.match.params.sesId}</h1>
        </header>
        <Scrollbars style={{ height: 380}}>
          <ReactTable
            defaultSorteDesc={true}
            data= {data}
            columns={[
              {
                Header: "Instance ID",
                accessor:"instance-id"
              },
              {
                Header:"VM Status",
                accessor:"status"
              },
              {
                Header:"Task Running",
                accessor:"Task-RUNNING"
              },
              {
                Header:"Task Completed",
                accessor:"Task-SUCCESSFUL"
              },
              {
                Header:"Task Failed",
                accessor:"Task-FAILED"
              },
              {
                Header:"Avg CPU (%)",
                accessor:"AvgCPU"
              },
              {
                Header:"Avg Mem (MB)",
                accessor:"AvgMem"
              }

            ]}
            minRows={0}
            defaultPageSize={10}
            getTrProps={(state, rowInfo, column, instance) => ({
              onClick: ()=> this.props.history.push('/instance'+rowInfo["row"]["instance-id"]),
              style: {
                cursor: "pointer",
                backgroundColor:rowInfo == null ? "#add8e6"
                  : rowInfo["row"]["AvgCPU"] >75 ? "#ffb3b3"
                  : rowInfo["row"]["AvgCPU"] >=30 ? "#d3f8d3"
                  : "#add8e6"

              }
            })}
          />
        </Scrollbars>
      {makeGraph(data, "@timestamp","AvgCPU", "Time","CPU (%)", "Overall CPU ")}
      {makeGraph(data, "@timestamp","AvgMem", "Time","Memory (MB)", "Overall Memory")}
      </div>
    );
  }
}

export default withRouter(SessionViewTable);
