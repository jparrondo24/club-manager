import React from 'react';
import openSocket from 'socket.io-client';
import StudentTable from '../StudentTable.js';
import '../../stylesheets/signin.css';

export default class Signin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      students: [],
      date: '',
      startTime: '',
      endTime: ''
    };
  }
  componentWillMount() {
    const socket = openSocket(process.env.MY_URL || 'http://localhost:8080');
    socket.on('error', (error) => {
      this.props.handleNewFlashMessage({
        message: error,
        isSuccess: false
      });
      this.props.history.push('/');
    });
    socket.on('studentDetected', () => {
      this.props.handleNewFlashMessage({
        message: "You are not signed in as an admin!",
        isSuccess: false
      });
      this.props.history.push('/admin/login');
    });
    socket.on('studentSignedIn', (student) => {
      this.setState((prevState) => {
        let newStudents = prevState.students.splice(0);
        let isAlreadyInArray = false;
        newStudents.forEach((oldStudent) => {
          if (student._id === oldStudent._id) {
            isAlreadyInArray = true;
          }
        });
        if (!isAlreadyInArray) {
          newStudents.push(student);
        }
        return {
          students: newStudents
        }
      })
    });
    socket.on('meetingData', (meeting) => {
      this.setState({
        date: new Date(meeting.date),
        startTime: new Date(meeting.startTime),
        endTime: new Date(meeting.endTime),
        joinCode: meeting.joinCode
      });
    });
  }
  render() {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = this.state.date ? this.state.date.toLocaleDateString('en-US', dateOptions) : null;

    const timeOptions = { hour12: true, hour: "numeric", minute: "numeric" };
    const timeString = this.state.startTime && this.state.endTime ? new Date(this.state.startTime).toLocaleTimeString('en-US', timeOptions)
          + "-" + new Date(this.state.endTime).toLocaleTimeString('en-US', timeOptions) : null;

    return (
      <div className="signin">
        <h1>Coding Club Sign-in</h1>
        <h2>{dateString} {timeString}</h2>
        <p>Go to <a href="cchs-coding.club"> cchs-coding.club</a> to sign-in!</p>
        <h3>Join Code: {this.state.joinCode}</h3>
        <StudentTable students={this.state.students}/>
      </div>
    );
  }
}
