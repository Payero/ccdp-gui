import React, { Component } from 'react';
import {Line} from 'react-chartjs-2';
import "../../css/Graphs.css"

class Graphs extends Component {
  constructor(props){
    super(props);
    this.state={
      data1:{},
      data2:{},
      options1:this.getOptions("CPU Load", "Time", "CPU (%)"),
      options2: this.getOptions("Memory", "Time", "Memory (MB)")
    }
  }
  componentDidUpdate(prevProps,prevState){
    if(Object.keys(this.props.data).length <=0)
    {
      return
    }
    if(this.state.data1.datasets.length == 0)
    {
        this.processIncomingData();
    }
    else {
      var thisLength= this.props.data["Labels"].length -1;
      var prevLength = prevProps.data["Labels"].length-1;
      if((Object.keys(this.props.selectedData).length !== Object.keys(prevProps.selectedData).length)||
          (this.props.data["Labels"][thisLength]!== prevProps.data["Labels"][prevLength]))
      {
        this.processIncomingData();
      }

    }
  }
  processIncomingData(){
    var newData = this.props.data;
    var graphSelected= this.props.selectedData;
    var length = this.props.length;
    var Labels = newData.Labels;
    //delete newData["Labels"]
    var DataSets1= [];
    var DataSets2= [];
    var r =63;
    var g = 63;
    var b = 255;
    if(Object.keys(graphSelected).length >0)
    {
      for(var keys in graphSelected)
      {
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
      DataSets1.push({
        label: key,
        data:newData[key]["cpu"],
        fill: false,
        lineTension:0.1,
        borderWidth: 2,
        borderColor :'rgba(' + r + ','+  g+',' + b+ ', 1.0)',
        backgroundColor:'rgba(' + r + ','+  g+',' + b+ ', 0.1)'
      });
      DataSets2.push({
        label: key,
        data:newData[key]["mem"],
        fill: false,
        lineTension:0.1,
        borderWidth: 2,
        borderColor :'rgba(' + r + ','+  g+',' + b+ ', 1.0)',
        backgroundColor:'rgba(' + r + ','+  g+',' + b+ ', 0.1)'
      });
    }
    var data1 = {
      labels:Labels,
      datasets:DataSets1
    };
    var data2 = {
      labels:Labels,
      datasets:DataSets2,
    };
    if(length>0){
      this.setState({
        data1:data1,
        data2:data2
      });
    }

  }

  getOptions(title, xTitle, yTitle)
  {
    var options = {
      legend:{
        labels:{
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

  render(){
    const {data1,data2,options1,options2} = this.state;
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


}

export default Graphs;
