import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { default as StudentsRegister } from './students/Register';
import { default as StudentsLogin } from './students/Login';
import { default as StudentsSignin } from './students/Signin';
import { default as AdminsRegister } from './admins/Register';
import { default as AdminsLogin } from './admins/Login';
import { default as AdminsSignin } from './admins/Signin';
import Home from './Home';
import FlashMessage from './FlashMessage';
import Profile from './Profile';
import MeetingManager from './MeetingManager';

import '../stylesheets/app.css';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flashMessages: []
    }
    this.handleNewFlashMessage = this.handleNewFlashMessage.bind(this);
    this.clearFlashMessages = this.clearFlashMessages.bind(this);
  }

  handleNewFlashMessage(flashMessage) {
    this.setState((prevState) => {
      let newFlashMessages = prevState.flashMessages.splice(0);
      newFlashMessages.push(flashMessage);
      return {
        flashMessages: newFlashMessages
      };
    });
  }

  clearFlashMessages() {
    this.setState({
      flashMessages: []
    });
  }

  render() {
    const flashMessages = this.state.flashMessages.map((flashMessage, i) => {
      return <FlashMessage key={i} flashMessage={flashMessage} />
    });

    return(
      <div className="app">
        <Router>
          <Container>
          {flashMessages}
            <Switch>
              <Route
                exact path="/"
                render={(props) => <Home {...props} handleNewFlashMessage={this.handleNewFlashMessage} clearFlashMessages={this.clearFlashMessages} />}
              />
              <Route
                exact path="/student/register"
                render={(props) => <StudentsRegister {...props} handleNewFlashMessage={this.handleNewFlashMessage} clearFlashMessages={this.clearFlashMessages} />}
              />
              <Route
                exact path="/student/login"
                render={(props) => <StudentsLogin {...props} handleNewFlashMessage={this.handleNewFlashMessage} clearFlashMessages={this.clearFlashMessages} />}
              />
              <Route
                exact path="/student/profile"
                render={(props) => <Profile {...props} model="students" handleNewFlashMessage={this.handleNewFlashMessage} clearFlashMessages={this.clearFlashMessages} />}
              />
              <Route
                exact path="/student/signin"
                render={(props) => <StudentsSignin {...props} handleNewFlashMessage={this.handleNewFlashMessage} clearFlashMessages={this.clearFlashMessages} />}
              />
              <Route
                exact path="/admin/register"
                render={(props) => <AdminsRegister {...props} handleNewFlashMessage={this.handleNewFlashMessage} clearFlashMessages={this.clearFlashMessages} />}
              />
              <Route
                exact path="/admin/login"
                render={(props) => <AdminsLogin {...props} handleNewFlashMessage={this.handleNewFlashMessage} clearFlashMessages={this.clearFlashMessages} />}
              />
              <Route
                exact path="/admin/profile"
                render={(props) => <Profile {...props} model="admins" handleNewFlashMessage={this.handleNewFlashMessage} clearFlashMessages={this.clearFlashMessages} />}
              />
              <Route
                exact path="/admin/signin"
                render={(props) => <AdminsSignin {...props} handleNewFlashMessage={this.handleNewFlashMessage} clearFlashMessages={this.clearFlashMessages} />}
              />
              <Route
                exact path="/meetings"
                render={(props) => <MeetingManager {...props} handleNewFlashMessage={this.handleNewFlashMessage} clearFlashMessages={this.clearFlashMessages} />}
              />
            </Switch>
          </Container>
        </Router>
      </div>
    );
  }
}
