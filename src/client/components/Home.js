import React from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import stemLogo from '../images/stem-logo.png';
import explorerLogo from '../images/explorer-logo.png';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    axios({
      method: 'GET',
      url: '/api/' + this.props.model,
      withCredentials: true
    }).then((response) => {
      const { data } = response;
      if (data.status != "noStudentToken" && data.status != "noAdminToken") {
        this.setState(data);
      }
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
    const singularModel = this.props.model.slice(0, -1);

    const header = (
      <div className="row header">
        <div className="d-none d-md-block col-2">
          <img className="img-fluid" src={explorerLogo} />
        </div>
        <div className="col-sm-12 col-md-8 align-self-center text-center">
          <h1>Coding & Cybersecurity Clubs</h1>
          <h2>{this.props.model.charAt(0).toUpperCase() + this.props.model.slice(1)} Page</h2>
        </div>
        <div className="d-none d-md-block col-2">
          <img className="img-fluid" src={stemLogo} />
        </div>
      </div>
    );

    const footer = (
      <div className="footer">
        <div id="discord-row" className="row">
          <div className="col-2 col-lg-1 v-divider align-self-center text-center">
            <h2><i className="fab fa-discord"></i></h2>
          </div>
          <div className="col-10 align-self-center">
            <h2><a href="https://discord.gg/YX7KQHq" target="_blank">Coding and Cybersecurity Clubs</a></h2>
          </div>
        </div>
        <div id="instagram-row" className="row">
          <div className="col-2 col-lg-1 v-divider align-self-center text-center">
            <h2><i className="fab fa-instagram"></i></h2>
          </div>
          <div className="col-10 align-self-center">
            <h2><a href="https://instagram.com/explorershack?igshid=1fmp2w7jfql0w" target="_blank">ExplorerHacks</a></h2>
          </div>
        </div>
      </div>
    );

    if (!this.state.user) {
      return (
        <div className="home">
          {header}
          <p className="text-center">Welcome to the Coding & Cybersecurity Clubs' web app! You will first need to either Register or Login. You can then sign-in to meetings, see all meetings scheduled, or view and edit your Profile</p>
          <div className="button-group">
            <Link to={'/' + singularModel + '/register'}>
              <Button>Register <i className="fa fa-user-plus"></i></Button>
            </Link>
            <br />
            <Link to={'/' + singularModel + '/login'}>
              <Button>Login <i className="fa fa-sign-in-alt"></i></Button>
            </Link>
          </div>
          {footer}
        </div>
      );
    } else {
      let rosterButton = null; 
      if (this.props.model == 'admins') {
        rosterButton = (
          <Link to={'/roster'}>
            <Button>View Roster <i className="fa fa-users"></i></Button>
          </Link>
        );
      }
      return (
        <div className="home">
          {header}
          <p className="text-center">You are now successfully signed in! You can now View and Sign-in to Meetings.</p>
          <div className="button-group">
            <Link to={'/' + singularModel + '/profile'}>
              <Button>{this.state.user.name} <i className="fa fa-user"></i></Button>
            </Link>
            <br />
            <br />
            <Link to="/meetings">
              <Button>View Meetings <i className="fa fa-calendar"></i></Button>
            </Link>
            <br />
            <Link to={'/' + singularModel + '/signin'}>
              <Button>Meeting Sign-in <i className="fa fa-clipboard"></i></Button>
            </Link>
            <br />
            {rosterButton}
            {footer}
          </div>
        </div>
      );
    }
  }
}
