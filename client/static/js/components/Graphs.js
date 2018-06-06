import React, { Component } from 'react';
import {Line,Pie,Doughnut} from 'react-chartjs-2';
import "../../css/Graphs.css"

class Graphs extends Component {
  constructor(props){
    super(props);
    this.state={
      pieMemData:{},
      pieDiskData: {},
      data1:{},
      data2:{},
      options1:this.getOptions("CPU Load", "Time", "CPU (%)"),
      options2: this.getOptions("Memory", "Time", "Memory (MB)"),
      options3:{},
      options4:{}
    }
    this.displayLineGraph = this.displayLineGraph.bind(this);
    this.displayPieGraph = this.displayPieGraph.bind(this);
  }
  componentDidUpdate(prevProps,prevState){

    if(Object.keys(this.props.data).length <=0)
    {
      return
    }
    else if(!this.state.data1.hasOwnProperty("datasets") || !prevProps.data.hasOwnProperty("Labels"))
    {
      this.setStateForNewProcessedData();
    }
    else {
      var thisLength= this.props.data["Labels"].length -1;
      var prevLength =  prevProps.data["Labels"].length-1;
      if((Object.keys(this.props.selectedData).length !== Object.keys(prevProps.selectedData).length)||
          (this.props.data["Labels"][thisLength]!== prevProps.data["Labels"][prevLength]))
      {
        this.setStateForNewProcessedData()
      }

    }
  }
  processCPUmemoryData(){
    var newData = this.props.data;
    var graphSelected= this.props.selectedData;
    var Labels = newData.Labels;
    var DataSets1= [];
    var DataSets2= [];
    var r =63;
    var g = 63;
    var b = 255;
    if(Object.keys(graphSelected).length >0)
    {
      for(var keys in graphSelected)
      {
        if(newData.hasOwnProperty(keys)){
          DataSets1.push({
            label: keys,
            data:newData[keys]["cpu"],
            fill: false,
            lineTension:0.1,
            borderWidth: 2,
            borderColor :'rgba(' + r + ','+  g+',' + b+ ', 1.0)',
            backgroundColor:'rgba(' + r + ','+  g+',' + b+ ', 0.1)'
          });
          DataSets2.push({
            label: keys,
            data:newData[keys]["mem"],
            fill: false,
            lineTension:0.1,
            borderWidth: 2,
            borderColor :'rgba(' + r + ','+  g+',' + b+ ', 1.0)',
            backgroundColor:'rgba(' + r + ','+  g+',' + b+ ', 0.1)'
          });
        }

        r = Math.abs((r - 2 )%255);
        g = Math.abs((g + 600)%255);
        b = Math.abs((b + 744)%255);
      }
    }
    else if(Object.keys(newData).length >0) {
      var key = ""
      if(newData.hasOwnProperty("DEFAULT"))
      {
        key = "DEFAULT"
      }
      else {
        key=Object.keys(newData)[Object.keys(newData).length-2];
      }
      if(newData.hasOwnProperty(keys)){
        DataSets1.push({
          label: keys,
          data:newData[keys]["cpu"],
          fill: false,
          lineTension:0.1,
          borderWidth: 2,
          borderColor :'rgba(' + r + ','+  g+',' + b+ ', 1.0)',
          backgroundColor:'rgba(' + r + ','+  g+',' + b+ ', 0.1)'
        });
        DataSets2.push({
          label: keys,
          data:newData[keys]["mem"],
          fill: false,
          lineTension:0.1,
          borderWidth: 2,
          borderColor :'rgba(' + r + ','+  g+',' + b+ ', 1.0)',
          backgroundColor:'rgba(' + r + ','+  g+',' + b+ ', 0.1)'
        });
      }
    }
    var CPULoadData = {
      labels:Labels,
      datasets:DataSets1
    };
    var MEMloadData = {
      labels:Labels,
      datasets:DataSets2,
    };

    return (
      {
        CPULoadData,
        MEMloadData
      }
    );
  }

  processDiskMemoryData(){
    var graphSelected= this.props.selectedData;
    var newData = this.props.pieData;
    var DiskLabel= ["Assigned Disk","Free Disk"];
    var MemoryLabel = ["Assigned Memory","Free Memory"];
    var DataSets1= [];
    var DataSets2= [];
    var newDataKeys = Object.keys(newData);
    var lengthNewData = newDataKeys.length;
    if(Object.keys(graphSelected).length == 0 &&  lengthNewData != 0)
    {
      var keys ="";
      if(newData.hasOwnProperty("DEFAULT"))
      {
        keys = "DEFAULT"
      }
      else {
        keys= newDataKeys[lengthNewData-1];
      }
      if(newData[keys]["disk"][0]!= 0 || newData[keys]["disk"][1]!= 0 ){
        DataSets1.push({
          label:keys,
          data:newData[keys]["disk"],
          backgroundColor: [
            "#FF6384",
            "#36A2EB"
          ],
          hoverBackgroundColor: [
            "#FF6384",
            "#36A2EB"
          ]
        });
      }
      if(newData[keys]["mem"][0]!=0 || newData[keys]["mem"][1]!=0){
        DataSets2.push({
          label:keys,
          data:newData[keys]["mem"],
          backgroundColor: [
            "#FF6384",
            "#36A2EB"
          ],
          hoverBackgroundColor: [
            "#FF6384",
            "#36A2EB"
          ]
        });
      }
    }else {
      for(var keys in graphSelected){
        if(newData[keys]["disk"][0]!= 0 || newData[keys]["disk"][1]!= 0 ){
          DataSets1.push({
            label:keys,
            data:newData[keys]["disk"],
            backgroundColor: [
              "#FF6384",
              "#36A2EB"
            ],
            hoverBackgroundColor: [
              "#FF6384",
              "#36A2EB"
            ]
          });
        }
        if(newData[keys]["mem"][0]!=0 || newData[keys]["mem"][1]!=0){
          DataSets2.push({
            label:keys,
            data:newData[keys]["mem"],
            backgroundColor: [
              "#FF6384",
              "#36A2EB"
            ],
            hoverBackgroundColor: [
              "#FF6384",
              "#36A2EB"
            ]
          });
        }
      }
    }
    var DiskSpaceData = {
      labels:DiskLabel,
      datasets:DataSets1
    };
    var MEMspaceData = {
      labels:MemoryLabel,
      datasets:DataSets2,
    };
    var options3 = {
      tooltips: {
         callbacks: {
           label: function(tooltipItem, data) {
             var label = data.datasets[tooltipItem.datasetIndex].label;
             var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
             return label + ': ' + value;
           }
         }
      },
      title: {
       display: true,
       text: "Disk Space",
       fontColor:'black',
       fontSize: 15
      },
      responsive:true,
    }
    var options4 ={
      tooltips: {
         callbacks: {
           label: function(tooltipItem, data) {
             var label = data.datasets[tooltipItem.datasetIndex].label;
             var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
             return label + ': ' + value;
           }
         }
      },
      title: {
       display: true,
       text: "Memory Space",
       fontColor:'black',
       fontSize: 15
      },
      responsive:true
    }
    return(
      {
        DiskSpaceData,
        MEMspaceData,
        options3,
        options4
    }
  );
  }

  setStateForNewProcessedData(){
    var linegraph = this.processCPUmemoryData();
    var piegraph = this.processDiskMemoryData();
    var length = this.props.length;
    if(length>0){
      this.setState({
        pieMemData:piegraph.MEMspaceData,
        pieDiskData:piegraph.DiskSpaceData,
        options3:piegraph.options3,
        options4:piegraph.options4,
        data1:linegraph.CPULoadData,
        data2:linegraph.MEMloadData,
      });
    }

  }
  getOptions(title, xTitle, yTitle){
    var options = {
      legend:{
      display: false,
        labels:{
          boxHeight:1,
          boxWidth: 3,
          fontColor:'black',
          fontSize: 10,
        }
      },
      maintainAspectRatio: false,
      animation:false,
      responsive:true,
      elements:{
        point: {
          radius: 0.5,
          hitRadius: 0.5,
          hoverRadius:0.5
        }
      },
      title: {
       display: true,
       text: title,
       fontColor:'black',
       fontSize: 15
      },
      scales: {
        xAxes: [
          {
            display: true,
            gridLines:{
              display:false
            },
            scaleLabel: {
              display: true,
              labelString: xTitle
            }
          }
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: yTitle
            },
            ticks:{
              suggestedMax: 100,
               suggestedMin: 0
            }
          }
        ],
      }
    }
    return options;
  }
  displayLineGraph (propsData,data1,data2,options1,options2){
    if(propsData["CPU Load"] && propsData["Memory Load"]){
      return(
        <div className="graph-container">
          <div className="Graphs">
            <Line data={data1} options={options1}  height={475}/>
          </div>
          <div className="Graphs">
            <Line data={data2} options={options2}  height={475}/>
          </div>
        </div>
      );
    }
    else if (propsData["CPU Load"]) {
      return(
        <div className="graph-container">
          <div className="Graphs">
            <Line data={data1} options={options1}  height={475}/>
          </div>
        </div>
      );
    }
    else if (propsData["Memory Load"]) {
      return(
        <div className="graph-container">
          <div className="Graphs">
            <Line data={data2} options={options2}  height={475}/>
          </div>
        </div>
      );
    }
  }
  displayPieGraph(propsData,pieMemData,pieDiskData, pieGraph){
      if(propsData["Disk Space"] && propsData["Memory Space"]){
        return(
          <div className="graph-container">
            <div className="Graphs">
              <Pie data={pieDiskData} options={this.state.options3} />
            </div>
            <div className="Graphs">
              <Pie data={pieMemData} options={this.state.options4} />
            </div>
          </div>
        );
      }
      else if (propsData["Disk Space"]) {
        return(
          <div className="graph-container">
            <div className="Graphs">
              <Pie data={pieDiskData} options={this.state.options3} />
            </div>
          </div>
        );
      }
      else if (propsData["Memory Space"]) {
        return(
          <div className="graph-container">
            <div className="Graphs">
              <Pie data={pieMemData} options={this.state.options4}/>
            </div>
          </div>
        );
      }
}

  render(){
    {this.processCPUmemoryData();}
    {this.processDiskMemoryData();}
    const {data1,data2,options1,options2, pieMemData,pieDiskData, pieGraph} = this.state;
    return(
      <div>
        {this.displayLineGraph(this.props.graphTodisplay,data1,data2,options1,options2)}
        {this.displayPieGraph(this.props.graphTodisplay,pieMemData,pieDiskData, pieGraph)}
      </div>
    );
  }


}

export default Graphs;
