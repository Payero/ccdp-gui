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
      labels.push(obj[xAxisName])
    });
    const options = {
      title: {
       display: true,
       text: title
     },
      tooltips: {
        mode: 'label'
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              show: true,
              labelString: xTitle
            }
          }
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              show: true,
              labelString: yTitle
            }
          }
        ],
      },
      animation: false
    }
    const data = {
      labels:labels,
      datasets:[{
        label: "Avg CPU",
        data:data,
        fill: false,
        borderColor : 'rgba(127,63,191,0.61)',
        backgroundColor : 'rgba(127,63,191,0.61)',
        pointBorderColor : 'rgba(127,63,191,0.61)',
        pointBackgroundColor : '#ffff',
        pointBorderWidth : 0.2
      }]
    };
    return (
      <div className="Graphs">
        <Line data={data} options={options} />
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
