import { INTERSWITCH } from "@/constants/interswitch";
import React from "react";
import { InterswitchPay } from "react-interswitch";

const PopupPayout = () => {
  const params = {
    merchantCode: INTERSWITCH.MERCHANT_CODE,
    payItemID: INTERSWITCH.PAYABLE_CODE,
    customerEmail: "johndoe@gmail.com",
    redirectURL: "http://localhost:3000",
    text: "Pay Now",
    mode: "TEST", // 'TEST' or 'LIVE'
    transactionReference: Date.now().toString(),
    amount: "10000", // Amount in kobo
    callback: (response) => {
      console.log("response: ", response);
    },
  };

  return <InterswitchPay {...params} />;
};

export default PopupPayout;
