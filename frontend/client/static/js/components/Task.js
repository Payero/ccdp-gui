var FontAwesome = require('react-fontawesome');
var DragSource = require('react-dnd').DragSource;
var ContextMenuLayer = require('react-contextmenu').ContextMenuLayer;
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var Popover = require('react-bootstrap').Popover;

/**
 * React DnD DragSource functionality, handles information available when dragging
 */
var taskSource = {
  beginDrag: function (props) {
    var item = { data: props.data };
    return item;
  }
};

/**
 * React DnD collect function, necessary for drag-and-drop behavior
 */
function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}

/**
 * Task component to store project information received from server
 * Includes a bootstrap popover with description when hovering over the div
 */
var Task = React.createClass({
  render: function() {
    const popover = (
      <Popover id="popover-trigger-hover-focus" title={this.props.name}>{this.props.description}</Popover>
    );
    var isDragging = this.props.isDragging;
    var connectDragSource = this.props.connectDragSource;
    return connectDragSource(
        <div className="addTask" data={this.props.data}>
          <OverlayTrigger placement="right" overlay={popover}>
            <FontAwesome name="cube"> {this.props.name} </FontAwesome>
          </OverlayTrigger>
        </div>
    );
  }
});

module.exports = ContextMenuLayer('task')(DragSource('task', taskSource, collect)(Task));
