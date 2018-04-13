import React, { Component } from 'react';
import {Line} from 'react-chartjs-2';
//import "../../css/Graphs.css"
import {randomColorGraph} from './Utils';

class Graphs extends Component {
  constructor(props){
    super(props);
    this.state={
      data1:{},
      data2:{},
      options1:{},
      options2:{}
    }
  }
  componentWillMount(){
    this.processIncomingData();
  }
  componentDidUpdate(prevProps,prevState)
  {
    if(prevProps.data !== this.props.data)
    {
      this.processIncomingData();
    }

  }
  processIncomingData(){
    var newData = this.props.data;
    var Labels = newData.Labels;
    var DataSets1= [];
    var DataSets2= [];
    var option1 = this.getOptions("CPU Load", "Time", "CPU (%)");
    var option2 = this.getOptions("Memory", "Time", "Memory (MB)");
    var r =63;
    var g = 63;
    var b = 255;
    for(var keys in newData)
    {
      if(keys == "Labels"){
        /*Do not do anything*/
      }
      else {
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
    var data1 = {
      labels:Labels,
      datasets:DataSets1
    };
    var data2 = {
      labels:Labels,
      datasets:DataSets2,

    };

    this.setState({
      data1:data1,
      data2:data2,
      options1:option1,
      options2:option2
    });
  }

  getOptions(title, xTitle, yTitle)
  {
    var options = {
      legend:{
        labels:{
          boxWidth: 3,
          fontColor:'black'
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      elements:{
        point: {
          radius: 0.5,
          hitRadius: 0.5,
          hoverRadius:0.5
        }
      },
      title: {
       display: true,
       text: title
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
      <div >
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
