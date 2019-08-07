import React from 'react';
import axios from 'axios';
import Calendar from 'react-calendar/dist/entry.nostyle';
import { Row, Col, Button, Form } from 'react-bootstrap';
import StudentTable from './StudentTable';
import '../stylesheets/meetings.css';
import '../stylesheets/form.css';

export default class MeetingManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      meetings: [],
      isSchedulingMeeting: false,
      isReschedulingMeeting: false,
      startTime: '',
      endTime: ''
    };
    this.handleCalendarChange = this.handleCalendarChange.bind(this);
    this.handleScheduleButton = this.handleScheduleButton.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleDateInputChange = this.handleDateInputChange.bind(this);
    this.handleCancelButton = this.handleCancelButton.bind(this);
    this.handleRescheduleButton = this.handleRescheduleButton.bind(this);
  }


  componentWillMount() {
    axios({
      method: 'GET',
      url: '/api/meetings',
      withCredentials: true
    }).then((response) => {
      const { data } = response;
      this.setState({
        meetings: data.meetings
      });
    }).catch((error) => {
      if (error.response) {
        const { data } = error.response;
        this.props.handleNewFlashMessage({
          message: data.error,
          isSuccess: false
        });
        if (data.status === 'notAuthorized') {
          this.props.history.push('/student/login');
        }
      }
    })
  }

  handleCalendarChange(value) {
    console.log("New date is " + value);
    let currMeeting;
    this.state.meetings.forEach((meeting) => {
      if (meeting.date === value.toISOString()) {
        currMeeting = meeting;
      }
    });


    let startTime = '';
    let endTime = '';

    if (currMeeting) {
      const options = {
        hour12: false,
        hour: "numeric",
        minute: "numeric"
      }
      startTime = new Date(currMeeting.startTime).toLocaleTimeString('en-US', options);
      endTime = new Date(currMeeting.endTime).toLocaleTimeString('en-US', options);
    }

    this.setState({
      activeDate: value,
      isMeeting: (currMeeting ? true : false),
      startTime: startTime,
      endTime: endTime,
      newDate: value,
      meetingId: (currMeeting ? currMeeting._id : ''),
      attendants: (currMeeting ? currMeeting.attendants : [])
    });
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handleDateInputChange(event) {
    let newDate = new Date(event.target.value);
    newDate.setDate(newDate.getDate() + 1);
    newDate.setHours(0);

    this.setState({
      [event.target.name]: newDate
    });
    console.log(this.state.newDate);
  }

  handleScheduleButton() {
    if (!this.state.isSchedulingMeeting) {
      this.setState({
        isSchedulingMeeting: true
      });
    } else {
      if (!this.state.startTime || !this.state.endTime) {
        return this.props.handleNewFlashMessage({
          message: "Start and End times are both required",
          isSuccess: false
        });
      }
      const startDateHour = this.state.startTime.split(":")[0];
      const startDateMinutes = this.state.endTime.split(":")[1];
      const endDateHour = this.state.endTime.split(":")[0];
      const endDateMinutes = this.state.endTime.split(":")[1];

      let fullStartTime = new Date(this.state.activeDate.valueOf());
      let fullEndTime = new Date(this.state.activeDate.valueOf());
      fullStartTime.setHours(startDateHour);
      fullStartTime.setMinutes(startDateMinutes);
      fullEndTime.setHours(endDateHour);
      fullEndTime.setMinutes(endDateMinutes);

      axios({
        method: 'POST',
        url: '/api/meetings',
        data: {
          date: this.state.activeDate.toISOString(),
          startTime: fullStartTime.toISOString(),
          endTime: fullEndTime.toISOString()
        }
      }).then((response) => {
        const { data } = response;
        this.props.clearFlashMessages();
        this.props.handleNewFlashMessage({
          message: data.success,
          isSuccess: true
        });
        this.setState((prevState) => {
          let newMeetings = prevState.meetings.splice(0);
          newMeetings.push(data.newMeeting);
          return {
            meetings: newMeetings,
            meetingId: data.newMeeting._id,
            isMeeting: true,
            isSchedulingMeeting: false
          }
        });
      }).catch((error) => {
        if (error.response) {
          const { data } = error.response;
          this.props.handleNewFlashMessage({
            message: data.error,
            isSchedulingMeeting: false,
            isSuccess: false
          });
        }
      });
    }
  }

  handleRescheduleButton() {
    if (!this.state.isReschedulingMeeting) {
      this.setState({
        isReschedulingMeeting: true
      });
    } else {
      if (!this.state.startTime || !this.state.endTime || !this.state.newDate) {
        return this.props.handleNewFlashMessage({
          message: "Date, Start Time, and End Time, are all required",
          isSuccess: false
        });
      }
      const startDateHour = this.state.startTime.split(":")[0];
      const startDateMinutes = this.state.endTime.split(":")[1];
      const endDateHour = this.state.endTime.split(":")[0];
      const endDateMinutes = this.state.endTime.split(":")[1];

      let fullStartTime = new Date(this.state.newDate.valueOf());
      let fullEndTime = new Date(this.state.newDate.valueOf());
      fullStartTime.setHours(startDateHour);
      fullStartTime.setMinutes(startDateMinutes);
      fullEndTime.setHours(endDateHour);
      fullEndTime.setMinutes(endDateMinutes);
      console.log(this.state.newDate);
      axios({
        method: 'PUT',
        url: '/api/meetings/' + this.state.meetingId,
        data: {
          date: this.state.newDate.toISOString(),
          startTime: fullStartTime.toISOString(),
          endTime: fullEndTime.toISOString()
        },
        withCredentials: true
      }).then((response) => {
        const { data } = response;
        this.props.clearFlashMessages();
        this.props.handleNewFlashMessage({
          message: data.success,
          isSuccess: true
        });
        this.setState((prevState) => {
          let newMeetings = prevState.meetings.splice(0);
          for (let i = 0; i < newMeetings.length; i++) {
            if (newMeetings[i]._id === this.state.meetingId) {
              newMeetings[i].date = this.state.newDate.toISOString();
              newMeetings[i].startTime = fullStartTime.toISOString();
              newMeetings[i].endTime = fullEndTime.toISOString();
            }
          }
          return {
            meetings: newMeetings,
            isMeeting: false,
            isReschedulingMeeting: false
          };
        });
      }).catch((error) => {
        if (error.response) {
          const { data } = error.response;
          this.props.handleNewFlashMessage({
            message: data.error,
            isReschedulingMeeting: false,
            isSuccess: false
          });
        }
      });
    }
  }

  handleCancelButton() {
    axios({
      method: 'DELETE',
      url: "/api/meetings/" + this.state.meetingId,
      withCredentials: true
    }).then((response) => {
      const { data } = response;
      this.props.clearFlashMessages();
      this.props.handleNewFlashMessage({
        message: data.success,
        isSucces: true
      });
      this.setState((prevState) => {
        let newMeetings = prevState.meetings.splice(0);
        for (let i = 0; i < newMeetings.length; i++) {
          if (newMeetings[i]._id === this.state.meetingId) {
            newMeetings.splice(i, 1);
          }
        }
        return {
          meetings: newMeetings,
          isMeeting: false
        };
      });
    }).catch((error) => {
      if (error.response) {
        const { data } = error.response;
        this.props.handleNewFlashMessage({
          message: data.error,
          isSucces: true
        });
      }
    });
  }

  render() {
    let dateEditor = (
      <div className="date-editor">
        <h2>No date selected</h2>
        <p>Select a date to see more information</p>
      </div>
    );
    if (this.state.activeDate) {
      const { activeDate } = this.state;
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const header = activeDate.toLocaleDateString('en-US', options);
      let iconClass = "fa fa-clock";
      let form = null;
      if (this.state.isSchedulingMeeting) {
        iconClass = "fa fa-check";
        form = (
          <Form>
            <Form.Group as={Row} controlId="startTime">
              <Form.Label column xs="2" md="2">Start Time</Form.Label>
              <Col xs="7" md="4">
                <Form.Control
                  name="startTime"
                  className="form-input"
                  value={this.state.startTime}
                  onChange={this.handleInputChange}
                  type="time"
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="endTime">
              <Form.Label column xs="2" md="2">End Time</Form.Label>
              <Col xs="7" md="4">
                <Form.Control
                  name="endTime"
                  className="form-input"
                  value={this.state.endTime}
                  onChange={this.handleInputChange}
                  type="time"
                />
              </Col>
            </Form.Group>
          </Form>
        );
      }
      let button = null;
      if (new Date(this.state.activeDate).getDate() >= new Date().getDate()) {
        button = (
          <Button onClick={this.handleScheduleButton}>Schedule Meeting <i className={iconClass}></i></Button>
        );
      }
      let content = (
        <div>
          <p>This date has no meeting.</p>
          {form}
          {button}
        </div>
      )

      if (this.state.isMeeting) {
        let newDateInput = null;
        let rescheduleButtonClass = "fa fa-clock";
        if (this.state.isReschedulingMeeting) {
          rescheduleButtonClass = "fa fa-check";
          let mm = this.state.newDate.getMonth()+1;
          mm = mm < 10 ? '0' + mm : mm;
          let dd = this.state.newDate.getDate();
          dd = dd < 10 ? '0' + dd : dd;
          const yy = this.state.newDate.getFullYear();
          const newDateString = yy+"-"+mm+"-"+dd;
          console.log(newDateString);
          newDateInput = (
            <Form.Group as={Row} controlId="newDate">
              <Form.Label column xs="2" md="2">Date</Form.Label>
              <Col xs="7" md="4">
                <Form.Control
                  name="newDate"
                  className="form-input"
                  value={newDateString}
                  onChange={this.handleDateInputChange}
                  type="date"
                />
              </Col>
            </Form.Group>
          );
        }
        let buttons = null;
        if (new Date(this.state.activeDate).getDate() >= new Date().getDate()) {
          buttons = (
            <div>
              <Button
                onClick={this.handleRescheduleButton}
                className="meeting-button"
              >
                Reschedule Meeting <i className={rescheduleButtonClass}></i>
              </Button>
              <br />
              <Button
                onClick={this.handleCancelButton}
                className="meeting-button"
              >
                Cancel Meeting <i className="fa fa-calendar-times"></i>
              </Button>
            </div>
          );
        }
        content = (
          <div>
            <Form>
              {newDateInput}
              <Form.Group as={Row} controlId="startTime">
                <Form.Label column xs="2" md="2">Start Time</Form.Label>
                <Col xs="7" md="4">
                  <Form.Control
                    plaintext={!this.state.isReschedulingMeeting}
                    readOnly={!this.state.isReschedulingMeeting}
                    name="startTime"
                    className="form-input"
                    value={this.state.startTime}
                    onChange={this.handleInputChange}
                    type="time"
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} controlId="endTime">
                <Form.Label column xs="2" md="2">End Time</Form.Label>
                <Col xs="7" md="4">
                  <Form.Control
                    plaintext={!this.state.isReschedulingMeeting}
                    readOnly={!this.state.isReschedulingMeeting}
                    name="endTime"
                    className="form-input"
                    value={this.state.endTime}
                    onChange={this.handleInputChange}
                    type="time"
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} controlId="endTime">
                <Form.Label column xs="2" md="2">Attendants</Form.Label>
              </Form.Group>
              <Row>
                <Col sm="7">
                  <StudentTable hiddenText="No attendants yet!" small={true} students={this.state.attendants}/>
                </Col>
              </Row>
            </Form>
            {buttons}
          </div>
        );
      }

      dateEditor = (
        <div className="date-editor">
          <h2>{header}</h2>
          {content}
        </div>
      );
    }

    return(
        <div className="meetings">
          <h1>Meetings</h1>
          <Row>
            <Col md="5">
              <Calendar
                className="calendar"
                onChange={this.handleCalendarChange}
                tileClassName={(date, view) => {
                  let dateHasMeeting = false;
                  let extraClass = "";

                  this.state.meetings.forEach((meeting) => {
                    if (meeting.date === date.date.toISOString()) {
                      dateHasMeeting = true;
                      if (new Date(meeting.endTime) < new Date()) {
                        extraClass = "past-date";
                      }
                    }
                  });
                  return dateHasMeeting ? "meeting " + extraClass : null;;
                }}
              />
            </Col>
          </Row>
          {dateEditor}
        </div>
    );
  }
}
