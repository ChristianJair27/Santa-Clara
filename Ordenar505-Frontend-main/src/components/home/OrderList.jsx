import React from "react";
import { FaCheckDouble, FaLongArrowAltRight, FaCircle } from "react-icons/fa";
import { getAvatarName } from "../../utils/index";
import { useNavigate } from "react-router-dom";

const OrderList = ({ order }) => {
  const navigate = useNavigate();

  if (!order) return null;

  const customerName = order?.customerDetails?.name || "Sin nombre";
  const itemCount = order?.items?.length || 0;
  const tableNumber = order?.table?.table_no || "N/A";
  const orderStatus = order?.orderStatus || "In Progress";

  const handleClick = () => {
    navigate(`/orden/${order.id}`); // 👈 ID de la orden, ajusta según tu backend
  };

  return (
    <div
      className="flex items-center gap-5 mb-3 cursor-pointer hover:bg-[#333] p-2 rounded-lg"
      onClick={handleClick}
    >
      <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
        {getAvatarName(customerName)}
      </button>
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            {customerName}
          </h1>
          <p className="text-[#ababab] text-sm">{itemCount} Items</p>
        </div>

        <h1 className="text-[#f6b100] font-semibold border border-[#f6b100] rounded-lg p-1">
          Table <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" /> {tableNumber}
        </h1>

        <div className="flex flex-col items-end gap-2">
          {orderStatus === "Ready" ? (
            <p className="text-green-600 bg-[#2e4a40] px-2 py-1 rounded-lg">
              <FaCheckDouble className="inline mr-2" /> {orderStatus}
            </p>
          ) : (
            <p className="text-yellow-600 bg-[#4a452e] px-2 py-1 rounded-lg">
              <FaCircle className="inline mr-2" /> {orderStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;