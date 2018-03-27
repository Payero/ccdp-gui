import React, { Component } from 'react';
import '../css/App.css';
import SysViewTable from './components/SysViewTable';
class App extends Component {
  render() {
    return (
      <div className="App">
        <SysViewTable/>
      </div>

    );
  }
}

export default App;
