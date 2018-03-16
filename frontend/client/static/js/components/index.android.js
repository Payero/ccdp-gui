/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

import Canvas from 'react-native-canvas';

export default class rn_art_demo extends Component {
  componentDidMount() {
    // react-native-canvas doesn't yet implement addEventListener
    //this.canvas.addEventListener = function() {};
    //this.wid_canvas.addEventListener = function() {};

    SigPlot.mx.LEGACY_RENDER = true;
    var plot = new SigPlot.Plot(this.canvas, this.wid_canvas);
    plot._refresh();
    /*
    this.drawTopShape()
    this.timerID = setInterval(
      () => this.drawRandomRectangle(),
      1000
    );
    */
  }

  render() {
    return (
      <View style={styles.container}>
        <Canvas ref={(el) => this.canvas = el}></Canvas>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('rn_art_demo', () => rn_art_demo);
