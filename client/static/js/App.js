import React, { Component } from 'react';
import '../css/App.css';
//import {ReactiveBase, DataSearch} from '@appbaseio/reactivesearch';
//import SearchFiltetrs from './components/SearchFilters';
//import SearchData from './components/SearchData';
import SysViewTable from './components/SysViewTable';
import SessionViewTable from './components/SessionViewTable';
import InstanceViewTable from './components/InstanceViewTable';
class App extends Component {
  render() {
    return (
      <div className="App">
        <SysViewTable/>
        <SessionViewTable/>
        <InstanceViewTable/>
      </div>

    );
  }
}

export default App;
