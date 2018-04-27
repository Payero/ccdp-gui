import React, { Component } from 'react';
import Checkbox from './Checkbox';
import "../../css/SettingsStyle.css";
const DataRange = ["Last Hour", "Last Day", "Last Week", "Last Month", "Last 6 Months"];

const SystemView = ["Session Id", "VMs", "Tasks", "Avg. CPU (%)", "Avg. Mem (MB)"];

const SessionView = ["Instance Id", "Task Running", "Task Completed", "Task Failed","Avg. CPU (%)", "Avg. Mem (MB)" ];

const InstanceView = ["Task Id", "State", "Started", "Completed", "Avg. CPU (%)", "Avg. Mem (MB)"];

class Settings extends Component {

  componentWillMount = () => {
    this.selectedCheckboxes = new Set();
  }

  toggleCheckbox = label => {
    if (this.selectedCheckboxes.has(label)) {
      this.selectedCheckboxes.delete(label);
    } else {
      this.selectedCheckboxes.add(label);
    }
  }

  handleFormSubmit = formSubmitEvent => {
    formSubmitEvent.preventDefault();
    for (const checkbox of this.selectedCheckboxes) {
      console.log(checkbox, 'is selected.');
    }
    this.props.onSelectedData(this.selectedCheckboxes);
  }

  createCheckbox = label => (
    <tr key={label.id}>
      <td>
        <Checkbox
        label={label}
        handleCheckboxChange={this.toggleCheckbox}
        key={label}
        />
      </td>
    </tr>
  )

  createCheckboxes = (items) => (
    items.map((item, i) => {
      return(
        <tr key={i}>
          <td>
            <Checkbox
            label={item}
            handleCheckboxChange={this.toggleCheckbox}
            key={item}
            />
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
                      {this.createCheckboxes(DataRange)}
                    </tbody>
                  </table>
                </td>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(SystemView)}
                    </tbody>
                  </table>
                </td>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(SessionView)}
                    </tbody>
                  </table>
                </td>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(InstanceView)}
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
                  <th>System Graph </th>
                  <th> Session Graphs </th>
                </tr>
              </thead>
              <tbody>
              <tr>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(DataRange)}
                    </tbody>
                  </table>
                </td>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(SystemView)}
                    </tbody>
                  </table>
                </td>
                <td>
                  <table id="inner-table">
                    <tbody>
                      {this.createCheckboxes(SessionView)}
                    </tbody>
                  </table>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div className="bottomSectionButtons">
            {this.createCheckbox("Set As Default")}
            <button  className="SaveButton" type="submit">Save</button>
          </div>
        </form>
      </div>
    );
  }
}

export default Settings;
