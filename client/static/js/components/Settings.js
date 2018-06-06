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
        'timeDataRange': props.settings['timeDataRange'],
        'tableSystemView': props.settings['tableSystemView'],
        'tableSessionView': props.settings['tableSessionView'],
        'tableInstanceView': props.settings['tableInstanceView'],
        'graphSystem': props.settings['graphSystem'],
        'graphSession': props.settings['graphSession']
      }
    }
  }

  componentWillReceiveProps(nextProps){
    this.setState({
      data: nextProps.settings
    })

  }
  handleFormSubmit = () => {
    this.props.onSelectedData(this.state.selectedCheckboxes);
  }

  handleForCancel =() =>{
    this.props.onCancel(true);
  }
  handleForDefault =() =>{
    this.props.onDefault(true);
  }

  handleRadioOptionChange(label, dataSetName){
    const newSelected = Object.assign({}, this.state.selectedCheckboxes);
    newSelected[dataSetName] = label;
    this.setState({
     selectedCheckboxes: newSelected,
    });
  }
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
        <div className="settingContainer">
          <div className="GeneralHeader">
            <h3> General </h3>
          </div>
          <div className="GraphHeader">
            <h3>Graphs</h3>
          </div>
          <div className="row2-col1">
            <table id="outer-Table">
              <thead>
                <tr>
                  <th> Data Time Range </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <table id="inner-table">
                      <tbody>
                        {this.createRadioboxes(DataRange, "timeDataRange")}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="row2-col2">
            <table id="outer-Table">
              <thead>
                <tr>
                  <th>System Graphs </th>
                </tr>
              </thead>
              <tbody>
              <tr>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(SystemGraph, "graphSystem")}
                    </tbody>
                  </table>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div className="row2-col3">
            <table id="outer-Table">
              <thead>
                <tr>
                  <th> Session Graphs </th>
                </tr>
              </thead>
              <tbody>
              <tr>
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
          <div className="TableHeader">
            <h3>Tables</h3>
          </div>
          <div className="row4-col1">
            <table id="outer-Table">
              <thead>
                <tr>
                  <th> System View </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <table id="inner-table">
                      <tbody>
                        {this.createCheckboxes(SystemView, "tableSystemView")}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="row4-col2">
            <table id="outer-Table">
              <thead>
                <tr>
                  <th> Session View </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <table id="inner-table">
                      <tbody>
                        {this.createCheckboxes(SessionView, "tableSessionView")}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="row4-col3">
            <table id="outer-Table">
              <thead>
                <tr>
                  <th> Instance View </th>
                </tr>
              </thead>
              <tbody>
                <tr>
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
          </div>
          <div className="loadsDefault">
            <button className="loadsButton" onClick={this.handleForDefault}>Load Default</button>
          </div>
          <div className="Save">
            <button  className="SaveButton" type="submit" onClick={this.handleFormSubmit}>Save</button>
          </div>
          <div className="Cancel">
            <button className="CancelButton" onClick={this.handleForCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }
}

export default Settings;
