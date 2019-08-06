import React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default class Home extends React.Component {
  render() {
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
        <div className="button-group">
          <Link to="/student/signin">
            <Button>Meeting Sign-in <i className="fa fa-clipboard"></i></Button>
          </Link>
          <br />
          <Link to="/meetings">
            <Button>View Meetings <i className="fa fa-calendar"></i></Button>
          </Link>
          <br />
          <Link to="/student/profile">
            <Button>Profile <i className="fa fa-user"></i></Button>
          </Link>
        </div>
      </div>
    );
  }
}
