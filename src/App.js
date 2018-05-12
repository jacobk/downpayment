// @flow

import React, { Component, Fragment } from "react";
import { withFormik } from "formik";

import "./App.css";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file

import CumChart from "./CumChart";

class App extends Component {
  constructor(props) {
    super(props);
    const { values } = props;
    this.state = {
      values
    };
  }

  updateChartParams = e => {
    e.preventDefault();
    const { values } = this.props;
    this.setState({ values });
  };

  render() {
    const { values, handleChange, handleBlur } = this.props;
    let { amount, debt, age, downPayment, retirement } = this.state.values;

    amount = parseInt(amount, 10);
    debt = parseInt(debt, 10);
    age = parseInt(age, 10);
    downPayment = parseInt(downPayment, 10);
    retirement = parseInt(retirement, 10);

    return (
      <Fragment>
        <form>
          <label>
            Valuation
            <input
              type="text"
              name="amount"
              value={values.amount}
              placeholder="Valuation"
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </label>
          <label>
            Debt
            <input
              type="text"
              name="debt"
              value={values.debt}
              placeholder="Debt"
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </label>
          <label>
            Your age
            <input
              type="text"
              name="age"
              value={values.age}
              placeholder="Age"
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </label>
          <label>
            Retirment age
            <input
              type="text"
              name="retirement"
              value={values.retirement}
              placeholder="Retirement age"
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </label>
          <label>
            Month. down payment
            <input
              type="text"
              name="downPayment"
              value={values.downPayment}
              placeholder="Down payment"
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </label>
          <button onClick={this.updateChartParams}>Apply</button>
        </form>
        <CumChart
          age={age}
          amount={amount}
          debt={debt}
          downPayment={downPayment}
          retirementAge={retirement}
        />
      </Fragment>
    );
  }
}

export default withFormik({
  mapPropsToValues: props => ({
    amount: 3600000,
    debt: 2700000,
    interestRate: 0.03,
    age: 34,
    retirement: 65,
    downPayment: Math.floor(2700000 * 0.02 / 12)
  })
})(App);
