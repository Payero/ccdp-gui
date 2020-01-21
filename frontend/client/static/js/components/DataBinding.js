import get from 'lodash.get';
import set from 'lodash.set';
import merge from 'lodash.merge';

//Provide two-way data binding, based on code found at
//https://objectpartners.com/2017/04/28/two-way-data-binding-in-reactjs-part-iii/
class DataBinding {
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
}

module.exports = DataBinding;
