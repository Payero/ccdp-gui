import React, { Component } from 'react';
import {Line} from 'react-chartjs-2';
import "../../css/Graphs.css"

/*
graphData: array of objects that containts data to be plotted
xAxisName: name of the field in the object to be used for x Axis data
yAxisName: name of the field in the object to be used for y Axis data
xTitle : name to display for x Axis
yTitle : name to display for y Axis
title : graph  title
*/
export function makeGraph(graphData, xAxisName, yAxisName,xTitle, yTitle, title)
{
  if(graphData.length === 0){
    /*Nothing to do*/
  }
  else{
    var labels = []
    var data = []
    graphData.forEach((obj, index)=>{
      data.push(obj[yAxisName])
      //var label=obj[xAxisName].split(/-|T|Z/)
      labels.push(obj[xAxisName])
    });
    const options = {
      maintainAspectRatio: false,
      title: {
       display: true,
       text: title
     },
      tooltips: {
        mode: 'label'
      },
      hover: {
       mode: 'dataset'
      },
      scales: {
        xAxes: [
          {
            display: true,
            stacked:true,
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
            stacked:true,
            scaleLabel: {
              display: true,
              labelString: yTitle
            },
            ticks:{
              suggestedMax: 100
            }
          }
        ],
      }
    }
    const data = {
      labels:labels,
      datasets:[{
        label: "Avg CPU",
        data:data,
        fill: false,
        lineTension:0.1,
        borderColor :'rgba(63, 63, 255, 1.0)',
        backgroundColor :'rgba(63, 63, 255, 1.0)'

      }]
    };
    return (
      <div className="Graphs">
        <Line data={data} options={options}  height={475}/>
      </div>
    );
  }
}

export function randomColorGraph(opacity){

  return (
    'rgba(' + Math.round(Math.random() * 255) +
    ',' +Math.round(Math.random() * 255) + ',' +
    Math.round(Math.random() * 255) + ',' + (opacity || '.3') + ')'
  )

}
