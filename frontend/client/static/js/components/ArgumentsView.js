var ModalView = require('./ModalView.js');
var ControlLabel = require('react-bootstrap').ControlLabel;
var Button = require('react-bootstrap').Button;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var Form = require('react-bootstrap').Form;
var Col = require('react-bootstrap').Col;
var Checkbox = require('react-bootstrap').Checkbox;
var FontAwesome = require('react-fontawesome');
import get from 'lodash.get';
import set from 'lodash.set';
import merge from 'lodash.merge';


class ArgumentsView extends ModalView {

  constructor(props, context) {
    super(props, context);

    this.state = {
      arguments: this.props.arguments
    }
  }

  //Provide two-way data binding, based on code found at
  //https://objectpartners.com/2017/04/28/two-way-data-binding-in-reactjs-part-iii/
  bindModel(context) {
    return {
      model(path) {
          const value = get(context.state, path, '');

          return {
            value,
            checked: value || false,

            onChange(event) {
              const originalValue = value;
              const target = event.target;
              const newValue = target.type === 'checkbox' ? target.checked : target.value;

              const newState = {};
              set(newState, path, newValue);

              // remember, we cannot call set() directly on the state object,
              // because mutating the state object has unexpected results
              context.setState(merge(context.state, newState));

              if (typeof context.handleChange === 'function') {
                context.handleChange(path, newValue, originalValue);
              }
            }
          };
      },
      arrayItem(pathToArray, index, arrayElementSubPath) {
        const stateArray = get(context.state, pathToArray, null) || [];

        const value = arrayElementSubPath ?
                        get(stateArray[index], arrayElementSubPath, '') :
                          stateArray[index];

        return {
          value: value || '',
          checked: value || false,

          onChange(event) {
            const originalValue = value;
            const target = event.target;
            const newValue = target.type === 'checkbox' ? target.checked : target.value;

            if (arrayElementSubPath) {
              set(stateArray[index], arrayElementSubPath, newValue);
            } else {
              stateArray[index] = newValue;
            }

            const newState = {};
            set(newState, pathToArray, stateArray);

            context.setState(merge(context.state, newState));

            if (typeof context.handleChange === 'function') {
              context.handleChange(pathToArray, index, newValue, originalValue, arrayElementSubPath);
            }
          }
        };
      }
    }
  }

  render() {
    this.modalBody = this.createModalBody(this.props.arguments);
    return super.render();
  }

  shouldComponentUpdate(nextProps, nextState) {
    this.props.handleSetArgs([...this.state.arguments]);
    return true;
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
    const {model, arrayItem} = this.bindModel(this);
    return (
      <div>
        <Form horizontal>
        <FormGroup>
          <Col sm={4}>
            <ControlLabel>Name</ControlLabel>
          </Col>
          <Col sm={5}>
            <ControlLabel>Default Vallue</ControlLabel>
          </Col>
          <Col sm={1}>
            <ControlLabel>Flag</ControlLabel>
          </Col>
          <Col sm={2}>
            <ControlLabel>Delete</ControlLabel>
          </Col>
        </FormGroup>
        {this.state.arguments.map((arg, idx) => {
          return (<FormGroup key={idx}>
                    <Col sm={4}>
                      <FormControl type="text"  {...arrayItem('arguments', idx, '_name')}  />
                    </Col>
                    <Col sm={5}>
                      {arg._flag ?
                        <FormControl disabled type="text" {...arrayItem('arguments', idx, '_value')}  /> :
                        <FormControl type="text" {...arrayItem('arguments', idx, '_value')}  />
                      }
                    </Col>
                    <Col sm={1}>
                      <Checkbox {...arrayItem('arguments', idx, '_flag')} />
                    </Col>
                    <Col sm={2}>
                      <Button onClick={this.removeArg(idx)}>
                        <i className="fa fa-ban"></i>
                      </Button>
                    </Col>
                  </FormGroup>);
        })}
          <FormGroup>
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
