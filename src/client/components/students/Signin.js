import React from 'react';
import openSocket from 'socket.io-client';
import StudentTable from '../StudentTable.js';
import '../../stylesheets/signin.css'

export default class Signin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSignedIn: false,
      date: '',
      startTime: '',
      endTime: ''
    };
  }
  componentWillMount() {
    const socket = openSocket('http://localhost:8080');
    socket.on('error', (error) => {
      this.props.handleNewFlashMessage({
        message: error,
        isSuccess: false
      });
      this.props.history.push('/');
    });
    socket.on('connect', () => {
      this.setState({
        isSignedIn: true
      });
    });
    socket.on('meetingData', (meeting) => {
      this.setState({
        date: new Date(meeting.date),
        startTime: new Date(meeting.startTime),
        endTime: new Date(meeting.endTime)
      });
    });
  }
  render() {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = this.state.date ? this.state.date.toLocaleDateString('en-US', dateOptions) : null;

    const timeOptions = { hour12: true, hour: "numeric", minute: "numeric" };
    const timeString = this.state.startTime && this.state.endTime ? new Date(this.state.startTime).toLocaleTimeString('en-US', timeOptions)
          + "-" + new Date(this.state.endTime).toLocaleTimeString('en-US', timeOptions) : null;

    const statusMessage = this.state.isSignedIn ? (<p id="status">You should now be signed-in. Look up to see your name on the board</p>) : null;

    return (
      <div className="admin-signin">
        <h1>Coding Club Sign-in</h1>
        <h2>{dateString} {timeString}</h2>
        {statusMessage}
      </div>
    );
  }
}
