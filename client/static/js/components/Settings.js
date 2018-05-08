import React, { Component } from 'react';
import {toggleCheckboxChange} from './Utils';
import "../../css/SettingsStyle.css";
import {
  DataRange,
  SystemView,
  SessionView,
  InstanceView,
  SystemGraph,
  SessionGraph
}from './Utils';

class Settings extends Component {
 constructor(props){
    super(props);
    this.state = {
      selectedCheckboxes : {
        'tableDataRange': props.settings['tableDataRange'],
        'tableSystemView': props.settings['tableSystemView'],
        'tableSessionView': props.settings['tableSessionView'],
        'tableInstanceView': props.settings['tableInstanceView'],
        'graphDataRange': props.settings['graphDataRange'],
        'graphSystem': props.settings['graphSystem'],
        'graphSession': props.settings['graphSession'],
        'default' : props.settings['default']
      }
    }
  }

  componentWillReceiveProps(nextProps){
    this.setState({
      data: nextProps.settings
    })

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
                checked={this.state.selectedCheckboxes[dataSetName][label]=== true}
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
          <div className="defaultCheckbox">
            {this.createCheckbox("Set As Default", "default")}
          </div>
          <div className="Save">
            <button  className="SaveButton" type="submit">Save</button>
          </div>
        </form>
      </div>
    );
  }
}

export default Settings;
