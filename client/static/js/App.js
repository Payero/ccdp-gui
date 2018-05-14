import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import '../css/App.css';
import SysViewTable from './components/SysViewTable';
import SessionViewTable from './components/SessionViewTable';
import InstanceViewTable from './components/InstanceViewTable';
import SettingsMenu from './components/settingsMenu';
import SignIn from './components/SignIn'
import {
  getApplicationSettings,
  saveApplicationNewSetting
} from './components/REST_helpers'
import {
 Route,
 withRouter,
 BrowserRouter,
 NavLink,
 hashHistory,
browserHistory
} from "react-router-dom";
class App extends Component {
  constructor () {
    super();
    this.state={
      settings: {
        timeDataRange: "Last Hour",
        tableSystemView: {},
        tableSessionView: {},
        tableInstanceView: {},
        graphSystem: {},
        graphSession: {},
        default : {}
      }
    }
    this.settingsData = this.settingsData.bind(this);
  }
  componentDidMount(){
    getApplicationSettings(this,1);
  }
  settingsData = (data) => {
    var newSetStateData = {};
    for(var key in data)
    {
        newSetStateData[key]=data[key]
    }
    if(newSetStateData["default"]["Set As Default"])
    {

        saveApplicationNewSetting(JSON.stringify(newSetStateData));
    }
    this.setState({
      settings: newSetStateData
    })
  }
  render() {
    const {settings} = this.state;
    return (
      <div>
        <ul className="NavigationBar">
          <li><NavLink exact to="/">System View</NavLink></li>
          <li><NavLink to="/session">Session View</NavLink></li>
          <li><NavLink to="/instance">Instance View</NavLink></li>
          <SettingsMenu passSettingsData={this.settingsData} currentSettingsData={settings}/>
          <SignIn/>
        </ul>
        <Route exact path='/' render = {() =>
          <SysViewTable
            timeDataRange={settings.timeDataRange}
            tableSystemView={settings.tableSystemView}
            graphTodisplay={settings.graphSystem}
          />}
        />
        {/*At some point later I need to figure out a btter way to do the path w/o using arrays*/}
        <Route path={['/session:sesId','/session']} render = {() =>
          <SessionViewTable
            timeDataRange={settings.timeDataRange}
            tableSessionView={settings.tableSessionView}
            graphTodisplay={settings.graphSession}
          />}
        />
        <Route path={['/instance:instance', '/instance']} render = {() =>
          <InstanceViewTable
            timeDataRange={settings.timeDataRange}
            tableInstanceView={settings.tableInstanceView}
          />}
        />
      </div>
    );
  }
}
export default App;

ReactDOM.render(
  <BrowserRouter history = {browserHistory}>
    <App/>
  </BrowserRouter>,
  document.getElementById('root')
);
