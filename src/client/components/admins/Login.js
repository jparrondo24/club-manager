import React from 'react';
import { Form, Button } from 'react-bootstrap';
import axios from 'axios';
import '../../stylesheets/form.css'

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: ''
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
      url: '/api/admins/login',
      data: this.state
    }).then((response) => {
      const { data } = response;
      this.props.clearFlashMessages();
      this.props.handleNewFlashMessage({
        message: "Succesfully logged into Admin account",
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
      <div className="login">
        <h1>Login</h1>
        <Form onSubmit={this.handleSubmit}>
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
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </div>
    );
  }
}
