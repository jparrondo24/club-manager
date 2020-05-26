import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
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
        </tr>
      );
    });
    if (this.props.hiddenText && this.props.students.length == 0) {
      return (
        <p className="hidden-text">{this.props.hiddenText}</p>
      );
    } else {
      let copyButtonDiv = null;
      if (this.props.includeButtons && this.props.students.length != 0) {
        let nameString = this.props.students[0].name;
        let emailString = this.props.students[0].email;

        for (let i = 1; i < this.props.students.length; i++) {
          nameString += ("\n" + this.props.students[i].name);
          emailString += (', ' + this.props.students[i].email);
        }
        copyButtonDiv = (
          <div className="text-center copy-buttons">
            <CopyToClipboard text={nameString}>
              <Button>Copy Names <i className="fa fa-user"></i></Button>
            </CopyToClipboard>
            <CopyToClipboard text={emailString}>
              <Button>Copy Emails <i className="fa fa-envelope"></i></Button>
            </CopyToClipboard>
          </div>
        );
      }
      return (
        <div className="student-table">
          {copyButtonDiv}
          <Table size={this.props.small ? "sm" : "" } responsive bordered>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {tableRows}
            </tbody>
          </Table>
        </div>
      );
    }
  }
}
