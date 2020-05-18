import React from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    axios({
      method: 'GET',
      url: "/api/students",
      withCredentials: true
    }).then((response) => {
      const { data } = response;
      if (data.status != "noStudentToken") {
        this.setState(data);
      }
    }).catch((err) => {
      if (err.response) {
        const { data } = err.response;
        this.props.handleNewFlashMessage({
          message: data.error,
          isSuccess: false
        });
        this.props.history.push('/' + this.props.model.slice(0, -1) + '/login');
      }
    });
  }
  
  render() {
    if (!this.state.user) {
      return (
        <div className="home">
          <h1>Welcome to the Coding Club!</h1>
          <p>You will first need to either Register or Login. You can then sign-in to meetings, see all meetings scheduled, or view and edit your Profile</p>
          <div className="button-group">
            <Link to="/student/register">
              <Button>Register <i className="fa fa-user-plus"></i></Button>
            </Link>
            <br />
            <Link to="/student/login">
              <Button>Login <i className="fa fa-sign-in-alt"></i></Button>
            </Link>
          </div>
        </div>
      );
    } else {
      return (
        <div className="home">
          <h1>Welcome to the Coding Club!</h1>
          <div className="button-group">
            <Link to="/student/profile">
              <Button>{this.state.user.name} <i className="fa fa-user"></i></Button>
            </Link>
            <br />
            <br />
            <Link to="/meetings">
              <Button>View Meetings <i className="fa fa-calendar"></i></Button>
            </Link>
            <br />
            <Link to="/student/signin">
              <Button>Meeting Sign-in <i className="fa fa-clipboard"></i></Button>
            </Link>
          </div>
        </div>
      );
    }
  }
}
