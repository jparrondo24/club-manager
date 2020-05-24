import React from 'react';
import axios from 'axios';
import Calendar from 'react-calendar/dist/entry.nostyle';
import { Row, Col, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';
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
      isCancellingMeeting: false,
      startTime: '',
      endTime: '',
      hasZoomMeeting: false,
      sendNotification: false
    };
    this.handleCalendarChange = this.handleCalendarChange.bind(this);
    this.handleScheduleButton = this.handleScheduleButton.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleDateInputChange = this.handleDateInputChange.bind(this);
    this.handleCancelButton = this.handleCancelButton.bind(this);
    this.handleRescheduleButton = this.handleRescheduleButton.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
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
    });
    axios({
      method: 'GET',
      url: '/api/admins',
      withCredentials: true
    }).then((response) => {
      const { data } = response;
      this.setState({
        admin: data.user
      });
    });
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

    let zoomMeetingStartLink = '';
    if (currMeeting && currMeeting.zoomMeetingStartLink) {
      zoomMeetingStartLink = currMeeting.zoomMeetingStartLink;
    }

    this.setState({
      activeDate: value,
      isMeeting: (currMeeting ? true : false),
      startTime: startTime,
      endTime: endTime,
      newDate: value,
      meetingId: (currMeeting ? currMeeting._id : ''),
      zoomMeetingStartLink: zoomMeetingStartLink,
      zoomMeetingInviteLink: (currMeeting ? currMeeting.zoomMeetingInviteLink : ''),
      zoomMeetingPassword: (currMeeting ? currMeeting.zoomMeetingPassword: ''),
      attendants: (currMeeting ? currMeeting.attendants : [])
    });
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handleCheckboxChange(event) {
    this.setState({
      [event.target.name]: event.target.checked
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
      const startDateMinutes = this.state.startTime.split(":")[1];
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
        withCredentials: true,
        data: {
          date: this.state.activeDate.toISOString(),
          startTime: fullStartTime.toISOString(),
          endTime: fullEndTime.toISOString(),
          hasZoomMeeting: this.state.hasZoomMeeting,
          sendNotification: this.state.sendNotification
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
            zoomMeetingStartLink: data.newMeeting.zoomMeetingStartLink,
            zoomMeetingInviteLink: data.newMeeting.zoomMeetingInviteLink,
            zoomMeetingPassword: data.newMeeting.zoomMeetingPassword,
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
      const startDateMinutes = this.state.startTime.split(":")[1];
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
          endTime: fullEndTime.toISOString(),
          hasZoomMeeting: (this.state.zoomMeetingInviteLink ? true : false),
          sendNotification: this.state.sendNotification
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
    if (!this.state.isCancellingMeeting) {
      this.setState({
        isCancellingMeeting: true
      });
    } else {
      axios({
        method: 'DELETE',
        url: "/api/meetings/" + this.state.meetingId,
        withCredentials: true,
        data: {
          hasZoomMeeting: (this.state.zoomMeetingInviteLink ? true : false),
          sendNotification: this.state.sendNotification
        }
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
            isCancellingMeeting: false,
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
  }

  render() {
    let zoomDiv = null;
    if (this.state.admin && !this.state.admin.hasZoomToken) {
      zoomDiv = (
        <div id="zoom-div">
          <p>We have detected that you are an Admin, but not signed in with Zoom. If you would like to schedule meetings with Zoom sessions, please use the button to link your Admin account with your Zoom account.</p>
          <a id="zoom-a" href="/api/admins/auth/zoom">
            <Button id="zoom-button">Sign-In with Zoom <i className="fa fa-video"></i></Button>
          </a>
        </div>
      );
    } else if (this.state.admin && this.state.admin.hasZoomToken) {
      zoomDiv = (
        <div id="zoom-div">
          <p>Your Admin account is succesfully signed in with Zoom. You can proceed to schedule meetings that have Zoom.</p>
        </div>
      )
    }
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
            <Form.Group as={Row} controlId="hasZoomMeeting">
              <Form.Label column xs="2" md="2">Schedule Zoom Meeting?</Form.Label>
              <Col xs="7" md="4">
                <Form.Check
                  id="hasZoomMeeting"
                  name="hasZoomMeeting"
                  className="form-check-input"
                  checked={this.state.hasZoomMeeting}
                  onChange={this.handleCheckboxChange}
                  type="checkbox"
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="sendNotification">
              <Form.Label column xs="2" md="2">Send Notification?</Form.Label>
              <Col xs="7" md="4">
                <Form.Check
                  id="sendNotification"
                  name="sendNotification"
                  className="form-check-input"
                  checked={this.state.sendNotification}
                  onChange={this.handleCheckboxChange}
                  type="checkbox"
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
        let rescheduleNotifyInput = null;
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
          rescheduleNotifyInput = (
            <Form.Group as={Row} controlId="sendNotification">
              <Form.Label column xs="2" md="2">Send Notification?</Form.Label>
              <Col xs="7" md="4">
                <Form.Check
                  id="sendNotification"
                  name="sendNotification"
                  className="form-check-input"
                  checked={this.state.sendNotification}
                  onChange={this.handleCheckboxChange}
                  type="checkbox"
                />
              </Col>
            </Form.Group>
          );
        }
        if (this.state.isCancellingMeeting) {
          rescheduleNotifyInput = (
            <Form.Group as={Row} controlId="sendNotification">
              <Form.Label column xs="2" md="2">Send Notification?</Form.Label>
              <Col xs="7" md="4">
                <Form.Check
                  id="sendNotification"
                  name="sendNotification"
                  className="form-check-input"
                  checked={this.state.sendNotification}
                  onChange={this.handleCheckboxChange}
                  type="checkbox"
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
        let zoomStartLinkRow = null;
        if (this.state.zoomMeetingStartLink) {
          zoomStartLinkRow = (
            <Form.Group as={Row} controlId="zoomMeetingStartLink">
                <Form.Label column xs="2" md="2">Zoom Start Link</Form.Label>
                <Col xs="7" md="4">
                  <a
                    target="_blank" 
                    href={this.state.zoomMeetingStartLink}
                  >{this.state.zoomMeetingStartLink}</a>
                </Col>
                <Col xs="2" md="2">
                  <CopyToClipboard text={this.state.zoomMeetingStartLink}>
                    <Button><i className="fa fa-clipboard"></i></Button>
                  </CopyToClipboard>
                </Col>
              </Form.Group>
          );
        }

        let zoomJoinLinkRow = null;
        let zoomPasswordRow = null;
        if (this.state.zoomMeetingInviteLink && this.state.zoomMeetingPassword) {
          zoomJoinLinkRow = (
            <Form.Group as={Row} controlId="zoomMeetingInviteLink">
              <Form.Label column xs="2" md="2">Zoom Invite Link</Form.Label>
              <Col xs="7" md="4">
                <a
                  target="_blank" 
                  href={this.state.zoomMeetingInviteLink}
                >{this.state.zoomMeetingInviteLink}</a>
              </Col>
              <Col xs="2" md="2">
                <CopyToClipboard text={this.state.zoomMeetingInviteLink}>
                  <Button><i className="fa fa-clipboard"></i></Button>
                </CopyToClipboard>
              </Col>
            </Form.Group>
          );
          zoomPasswordRow = (
            <Form.Group as={Row} controlId="zoomMeetingPassword">
              <Form.Label column xs="2" md="2">Zoom Password</Form.Label>
              <Col xs="7" md="4">
                <Form.Control
                    plaintext
                    readOnly
                    name="zoomMeetingPassword"
                    className="form-input"
                    value={this.state.zoomMeetingPassword}
                    type="text"
                  />
              </Col>
              <Col xs="2" md="2">
                <CopyToClipboard text={this.state.zoomMeetingPassword}>
                  <Button><i className="fa fa-clipboard"></i></Button>
                </CopyToClipboard>
              </Col>
            </Form.Group>
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
              {zoomStartLinkRow}
              {zoomJoinLinkRow}
              {zoomPasswordRow}
              <Form.Group as={Row} controlId="attendants">
                <Form.Label column xs="2" md="2">Attendants</Form.Label>
              </Form.Group>
              <Row>
                <Col sm="7">
                  <StudentTable hiddenText="No attendants yet!" small={true} students={this.state.attendants}/>
                </Col>
              </Row>
              {rescheduleNotifyInput}
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
        {zoomDiv}
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
                return dateHasMeeting ? "meeting " + extraClass : null;
              }}
            />
          </Col>
        </Row>
        {dateEditor}
      </div>
    );
  }
}
