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
     transform             : 'translate(-50%, -50%)',
     borderRadius          : '10px',
     padding               : '20px',
     background            : '#31455d',
     boxShadow            : "10px 10px 5px rgba(128, 128, 128, 0.37)"
   }
};
class SettingsMenu extends PureComponent {

  constructor (props) {
    super(props);
    this.state = {
      showModal: false,
      data: props.currentSettingsData
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDefault = this.handleDefault.bind(this)
  }
  componentWillReceiveProps(nextProps){
    this.setState({
      data: nextProps.currentSettingsData
    })

  }
  handleOpenModal () {
    this.setState({ showModal: true });
  }

  handleCloseModal (cancelBoolean) {
    this.setState({ showModal: false });
  }
  handleSubmit = (data) => {
    this.setState({ showModal: false});
    this.props.passSettingsData(data);
    this.props.chooseDefault(false);
  };
  handleDefault = (defaultBoolean) => {
    this.props.chooseDefault(defaultBoolean);
    this.setState({ showModal: false});
  }
  render () {
    return (
      <div className="SettingsButton">
        <button className="settingsMainButton"onClick={this.handleOpenModal}><i className="material-icons" >settings</i></button>
        <ReactModal
           isOpen={this.state.showModal}
           style={customStyles}
           contentLabel="Settings Modal"
        >
        <div className="InitialBorder">
          <h2>Configuration</h2>
          <div className="SecondBorder">
            <Settings onSelectedData={this.handleSubmit} onCancel={this.handleCloseModal} onDefault={this.handleDefault}settings={this.state.data}/>
          </div>
        </div>
        </ReactModal>
      </div>
    );
  }
}
export default SettingsMenu;
