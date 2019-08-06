import React from 'react';
import { Table } from 'react-bootstrap';
import '../stylesheets/studenttable.css';

export default class StudentTable extends React.Component {
  render() {
    const students = this.props.students ? [].concat(this.props.students) : null;
    students.sort((a, b) => a.group > b.group);
    const tableRows = students.map((student) => {
      return (
        <tr key={student._id}>
          <th>{student.name}</th>
          <th>{student.email}</th>
          <th>{student.group ? student.group : "None yet"}</th>
        </tr>
      );
    });
    if (this.props.hiddenText && this.props.students.length == 0) {
      return (
        <p className="hidden-text">{this.props.hiddenText}</p>
      );
    } else {
      return (
        <Table size={this.props.small ? "sm" : "" } responsive bordered>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Group</th>
            </tr>
          </thead>
          <tbody>
            {tableRows}
          </tbody>
        </Table>
      );
    }
  }
}
