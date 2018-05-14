import React from 'react';

export const DataRange = ["Last Hour", "Last Day", "Last Week", "Last Month", "Last 6 Months"];
export const SystemView = ["Session ID", "Number of VMs", "Number of Tasks", "Avg. CPU (%)", "Avg. Mem (MB)"];
export const SessionView = ["Instance ID","VM Status", "Task Running", "Task Completed", "Task Failed","Avg. CPU (%)", "Avg. Mem (MB)" , "Last assigment"];
export const InstanceView = ["Task ID", "State", "Started", "Completed", "Avg. CPU (%)", "Avg. Mem (MB)"];
export const SystemGraph = ["CPU Load", "Memory Load", "Disk Space", "Memory Space"];
export const SessionGraph = ["CPU Load", "Memory Load", "Disk Space", "Memory Space"];

export const dateRanges = {
  'Last Hour':{'gte':'now-1h' , 'lte': 'now', 'size':100, 'graphSize': 60, 'interval': '10s'},
  'Last Day':{ 'gte':'now-1d' , 'lte': 'now', 'size': 150, 'graphSize': 60, 'interval': '10m'},
  'Last Week':{'gte':'now-1w' , 'lte': 'now', 'size': 250, 'graphSize': 60, 'interval': '1h'},
  'Last Month':{'gte':'now-1M' , 'lte': 'now', 'size': 350, 'graphSize': 60,'interval': '12h'},
  'Last 6 Months':{'gte':'now-6M' , 'lte': 'now', 'size': 450,'graphSize': 60, 'interval': '1d'}
};

export const tableSystemViewData = {
  "Session ID": "session-id",
  "Number of VMs": "curVMnum",
  "Number of Tasks": "curTasknum",
  "Avg. CPU (%)": "curAvgCPU",
  "Avg. Mem (MB)": "curAvgMem"
};

export const tableSessionViewData = {
  "Instance ID": "instance-id",
  "VM Status": "status",
  "Task Running": "Task-RUNNING",
  "Task Completed":"Task-SUCCESSFUL",
  "Task Failed":"Task-FAILED",
  "Avg. CPU (%)": "AvgCPU",
  "Avg. Mem (MB)":"AvgMem",
  "Last assigment":"last-assignment"
};

export const tableInstanceViewData ={
  "Task ID": "task-id",
  "State": "state",
  "Started": "started",
  "Completed": "completed",
  "Avg. CPU (%)": "cpu",
  "Avg. Mem (MB)": "mem"
};

export const graphSessionData ={
  "CPU Load": "cpu",
  "Memory" :"mem"
}

export const graphSystemData = {
  "CPU Load": "cpu",
  "Memory" :"mem"
}

export function InitializedTableColumns(component, columnsData, path, ID_key,TableClass){
  var classObject = TableClass == "system" ? tableSystemViewData :
                    TableClass == "session" ? tableSessionViewData :
                    TableClass == "instance" ?tableInstanceViewData :
                    {};
  var DataArray = TableClass == "system" ? SystemView :
                  TableClass == "session" ? SessionView :
                  TableClass == "instance" ? InstanceView :
                  [];
  var columns = []
  columns.push({
    id: "checkbox",
    accessor: "",
    Cell: ({ original }) => {
      return (
        <input
        type="checkbox"
        className="checkbox"
        checked={component.state.selected[original[ID_key]] === true}
        onChange={() => toggleRow(component, original[ID_key])}
        />
      );
    },
    Header: x => {
      return (
        <input
        type="checkbox"
        className="checkbox"
        checked={component.state.selectAll === 1}
        ref={input => {
          if (input) {
            input.indeterminate = component.state.selectAll === 2;
          }
        }}
        onChange={() => toggleSelectAll(component,ID_key)}
        />
      );
    },
    sortable: false,
    width: 40,
    resizable: false
  });
  DataArray.forEach((key, i)=>{
    if(columnsData[key]){
      if(TableClass =="system" || TableClass == "session"){
        columns.push({
          Header: key,
          accessor:classObject[key],
          getProps:(state, rowInfo, column, instance) => ({
            onClick: ()=>component.props.history.push(path+rowInfo["row"][ID_key])
          })
        })
      }
      else{
        columns.push({
          Header: key,
          accessor:classObject[key]
        })
      }

    }
  });
  return columns;
}

export function updateTableColumns(component, columnsData, path, ID_key, TableClass){
  var classObject = TableClass == "system" ? tableSystemViewData :
                    TableClass == "session" ? tableSessionViewData :
                    TableClass == "instance" ?tableInstanceViewData :
                    {};
  var DataArray = TableClass == "system" ? SystemView :
                  TableClass == "session" ? SessionView :
                  TableClass == "instance" ? InstanceView :
                  [];
  var columns = [];
  columns.push({
    id: "checkbox",
    accessor: "",
    Cell: ({ original }) => {
      return (
        <input
        type="checkbox"
        className="checkbox"
        checked={component.state.selected[original[ID_key]] === true}
        onChange={() => toggleRow(component, original[ID_key])}
        />
      );
    },
    Header: x => {
      return (
        <input
        type="checkbox"
        className="checkbox"
        checked={component.state.selectAll === 1}
        ref={input => {
          if (input) {
            input.indeterminate = component.state.selectAll === 2;
          }
        }}
        onChange={() => toggleSelectAll(component,ID_key)}
        />
      );
    },
    sortable: false,
    width: 40,
    resizable: false
  });
  DataArray.forEach((key, i)=>{
    if(columnsData[key]){
      if(TableClass =="system" || TableClass == "session"){
        columns.push({
          Header: key,
          accessor:classObject[key],
          getProps:(state, rowInfo, column, instance) => ({
            onClick: ()=>component.props.history.push(path+rowInfo["row"][ID_key])
          })
        })
      }
      else{
        columns.push({
          Header: key,
          accessor:classObject[key]
        })
      }

    }
  });
  component.setState({
    columns: columns
  });
}

export function toggleCheckboxChange(component, label, dataSetName){
  const newSelected = Object.assign({}, component.state.selectedCheckboxes);
  newSelected[dataSetName][label] = !component.state.selectedCheckboxes[dataSetName][label];
  if(![dataSetName][label])
  {
    delete [dataSetName][label]
  }
  component.setState({
    selectedCheckboxes: newSelected,
  });

}

export function toggleRow(component, key){
  const newSelected = Object.assign({}, component.state.selected);
  newSelected[key] = !component.state.selected[key];
  if(!newSelected[key])
  {
    delete newSelected[key]
  }
  if(Object.keys(newSelected).length == 0)
  {
    component.setState({
      selected: newSelected,
      selectAll: 0
    });
  }
  else {
    component.setState({
      selected: newSelected,
      selectAll: 2
    });
  }

}

export function toggleSelectAll(component, key) {
  let newSelected = {};

  if (component.state.selectAll === 0) {
    component.state.data.forEach(x => {
      newSelected[x[key]] = true;
    });
  }
  component.setState({
    selected: newSelected,
    selectAll: component.state.selectAll === 0 ? 1 : 0
  });
}

export function randomColorGraph(opacity){

  return (
    'rgba(' + Math.round(Math.random() * 255) +
    ',' +Math.round(Math.random() * 255) + ',' +
    Math.round(Math.random() * 255) + ',' + (opacity || '.3') + ')'
  )

}
