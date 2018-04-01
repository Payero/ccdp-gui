var ModalView = require('./ModalView.js');
var DataBinding = require('./DataBinding.js');
var ControlLabel = require('react-bootstrap').ControlLabel;
var Button = require('react-bootstrap').Button;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var Form = require('react-bootstrap').Form;
var Col = require('react-bootstrap').Col;
var Checkbox = require('react-bootstrap').Checkbox;
var FontAwesome = require('react-fontawesome');
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var Popover = require('react-bootstrap').Popover;

class ArgumentsView extends ModalView {

  constructor(props, context) {
    super(props, context);

    this.state = {
      arguments: this.props.arguments
    }
  }

  /* Called by DataBinding.js if implemented. Provide additional on-change
   * behavior here if needed*/
  // handleChange(pathToArray, index, newValue, originalValue, arrayElementSubPath) {
  //
  // }

  render() {
    this.modalBody = this.createModalBody();
    return super.render();
  }

  shouldComponentUpdate(nextProps, nextState) {
    this.props.handleSetArgs([...this.state.arguments]);
    return true;
  }

  componentWillReceiveProps(nextProps) {
    this.setState({arguments: nextProps.arguments});
  }

  removeArg(idx) {
    return () => {
      this.setState((prev) => {
        let args = prev.arguments;
        args.splice(idx, 1)
        return {arguments: args};
      });
    }
  }

  createModalBody() {
    const {model, arrayItem} = new DataBinding().bindModel(this);
    const argStringPopover = (<Popover id="arg_str_po">
        Argument name and default value (if applicable). See Argument Help for syntax
      </Popover>);
    const namePopover = (<Popover id="name_po">
      Argument name as it will be displayed to the user when excuting the module
    </Popover>);
    const tooltipPopover = (<Popover id="tooltip_po">
      Tooltip help to be displayed to the user when excuting the module
      </Popover>);
    const modifiablePopover = (<Popover id="mod_po">
      Whether the argument can be modified by the user when executing the module
      </Popover>);
    return (
      <div>
        <Form horizontal>
        <FormGroup>
          <Col sm={1} />
          <Col sm={3}>
            <OverlayTrigger placement="right" overlay={argStringPopover}>
              <ControlLabel>Argument String</ControlLabel>
            </OverlayTrigger>
          </Col>
          <Col sm={3}>
            <OverlayTrigger placement="right" overlay={namePopover}>
              <ControlLabel>Display Name</ControlLabel>
            </OverlayTrigger>
          </Col>
          <Col sm={3}>
            <OverlayTrigger placement="right" overlay={tooltipPopover}>
              <ControlLabel>Tooltip Text</ControlLabel>
            </OverlayTrigger>
          </Col>
          <Col sm={1}>
            <OverlayTrigger placement="right" overlay={modifiablePopover}>
              <ControlLabel>Modifiable</ControlLabel>
            </OverlayTrigger>
          </Col>
        </FormGroup>
        {this.state.arguments.map((arg, idx) => {
          return (<FormGroup key={idx}>
                    <Col sm={1}>
                      <Button onClick={this.removeArg(idx)} style={{border: 'none', position:'absolute', right:'0px'}}>
                        <i style={{right:'90%'}} className="fa fa-trash"></i>
                      </Button>
                    </Col>
                    <Col sm={3}>
                      <FormControl type="text"  {...arrayItem('arguments', idx, 'argstring')}  />
                    </Col>
                    <Col sm={3}>
                        <FormControl type="text" {...arrayItem('arguments', idx, 'name')}  />
                    </Col>
                    <Col sm={3}>
                        <FormControl type="text" {...arrayItem('arguments', idx, 'tooltip')}  />
                    </Col>
                    <Col sm={1}>
                      <Checkbox style={{left:'45%'}} {...arrayItem('arguments', idx, 'modifiable')} />
                    </Col>
                  </FormGroup>);
        })}
        <FormGroup>
          <Col sm={2}>
            <Button bsStyle='primary' onClick={this.props.showArgHelp}>
               <i className="fa fa-question-circle"></i>{' '}Argument Help
            </Button>
          </Col>
          <Col smOffset={10}>
            <Button bsStyle='primary' onClick={this.props.addArgHandler}>
               <i className="fa fa-plus"></i>{' '}Add Arg
            </Button>
          </Col>
        </FormGroup>
        </Form>
      </div>
    );
  }
}

module.exports = ArgumentsView;
