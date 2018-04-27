import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import '../css/App.css';
import SysViewTable from './components/SysViewTable';
import SessionViewTable from './components/SessionViewTable';
import InstanceViewTable from './components/InstanceViewTable';
import SettingsMenu from './components/settingsMenu';

import {
 Route,
 withRouter,
 BrowserRouter,
 NavLink,
 hashHistory,
browserHistory
} from "react-router-dom";

class App extends Component {
  render() {
    return (
      <div>
        {this.props.children}
      </div>

    );
  }
}
export default App;

ReactDOM.render(
  <BrowserRouter history = {browserHistory}>
    <Route path='/' componenet={App}>
      <div>
          <ul className="NavigationBar">
            <li><NavLink exact to="/">System View</NavLink></li>
            <li><NavLink to="/session">Session View</NavLink></li>
            <li><NavLink to="/instance">Instance View</NavLink></li>
            <SettingsMenu/>
          </ul>
        <Route exact path='/' component={SysViewTable}/>
        {/*At some point later I need to figure out a btter way to do the path w/o using arrays*/}
        <Route path={['/session:sesId','/session']} component={SessionViewTable}/>
        <Route path={['/instance:instance', '/instance']} component={InstanceViewTable}/>
      </div>
    </Route>
  </BrowserRouter>,
  document.getElementById('root')
);
