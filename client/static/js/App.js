import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import '../css/App.css';
import SysViewTable from './components/SysViewTable';
import SessionViewTable from './components/SessionViewTable';
import InstanceViewTable from './components/InstanceViewTable';
import SettingsMenu from './components/settingsMenu';
import SignIn_SignUp from './components/SignIn_SignUp';
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
        graphSession: {}
      },
      default : false,
      islogin: false,
      username: '',
      password:''
    }
    this.settingsData = this.settingsData.bind(this);
    this.userInformation = this.userInformation.bind(this);
    this.chooseDefault = this.chooseDefault.bind(this);
  }
  componentDidMount(){
    getApplicationSettings(this,1);
  }
  componentDidUpdate(prevProps,prevState){
    if(this.state.islogin !== prevState.islogin){
        if(this.state.islogin == true){
          getApplicationSettings(this,this.state.username);
        }
        else{
          getApplicationSettings(this,1);
        }
    }
    else if(this.state.default !== prevState.default){
      if(this.state.default == true){
        getApplicationSettings(this,1);
      }

    }
  }
  settingsData = (data) => {
    this.setState({
      settings: data,
      default : false
    })
    if(this.state.islogin == true){
      data["username"] = this.state.username;
      data["Password"] = this.state.password;
      saveApplicationNewSetting(JSON.stringify(data))
    }
  }
  chooseDefault= (isdefault) => {
    console.log(isdefault)
    this.setState({
      default : isdefault
    })
  }
  userInformation =(Data) => {
    this.setState({
      islogin : Data.islogin,
      username : Data.userData.Username,
      password : Data.userData.Password
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
          <SettingsMenu passSettingsData={this.settingsData} currentSettingsData={settings} chooseDefault={this.chooseDefault}/>
          <SignIn_SignUp userInformation={this.userInformation}/>
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
