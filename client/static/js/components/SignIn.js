import React, { Component } from 'react';
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');
import "../../css/SignIn.css";
const customStyles = {
   content : {
     top                   : '35%',
     left                  : '50%',
     right                 : 'auto',
     bottom                : '10%',
     transform             : 'translate(-50%, -50%)',
     borderRadius          : '10px',
     border                : '1.5px solid rgb(49, 69, 93)',
     padding               : '0px',
     boxShadow            : "10px 10px 5px rgba(128, 128, 128, 0.37)"
   }
};
class SignIn extends Component {
  constructor (props) {
    super(props);
    this.state = {
      showModal: false,
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  componentWillReceiveProps(nextProps){
    if(nextProps.currentSettingsData != null){
      if(this.props.currentSettingsData.tableDataRange!== nextProps.currentSettingsData.tableDataRange)
      {
        this.setState({
          data: nextProps.currentSettingsData
        })
      }
    }
  }
  handleOpenModal () {
    this.setState({ showModal: true });
  }

  handleCloseModal () {
    this.setState({ showModal: false });
  }
  handleSubmit = (data) => {
    this.setState({ showModal: false});
    this.props.passSettingsData(data);
  };
  render () {
    return (
      <div className="SignInSection">
        <button className="SignInButton"onClick={this.handleOpenModal}><i className="material-icons" >person</i></button>
        <ReactModal
          isOpen={this.state.showModal}
          style={customStyles}
          contentLabel="Sign In modal"
          onRequestClose={this.handleCloseModal}
        >
        <div className="LoginHeader">
          <h3> Sign In </h3>
        </div>
          <div className="formSection">
            <form onSubmit={this.handleFormSubmit}>
              <div className="Rows">
                <div className="LeftCol">
                  <label for="Uname"><i className="material-icons" >person</i></label>
                </div>
                <div className="RightCol">
                  <input type="text" id="fname"  placeholder="Username"/>
                </div>
              </div>
              <div className="Rows">
                <div className="LeftCol">
                  <label for="Pwd"><i className="material-icons" >vpn_key</i></label>
                </div>
                <div className="RightCol">
                <input type="text" id="lname" placeholder="Password"/>
                </div>
                </div>
                <div className="LogIn">
                  <button  className="SaveButton" type="submit">Login</button>
                </div>
            </form>
          </div>
        </ReactModal>
      </div>
    );
  }
}


export default SignIn;
