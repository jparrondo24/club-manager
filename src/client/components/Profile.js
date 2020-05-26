import React from 'react';
import axios from 'axios';
import FieldEditor from './FieldEditor.js';
import '../stylesheets/form.css';
import { Button, Form, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      oldPassword: '',
      newPassword: '',
      newPasswordCheck: '',
      isEditingPassword: false
    };
    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.handlePasswordSubmit = this.handlePasswordSubmit.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleCancelClick = this.handleCancelClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleLogoutClick = this.handleLogoutClick.bind(this);
  }

  handleFieldChange(event) {
    event.persist();
    const { name, value } = event.target;
    this.setState((prevState) => {
      let newState = {
        user: {}
      };
      for (var field in prevState.user) {
        if (prevState.user.hasOwnProperty(field)) {
          if (field == name) {
            newState.user[field] = value;
          } else {
            newState.user[field] = prevState.user[field];
          }
        }
      }
      return {
        user: newState.user
      };
    });
  }

  handleCancelClick() {
    this.setState({
      isEditingPassword: false
    });
  }

  handlePasswordChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handlePasswordSubmit(event) {
    event.preventDefault();
    if (!this.state.isEditingPassword) {
      this.setState({
        isEditingPassword: true
      });
    } else {
      if (this.state.newPassword != this.state.newPasswordCheck) {
        this.props.handleNewFlashMessage({
          message: "New passwords do not match",
          isSuccess: false
        });
      } else {
        axios({
          method: 'PUT',
          url: "/api/" + this.props.model + "/" + this.state.user._id,
          data: {
            oldPassword: this.state.oldPassword,
            newPassword: this.state.newPassword
          },
          withCredentials: true
        }).then((response) => {
          const { data } = response;
          this.props.clearFlashMessages();
          this.props.handleNewFlashMessage({
            message: data.success,
            isSuccess: true
          });
          this.setState({
            isEditingPassword: false
          });
        }).catch((err) => {
          if (err.response) {
            const { data } = err.response;
            this.props.handleNewFlashMessage({
              message: data.error,
              isSuccess: false
            });
          }
        });
      }
    }
  }

  handleDeleteClick() {
    axios({
      method: 'DELETE',
      url: "/api/" + this.props.model + "/" + this.state.user._id,
      withCredentials: true
    }).then((response) => {
      const { data } = response;
      this.props.clearFlashMessages();
      this.props.handleNewFlashMessage({
        message: data.success,
        isSuccess: false
      });
      this.props.history.push('/' + this.props.model.slice(0, -1) + '/register');
    }).catch((err) => {
      if (err.response) {
        this.props.handleNewFlashMessage({
          message: data.error,
          isSuccess: false
        });
      }
    });
  }

  handleLogoutClick() {
    axios({
      method: 'GET',
      url: "/api/" + this.props.model + "/logout",
      withCredentials: true
    }).then((response) => {
      const { data } = response;
      this.props.clearFlashMessages();
      this.props.handleNewFlashMessage({
        message: data.success,
        isSuccess: true
      });
      this.props.history.push('/');
    }).catch((err) => {
      if (err.response) {
        const { data } = err.response;
        this.props.handleNewFlashMessage({
          message: data.error,
          isSuccess: false
        });
      }
    })
  }

  componentWillMount() {
    axios({
      method: 'GET',
      url: "/api/" + this.props.model,
      withCredentials: true
    }).then((response) => {
      const { data } = response;
      if (data.status == "noStudentToken" || data.status == "noAdminToken") {
        this.props.handleNewFlashMessage({
          message: "You are not signed in!",
          isSuccess: false
        });
        if (this.props.model == 'students') {
          this.props.history.push('/');
        } else if (this.props.model == 'admins') {
          console.log("here");
          this.props.history.push('/' + this.props.model.slice(0, -1));
        }
      } else {
        if (data.user.hasZoomToken) {
          delete data.user.hasZoomToken;
        }
        this.setState(data);
      }
    }).catch((err) => {
      if (err.response) {
        const { data } = err.response;
        this.props.handleNewFlashMessage({
          message: data.error,
          isSuccess: false
        });
        this.props.history.push('/' + this.props.model.slice(0, -1));
      }
    });
  }

  render() {
    const fieldsToSkip = ["_id", "date", "__v"];
    let fieldEditors;

    if (this.state.user) {
      fieldEditors = Object.keys(this.state.user).map((key, i) => {
        if (!fieldsToSkip.includes(key)) {
          return(
            <FieldEditor
              key={i}
              model={this.props.model}
              field={key}
              value={this.state.user[key]}
              userId={this.state.user._id}
              handleFieldChange={this.handleFieldChange}
              handleNewFlashMessage={this.props.handleNewFlashMessage}
              clearFlashMessages={this.props.clearFlashMessages}
            />
          );
        }
      });
    }

    let passwordForm;
    let passwordButtonIcon = "fa fa-pencil";
    if (this.state.isEditingPassword) {
      passwordButtonIcon = "fa fa-check";
      passwordForm = (
        <div className="password-form">
          <Form.Group as={Row} controlId="oldPassword">
            <Form.Label column xs="3" md="2">Old Password</Form.Label>
            <Col xs="8" md="4">
              <Form.Control
                name="oldPassword"
                onChange={this.handlePasswordChange}
                value={this.state.oldPassword}
                className="form-input"
                type="password"
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} controlId="newPassword">
            <Form.Label column xs="3" sm="2">New Password</Form.Label>
            <Col xs="8" md="4">
              <Form.Control
                name="newPassword"
                onChange={this.handlePasswordChange}
                value={this.state.newPassword}
                className="form-input"
                type="password"
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} controlId="newPasswordCheck">
            <Form.Label column xs="3" sm="2">New Password (re-type)</Form.Label>
            <Col xs="8" md="4">
              <Form.Control
                name="newPasswordCheck"
                onChange={this.handlePasswordChange}
                value={this.state.newPasswordCheck}
                className="form-input"
                type="password"
              />
            </Col>
          </Form.Group>
          <Button onClick={this.handleCancelClick} type="button" className="profile-button">
            Cancel <i className="fa fa-times"></i>
          </Button>
        </div>
      );
    }
    return(
      <div className="profile">
        <h1>Profile</h1>
        <Button onClick={this.handleLogoutClick} id="log-out" variant="link">
          Logout
        </Button>
        {fieldEditors}
        <Form onSubmit={this.handlePasswordSubmit}>
          {passwordForm}
          <Button type="submit" className="profile-button">
            Change Password <i className={passwordButtonIcon}></i>
          </Button>
        </Form>
        <Button onClick={this.handleDeleteClick} className="profile-button">Delete Account <i className="fa fa-warning"></i></Button>
        <br />
        <Link to={this.props.model == 'admins' ? '/admin' : '/'}>
          <Button id="home-button">Go Back Home <i className="fa fa-home"></i></Button>
        </Link>
      </div>
    );
  }
}
