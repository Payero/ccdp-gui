import React, { Component } from 'react';
import {
  registerNewUser,
  checkUserName,
  checkEmail
} from './REST_helpers'
import "../../css/SignIn.css";

class SignUp extends Component {
  constructor (props) {
    super(props);
    this.state = {
      name :'',
      Username: '',
      availableUserName:true,
      passwordMatch : true,
      password : '',
      passwordCheck: '',
      created: false
    };
    this.handleUserNameChange = this.handleUserNameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handlePasswordMatch = this.handlePasswordMatch.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleUserNameChange (e) {
   checkUserName(this, e.target.value)
  }
  handlePasswordChange (e) {
     this.setState({password: e.target.value});
  }
  handlePasswordMatch (e){
    if(e.target.value !== this.state.password)
    {
      this.setState({
        created: false,
        passwordMatch:false,
        passwordCheck : e.target.value
      });
    }
    else {
    this.setState({
      created: false,
      passwordMatch: true,
      passwordCheck : e.target.value
    });

    }
  }

  handleSubmit = formSubmitEvent => {
    formSubmitEvent.preventDefault();
    var newUserData = {
      "Username" : this.state.Username,
      "Password" : this.state.password
    };
    if(this.state.availableUserName && this.state.passwordMatch){
      registerNewUser(this, JSON.stringify(newUserData))
    }


  };
  render () {
    return (
      <div className="formSection">
        <div className="registersuccess">
          <p>{this.state.created ? "You have registed succesfully please Sign In now" : ""}</p>
        </div>
        <div className="takenUserName">
         <p>{this.state.availableUserName ? "" : "The username is already taken"}</p>
        </div>
        <div className="Rows">
          <div className="LeftCol">
            <label for="Uname"><i className="material-icons" >person</i></label>
          </div>
          <div className="RightCol">
            <input type="text" id="Uname"
             placeholder="Username" value={this.state.Username}
             onChange={this.handleUserNameChange}
             style={{"outlineColor": this.state.availableUserName ? null : "red"} }
            />
        </div>
        </div>
        <div className="Rows">
          <div className="LeftCol">
            <label for="Pwd"><i className="material-icons" >vpn_key</i></label>
          </div>
          <div className="RightCol">
          <input type="text" id="password"
            placeholder="New Password" value={this.state.password}
            onChange={this.handlePasswordChange}
          />
          </div>
        </div>
        <div className="passwordMatch">
         <p>{this.state.passwordMatch ? "" : "The password do not match" }</p>
        </div>
        <div className="Rows">
          <div className="LeftCol">
            <label for="Pwd"><i className="material-icons" >vpn_key</i></label>
          </div>
          <div className="RightCol">
          <input type="text" id="password"
            placeholder="Retype New Password" value={this.state.passwordCheck}
            onChange={this.handlePasswordMatch}
            style={{"outlineColor": this.state.passwordMatch ? null : "red"} }
          />
          </div>
        </div>
        <div className="Sign_Up">
          <button  className="SaveButton" type="submit" onClick={this.handleSubmit}>Sign Up </button>
        </div>
      </div>
    );
  }
}


export default SignUp;
