import React from 'react';
import axios from 'axios';
import { Form, Row, Col, Button } from 'react-bootstrap';

export default class FieldEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    if (!this.state.isEditing) {
      this.setState({
        isEditing: true
      });
    } else {
      axios({
        method: 'PUT',
        url: "/api/" + this.props.model + "/" + this.props.userId,
        data: {
          [this.props.field]: this.props.value
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
          isEditing: false
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

  render() {
    const { field } = this.props;
    const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
    let buttonClass = "edit-button";
    let iconClass = "fa fa-pencil";
    if (this.state.isEditing) {
      buttonClass = ""
      iconClass = "fa fa-check";
    }
    return(
      <Form onSubmit={this.handleSubmit}>
        <Form.Group as={Row} controlId={field}>
          <Form.Label column xs="2" md="2">{fieldLabel}</Form.Label>
          <Col xs="7" md="4">
            <Form.Control
              plaintext={!this.state.isEditing}
              readOnly={!this.state.isEditing}
              name={field}
              onChange={this.props.handleFieldChange}
              value={this.props.value}
              className="form-input"
              type="text"
            />
          </Col>
          <Col xs="2" md="2">
            <Button type="submit" variant="primary">
              <i className={iconClass}></i>
            </Button>
          </Col>
        </Form.Group>
      </Form>
    );
  }
}
