import api from "@/services/api";
import React from "react";

const CardPayment = () => {
  const handlePayment = async () => {
    try {
      const res = await api.post("/public/pay/card-payment");

      console.log(res);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <button onClick={handlePayment}>Make Payment</button>
    </div>
  );
};

export default CardPayment;
