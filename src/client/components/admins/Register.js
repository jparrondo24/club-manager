import React from 'react';
import { Form, Button } from 'react-bootstrap';
import axios from 'axios';
import '../../stylesheets/form.css'

export default class Register extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      email: '',
      password: '',
      masterPassword: ''
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    axios({
      method: 'POST',
      url: '/api/admins/register',
      data: this.state
    }).then((response) => {
      const { data } = response;
      this.props.clearFlashMessages();
      this.props.handleNewFlashMessage({
        message: "Succesfully registered Admin account",
        isSuccess: true
      });
      this.props.history.push('/admin/profile');
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

  render() {
    return(
      <div className="register">
        <h1>Register</h1>
        <Form onSubmit={this.handleSubmit}>
          <Form.Group controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              name="name"
              onChange={this.handleChange}
              value={this.state.name}
              className="form-input"
              type="text"
              placeholder="Enter name"
            />
          </Form.Group>
          <Form.Group controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              name="email"
              onChange={this.handleChange}
              value={this.state.email}
              className="form-input"
              type="email"
              placeholder="Enter email"
            />
          </Form.Group>
          <Form.Group controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              name="password"
              onChange={this.handleChange}
              value={this.state.password}
              className="form-input"
              type="password"
              placeholder="Enter password"
            />
          </Form.Group>
          <Form.Group controlId="masterPassword">
            <Form.Label>Master Password</Form.Label>
            <Form.Control
              name="masterPassword"
              onChange={this.handleChange}
              value={this.state.masterPassword}
              className="form-input"
              type="password"
              placeholder="Enter master password"
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </div>
    );
  }
}
