import React from "react";
import "./index.css";
import { INTERSWITCH } from "@/constants/interswitch";

const HostedFields = ({ api }) => {
  const handlePay = () => {
    const onValid = (err, response) => {
      console.log(err, response);

      const handlePay = (err, response) => {
        console.log(err, response);
      };

      api.makePayment(handlePay);
    };

    api.getBinConfiguration(onValid);
  };

  // 4187452482879558
  // 02/28
  // 831

  // 5061047200090312990
  // 03/29
  // 571

  return (
    <div className="container">
      <div className="alertSuccess" id="response">
        <p id="response-code" style={{ padding: "0px 10px" }}></p>
        <p id="response-message" style={{ padding: "0px 10px" }}></p>
      </div>

      <div className="form-page card-details show">
        <div className="card">
          <div className="flex-x flex-sb">
            <div className="col col-6">
              <h3>Pay with Card</h3>
            </div>

            <div className="logo-container">
              <div className="image">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/618px-Mastercard-logo.svg.png" />
              </div>
              <div className="image">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWYAAACNCAMAAACzDCDR..." />
              </div>
            </div>
          </div>

          <div>
            <div className="form-group">
              <div className="input-label">Card number</div>
              <div className="input" id="cardNumber-container"></div>
            </div>
          </div>

          <div className="flex-x flex-sb">
            <div className="col-6 form-group">
              <div className="input-label">Expiry</div>
              <div className="input" id="expirationDate-container"></div>
            </div>

            <div className="col-6 form-group">
              <div className="input-label">CVV</div>
              <div className="input" id="cvv-container"></div>
            </div>
          </div>
        </div>

        <button className="btn" id="pay-button" onClick={handlePay}>
          Pay &#8358; <span id="amount">{INTERSWITCH.AMOUNT_KOBO / 100}</span>
        </button>
      </div>

      <div className="form-page pin">
        <div className="card">
          <span className="back-control" id="pin-back-button">
            <label>Back</label>
          </span>

          <div className="form-control" style={{ marginTop: "20px" }}>
            <div className="input-label">Please provide your PIN</div>
            <div id="pin-container" className="input"></div>
          </div>

          <div className="button-container">
            <button id="continue-button" className="btn">
              Continue
            </button>
          </div>
        </div>
      </div>

      <div className="form-page otp">
        <div className="card">
          <span className="back-control" id="otp-back-button">
            <label>Back</label>
          </span>

          <div className="form-control" style={{ marginTop: "20px" }}>
            <label>Please input the OTP sent to your mobile number</label>
            <div id="otp-container" className="input"></div>
          </div>

          <div className="button-container">
            <button id="validate-button" className="btn">
              Validate
            </button>
          </div>
        </div>
      </div>

      <div className="form-page cardinal">
        <div className="cardinal-container"></div>
      </div>
    </div>
  );
};

export default HostedFields;
