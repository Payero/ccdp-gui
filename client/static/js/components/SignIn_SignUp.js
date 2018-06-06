import React, { Component } from 'react';
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');
import "../../css/SignInUp.css";
import SignIn from './SignIn';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';
import {
 Route,
 withRouter,
 BrowserRouter,
 NavLink,
 hashHistory,
browserHistory
} from "react-router-dom";
const customStylesLogIn = {
   content : {
     top                   : '35%',
     left                  : '50%',
     right                 : 'auto',
     bottom                : '10%',
     transform             : 'translate(-50%, -50%)',
     borderRadius          : '10px',
     border                : '1.5px solid rgb(49, 69, 93)',
     padding               : '0px',
     boxShadow             : "10px 10px 5px rgba(128, 128, 128, 0.37)",
     overflow              : 'hidden'
   }
};
const customStylesLogOut = {
   content : {
     top                   : '35%',
     left                  : '50%',
     right                 : 'auto',
     bottom                : '40%',
     transform             : 'translate(-50%, -50%)',
     borderRadius          : '10px',
     border                : '1.5px solid rgb(49, 69, 93)',
     padding               : '0px',
     boxShadow             : "10px 10px 5px rgba(128, 128, 128, 0.37)",
     overflow              : 'hidden'
   }
};
class SignIn_SignUp extends Component {
  constructor (props) {
    super(props);
    this.state = {
      showModal: false,
      islogin: false,
      sectionToDisplace : "Sign In",
      userData:{}
    };
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleLogOut = this.handleLogOut.bind(this);
  }

  componentDidUpdate(prevProps,prevState){
    if(prevState.islogin !== null && this.state.islogin !== prevState.islogin){
      this.props.userInformation({islogin:this.state.islogin, userData : this.state.userData})
    }
  }
  handleOpenModal () {
    this.setState({ showModal: true });
  }

  handleCloseModal () {
    this.setState({ showModal: false });
  }
  handle_tab_change (tabName){
    if(tabName !== this.state.sectionToDisplace){
      this.setState({sectionToDisplace : tabName})
    }
  }
  handleLogOut(){
    this.setState({
      showModal: false,
      islogin: false,
      sectionToDisplace : "Sign In",
      userData:{}
    });
  }

  userDataSignIn =( userData) => {
    this.setState({
      showModal: false,
      islogin: true,
      userData: userData
    });
  }
 logIn_logOut(){
   if(this.state.islogin){
     return(
       <div>
         <div className="logOut">
          <h3> Sign Out </h3>
          <button className="CloseModalButton" onClick={this.handleCloseModal}><i className="material-icons" >close</i></button>
         </div>
         <div className="logOutBody">
            <h3> Hello {this.state.userData.Username}!</h3>
            <p>Please sign out before you go</p>
            <button  className="SaveButton" type="submit" onClick={this.handleLogOut}>Sign out</button>
         </div>
        </div>
     );
   }
   else{
     let SignInButton = this.state.sectionToDisplace == "Sign In" ? "activeButton" : "notActiveButton";
     let SignUpButton = this.state.sectionToDisplace == "Sign Up" ? "activeButton" : "notActiveButton";
     return(
       <div>
         <div className="tab_groups">
           <button className={SignInButton} onClick={this.handle_tab_change.bind(this,"Sign In")}> Sign In </button>
           <button className={SignUpButton} onClick={this.handle_tab_change.bind(this,"Sign Up")}> Sign Up </button>
           <button className="CloseModalButton" onClick={this.handleCloseModal}><i className="material-icons" >close</i></button>
         </div>
         {this.display_signIn_singUp()}
       </div>
     );
   }
 }
  display_signIn_singUp() {
    switch(this.state.sectionToDisplace){
      case "Sign In":
        return (
          <div>
            <SignIn userDataSignIn={this.userDataSignIn}/>
            <div className="forgotPassWord">
            <a className="btn" onClick={this.handle_tab_change.bind(this,"Forgot password")}>Forgot your password?</a>
            </div>
          </div>
        );
      case "Sign Up":
        return (<SignUp/> );
      case "Forgot password":
        return (<ForgotPassword />);
      default :
        /*do nothing*/
    }
  }
  render () {
    let ModalStyle = this.state.islogin ? customStylesLogOut : customStylesLogIn;
    return (
      <div className="SignInSection">
        <button className="SignInButton"onClick={this.handleOpenModal}><i className="material-icons" >person</i></button>
        <ReactModal
          isOpen={this.state.showModal}
          style={ModalStyle}
          contentLabel="Sign In modal"
        >
        {this.logIn_logOut()}
        </ReactModal>
      </div>
    );
  }
}


export default SignIn_SignUp;
