import React, { Component } from 'react';
import "../../css/SignIn.css";
import {signInFunction } from './REST_helpers'
class SignIn extends Component {
  constructor (props) {
    super(props);
    this.state = {
      Username: '',
      password : '',
      isInformationValid: false,
      retypedData : false
    };
    this.handleUserNameChange = this.handleUserNameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidUpdate(prevProps,prevState){
    if(this.state.isInformationValid !== prevState.isInformationValid){
      if(this.state.isInformationValid){
        var userData = {
          Username : this.state.Username,
          Password : this.state.password
        };
        this.props.userDataSignIn(userData);
      }
    }
  }
  handleUserNameChange (e) {
   this.setState({Username: e.target.value});
  }

  handlePasswordChange (e) {
     this.setState({password: e.target.value});
  }

  handleSubmit = formSubmitEvent => {
    formSubmitEvent.preventDefault();
    var userData = {
      Username : this.state.Username,
      Password : this.state.password
    };
    signInFunction(this, JSON.stringify(userData))
  };
  render () {
    return (
      <div className="formSection">
        <div className="wrongInput">
          <p>{this.state.retypedData ? "The information Does not match data on file" : ""}</p>
        </div>
        <div className="Rows">
          <div className="LeftCol">
            <label for="Uname"><i className="material-icons" >person</i></label>
          </div>
          <div className="RightCol">
            <input type="text" id="fname"  placeholder="Username" value={this.state.Username} onChange={this.handleUserNameChange}/>
          </div>
        </div>
        <div className="Rows">
          <div className="LeftCol">
            <label for="Pwd"><i className="material-icons" >vpn_key</i></label>
          </div>
          <div className="RightCol">
          <input type="text" id="password" placeholder="Password" value={this.state.password} onChange={this.handlePasswordChange}/>
          </div>
        </div>
        <div className="LogIn">
          <button  className="SaveButton" type="submit" onClick={this.handleSubmit}>Login</button>
        </div>
      </div>
    );
  }
}


export default SignIn;
