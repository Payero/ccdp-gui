/**
 * LoggingView component to act as a wrapper for log4javascript functionality
 */
var LoggingView = React.createClass({
  // Creates log4javascript logger and appender and sets up styling
  componentDidMount: function() {
    var log = log4javascript.getLogger();
	  var inPageAppender = new log4javascript.InPageAppender(ReactDOM.findDOMNode(this), false, false, true, '100%', '100%');
	  inPageAppender.setShowCommandLine(false);
	  log.addAppender(inPageAppender);
	  // Add existing logs to the logger
	  for (var i = 0; i < this.props.logs.length; i++) {
	    log.info(JSON.parse(this.props.logs[i]));
	  }
	  // Set up styling for log4javascript appender
	  var iframes = document.querySelectorAll("iframe");
    iframes = Array.prototype.slice.call(iframes);
    iframes.filter(function (iframe) {
      return iframe.id && iframe.id.match(/log4javascript_\d+_\d+_InPageAppender_\d+/);
    });
    if (iframes.length < 1) {
      return;
    }
    var iframe = iframes[0];
    var switchesToolbars = iframe.contentWindow.document.querySelectorAll(".toolbar");
    switchesToolbars = Array.prototype.slice.call(switchesToolbars);
    switchesToolbars.forEach(function (toolbar) {
      toolbar.style = "background-color: #f4f4f4; border-bottom: 1px solid gray;";
    });
    // Set wrap to be checked when the appender is loaded
    var wrap = iframe.contentWindow.document.querySelectorAll("#wrap")[0];
    wrap.checked = 'checked';
  },
  // Adds new logs to the log4javascript logger
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.logs !== this.props.logs) {
      var newLogs = nextProps.logs.filter(function(log) { return this.props.logs.indexOf(log) < 0; }.bind(this));
      for (var i = 0; i < newLogs.length; i++) {
        var msg = JSON.parse(newLogs[i]);
        var log = log4javascript.getLogger();
        log.info(msg);
      }
    }
  },
  render: function() {
    return (
      <div className="LoggingView">
      </div>
    )
  }
});

module.exports = LoggingView;
