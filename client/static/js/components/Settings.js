import React, { Component } from 'react';
import {toggleCheckboxChange} from './Utils';
import "../../css/SettingsStyle.css";

const DataRange = ["Last Hour", "Last Day", "Last Week", "Last Month", "Last 6 Months"];
const SystemView = ["Session Id", "VMs", "Tasks", "Avg. CPU (%)", "Avg. Mem (MB)"];
const SessionView = ["Instance Id", "Task Running", "Task Completed", "Task Failed","Avg. CPU (%)", "Avg. Mem (MB)" , "Last assigment"];
const InstanceView = ["Task Id", "State", "Started", "Completed", "Avg. CPU (%)", "Avg. Mem (MB)"];
const SystemGraph = ["CPU Load", "Memory"];
const SessionGraph = ["CPU Load", "Memory"];

class Settings extends Component {
 constructor(){
    super();
    this.state = {
      selectedCheckboxes : {
        'tableDataRange': '',
        'tableSystemView': {},
        'tableSessionView': {},
        'tableInstanceView': {},
        'graphDataRange': '',
        'graphSystem': {},
        'graphSession': {},
        'default' : {}
      }
    }
  }

  handleFormSubmit = formSubmitEvent => {
    formSubmitEvent.preventDefault();
    this.props.onSelectedData(this.state.selectedCheckboxes);
  }
  handleRadioOptionChange(label, dataSetName){
    const newSelected = Object.assign({}, this.state.selectedCheckboxes);
    newSelected[dataSetName] = label;
    this.setState({
     selectedCheckboxes: newSelected,
    });
  }
  createCheckbox = (label, dataSetName) => (
    <tr key={label.id}>
      <td>
        <label>
          <input
            type="checkbox"
            value={label}
            checked={this.state.selectedCheckboxes[dataSetName][label] === true}
            onChange={() => toggleCheckboxChange(this, label, dataSetName)}
          />
          {label}
        </label>
      </td>
    </tr>
  )
  createCheckboxes = (items, dataSetName) => (
    items.map((label, i) => {
      return(
        <tr key={i}>
          <td>
            <label>
              <input
                type="checkbox"
                value={label}
                checked={this.state.selectedCheckboxes[dataSetName][label] === true}
                onChange={() => toggleCheckboxChange(this, label, dataSetName)}
              />
              {label}
            </label>
          </td>
        </tr>
      );

    })
  )
  createRadioboxes =(items, dataSetName) => (
    items.map((label, i) => {
      return(
        <tr key={i}>
          <td>
            <label>
              <input
                type="radio"
                value={label}
                checked={this.state.selectedCheckboxes[dataSetName] === label}
                onChange={() => this.handleRadioOptionChange( label, dataSetName)}
              />
              {label}
            </label>
          </td>
        </tr>
      );

    })
  )
  render() {
    return (
      <div className="SettingsStyle">
        <form onSubmit={this.handleFormSubmit}>
          <h3>Tables</h3>
          <table id="outer-Table">
            <thead>
              <tr>
                <th> Data Range </th>
                <th> System View </th>
                <th> Session View </th>
                <th> Instance View </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createRadioboxes(DataRange, "tableDataRange")}
                    </tbody>
                  </table>
                </td>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(SystemView, "tableSystemView")}
                    </tbody>
                  </table>
                </td>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(SessionView, "tableSessionView")}
                    </tbody>
                  </table>
                </td>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(InstanceView, "tableInstanceView")}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="bottomSectionTable">
            <h3>Graphs</h3>
            <table id="outer-Table">
              <thead>
                <tr>
                  <th> Data Range </th>
                  <th>System Graphs </th>
                  <th> Session Graphs </th>
                </tr>
              </thead>
              <tbody>
              <tr>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createRadioboxes(DataRange, "graphDataRange")}
                    </tbody>
                  </table>
                </td>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(SystemGraph, "graphSystem")}
                    </tbody>
                  </table>
                </td>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(SessionGraph, "graphSession")}
                    </tbody>
                  </table>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div className="bottomSectionButtons">
            {this.createCheckbox("Set As Default", "default")}
            <button  className="SaveButton" type="submit">Save</button>
          </div>
        </form>
      </div>
    );
  }
}

export default Settings;
