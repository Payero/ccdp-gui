import React, { PureComponent } from 'react';
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');
import Settings from './Settings';
import "../../css/SettingsStyle.css";
const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};
class SettingsMenu extends PureComponent {

  constructor () {
    super();
    this.state = {
      showModal: false,
      data: {}
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleOpenModal () {
    this.setState({ showModal: true });
  }

  handleCloseModal () {
    this.setState({ showModal: false });
  }
  handleSubmit = (data) => {
    console.log(data)
    this.setState({ showModal: false, data:data});
  };
  render () {
    return (
      <div className="SettingsButton">
        <button className="settingsMainButton"onClick={this.handleOpenModal}><i className="material-icons" >settings</i></button>
        <ReactModal
           isOpen={this.state.showModal}
           style={customStyles}
           contentLabel="Minimal Modal Example"
        >
        <div className="InitialBorder">
          <h2>Configuration</h2>
          <div className="SecondBorder">
            <Settings onSelectedData={this.handleSubmit}/>
            <div className="Cancel">
              <button className="CancelButton" onClick={this.handleCloseModal}>Cancel</button>
            </div>
          </div>
        </div>
        </ReactModal>
      </div>
    );
  }
}
export default SettingsMenu;
