import React, { Component } from 'react';
import "../../css/SignIn.css";
import {changeUserPassword } from './REST_helpers'
class ForgotPassword extends Component {
  constructor (props) {
    super(props);
    this.state = {
      Username: '',
      password: '',
      passwordCheck :'',
      resetPassword: false,
      userNotFound : false,
      passwordMatch:true
    };
    this.handleUserNameChange = this.handleUserNameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handlePasswordMatch = this.handlePasswordMatch.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleUserNameChange (e) {
   this.setState({Username: e.target.value});
  }
  handlePasswordChange (e) {
     this.setState({password: e.target.value});
  }
  handlePasswordMatch (e){
    if(e.target.value !== this.state.password)
    {
      this.setState({
        resetPassword: false,
        passwordMatch:false,
        passwordCheck : e.target.value
      });
    }
    else {
    this.setState({
      resetPassword: false,
      passwordMatch: true,
      passwordCheck : e.target.value
    });

    }
  }

  handleSubmit = formSubmitEvent => {
    formSubmitEvent.preventDefault();
    var userData = {
      Username : this.state.Username,
      Password : this.state.password
    };
    changeUserPassword(this, JSON.stringify(userData))
  };
  render () {
    return (
      <div className="formSection">
        <div className="passChangedsuccess">
          <p>{(this.state.resetPassword && !this.state.userNotFound) ? "You have succesfully reset the password" : ""}</p>
          <p>{(this.state.resetPassword && !this.state.userNotFound) ? "please Sign In now" : ""}</p>
        </div>
        <div className="UserNameNotFound">
         <p>{(!this.state.resetPassword && this.state.userNotFound) ? "The username was not found in our records" : ""}</p>
        </div>
        <h2>Reset Password</h2>
        <p>Please enter username and new password</p>
        <div className="Rows">
          <div className="LeftCol">
          <label for="Uemail"><i className="material-icons" >person</i></label>
          </div>
          <div className="RightCol">
          <input type="text" id="Uname2"  placeholder="Username" value={this.state.Username} onChange={this.handleUserNameChange}/>
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
        <div className="passwordMatch2">
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
        <div className="ForgotPass">
          <button  className="SaveButton" type="submit" onClick={this.handleSubmit}>Submit</button>
        </div>
      </div>
    );
  }
}


export default ForgotPassword;
