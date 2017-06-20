var FontAwesome = require('react-fontawesome');

/**
 * ZoomControls component for managing zoomLevel of ProjectEditor
 */
var ZoomControls = React.createClass({
  // Initial zoomLevel should be 1, increases with zoomIn, decreases with zoomOut
  getInitialState: function() {
    return {zoomLevel: 1};
  },
  // Increases zoomLevel and calls Graph callback to update GraphD3 zoom
  onZoomIn: function() {
    var newZoomLevel = this.state.zoomLevel * 2;
    this.setState({zoomLevel: newZoomLevel});
    this.props.onZoom(newZoomLevel);
  },
  // Resets zoomLevel to 1 and calls Graph callback to update GraphD3 zoom
  onZoomReset: function() {
    this.setState({zoomLevel: 1});
    this.props.onZoom(1);
  },
  // Decreases zoomLevel and calls Graph callback to update GraphD3 zoom
  onZoomOut: function() {
    var newZoomLevel = this.state.zoomLevel * 0.5;
    this.setState({zoomLevel: newZoomLevel});
    this.props.onZoom(newZoomLevel);
  },
  render: function() {
    return (
      <div className="ZoomControls" >
        <FontAwesome className="ZoomIcon" size="2x" name="search-plus" onClick={() => {this.onZoomIn();} } />
        <FontAwesome className="ZoomIcon" size="2x" name="refresh" onClick={() => {this.onZoomReset();} } />
        <FontAwesome className="ZoomIcon" size="2x" name="search-minus" onClick={() => {this.onZoomOut();} } />
      </div>
    )
  }
});

module.exports = ZoomControls;
