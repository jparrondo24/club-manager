import React from 'react';
import { Alert } from 'react-bootstrap';

export default class FlashMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: true
    }
  }

  render() {
    if (!this.props.flashMessage) {
      return null;
    }
    const alertClass = (this.props.flashMessage.isSuccess) ? "success" : "danger";
    return(
      <div className="flash-message">
        <Alert show={this.state.show} variant={alertClass} onClose={() => this.setState({ show: false })} dismissible>
          {this.props.flashMessage.message}
        </Alert>
      </div>
    );
  }
}
