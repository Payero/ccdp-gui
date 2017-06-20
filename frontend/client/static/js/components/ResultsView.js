var Scrollbars = require('react-custom-scrollbars').Scrollbars;

/**
 * ResultsView displayed when Results tab is selected on DetailPanel
 * Displays results for each thread in the project, separated by thread id
 */
var ResultsView = React.createClass({
  render: function() {
    return (
      <div className="ResultsView">
        <Scrollbars style={{ height: '100%'}} autoHide={ true } hideTracksWhenNotNeeded={ true }>
        {this.props.results.map(result => {
          return (
            <div key={result['thread-id']}>
              <row>
                <label>thread-id:</label>
                <p>{result['thread-id']}</p>
              </row>
              <row>
                <label>result:</label>
                <p>{result['result']}</p>
              </row>
            </div>
          )
        })}
        { this.props.results.length === 0 ?
          <div className="col-md-12">
            <p>No results to display - results from completed threads will be displayed after a successful run</p>
          </div>
        : null }
        </Scrollbars>
      </div>
    )
  }
});

module.exports = ResultsView;
