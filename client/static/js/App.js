import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import '../css/App.css';
import SysViewTable from './components/SysViewTable';
import SessionViewTable from './components/SessionViewTable';
import InstanceViewTable from './components/InstanceViewTable';
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
      <div className="App">
        {this.props.children}
      </div>

    );
  }
}
export default App;

ReactDOM.render(
  <BrowserRouter history = {browserHistory}>
    <Route path='/' componenet={App}>
      <div className="App">
        <div>
          <ul className="header">
            <li><NavLink exact to="/" activeClassName="active">System View</NavLink></li>
            <li><NavLink to="/session" activeClassName="active">Session View</NavLink></li>
            <li><NavLink to="/instance" activeClassName="active">Instance View</NavLink></li>
          </ul>
        </div>
        <Route exact path='/' component={SysViewTable}/>
        {/*At some point later I need to figure out a btter way to do the path w/o using arrays*/}
        <Route path={['/session:sesId','/session']} component={SessionViewTable}/>
        <Route path={['/instance:instance', '/instance']} component={InstanceViewTable}/>
      </div>
    </Route>
  </BrowserRouter>,
  document.getElementById('root')
);
