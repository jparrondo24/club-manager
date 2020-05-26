import React from 'react';
import axios from 'axios';
import StudentTable from './StudentTable.js';
import '../stylesheets/roster.css'

export default class Roster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      students: []
    };
  }
  componentWillMount() {
    axios({
      method: 'GET',
      url: '/api/students'
    }).then((response) => {
      const { data } = response;
      this.setState({
        students: data.students
      });
    }).catch((error) => {
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
      <div className="roster">
        <h1 className="text-center">Student Roster</h1>
        <StudentTable students={this.state.students} includeButtons />
      </div>
    );
  }
}