import React from 'react';
import openSocket from 'socket.io-client';
import StudentTable from '../StudentTable.js';
import { Form, Button, Row, Col } from 'react-bootstrap';
import '../../stylesheets/signin.css';

export default class Signin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSignedIn: false,
      date: '',
      startTime: '',
      endTime: '',
      joinCode: ''
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange() {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.state.socket.emit('joinCodeSubmit', {
      joinCode: this.state.joinCode
    });
  }

  componentWillMount() {
    const socket = openSocket(process.env.MY_URL || 'http://localhost:3000');
    socket.on('error', (error) => {
      this.props.handleNewFlashMessage({
        message: error,
        isSuccess: false
      });
      this.props.history.push('/');
    });

    socket.on('meetingData', (meeting) => {
      this.setState({
        date: new Date(meeting.date),
        startTime: new Date(meeting.startTime),
        endTime: new Date(meeting.endTime)
      });
    });

    socket.on('studentDetected', () => {
      this.setState({
        isSignedIn: true
      });
    });
    socket.on('incorrectCode', () => {
      this.props.handleNewFlashMessage({
        message: "The Join Code provided was incorrect",
        isSuccess: false
      });
    });
    this.setState({
      socket: socket
    });
  }

  render() {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = this.state.date ? this.state.date.toLocaleDateString('en-US', dateOptions) : null;

    const timeOptions = { hour12: true, hour: "numeric", minute: "numeric" };
    const timeString = this.state.startTime && this.state.endTime ? new Date(this.state.startTime).toLocaleTimeString('en-US', timeOptions)
          + "-" + new Date(this.state.endTime).toLocaleTimeString('en-US', timeOptions) : null;

    const joinCodeForm = (
      <Form onSubmit={this.handleSubmit}>
        <Form.Group controlId="joinCode">
          <Form.Label>Join Code</Form.Label>
          <Row>
            <Col sm="2" md="3" lg="4"/>
            <Col sm="8" md="6" lg="4">
              <Form.Control
                onChange={this.handleChange}
                value={this.state.joinCode}
                name="joinCode"
                type="text"
                placeholder="Enter join code"
               />
            </Col>
            <Col sm="2" md="3" lg="4"/>
          </Row>
        </Form.Group>
        <Button type="submit">Submit <i className="fa fa-paper-plane"></i></Button>
      </Form>
    );
    const statusMessage = this.state.isSignedIn ? (<p id="status">You should now be signed-in. Look up to see your name on the board</p>) : null;

    return (
      <div className="signin">
        <h1>Coding Club Sign-in</h1>
        <h2>{dateString} {timeString}</h2>
        {this.state.isSignedIn ? null : joinCodeForm}
        {statusMessage}
      </div>
    );
  }
}
