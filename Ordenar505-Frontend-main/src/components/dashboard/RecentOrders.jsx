import React from "react";
import { GrUpdate } from "react-icons/gr";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders, updateOrderStatus } from "../../https/index";
import { formatDateAndTime } from "../../utils";

const RecentOrders = () => {
  const queryClient = useQueryClient();

  const handleStatusChange = ({ orderId, orderStatus }) => {
    orderStatusUpdateMutation.mutate({ orderId, orderStatus });
  };

  const orderStatusUpdateMutation = useMutation({
    mutationFn: ({ orderId, orderStatus }) =>
      updateOrderStatus({ orderId, orderStatus }),
    onSuccess: () => {
      enqueueSnackbar("Order status updated successfully!", {
        variant: "success",
      });
      queryClient.invalidateQueries(["orders"]);
    },
    onError: () => {
      enqueueSnackbar("Failed to update order status!", { variant: "error" });
    },
  });

  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    placeholderData: keepPreviousData,
  });

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
    return null;
  }

  const orders = resData?.data?.data || [];

  return (
    <div className="container mx-auto bg-[#262626] p-4 rounded-lg">
      <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">
        Recent Orders
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[#f5f5f5]">
          <thead className="bg-[#333] text-[#ababab]">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date & Time</th>
              <th className="p-3">Table</th>
              <th className="p-3">Total</th>
              <th className="p-3 text-center">Payment</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-gray-600 hover:bg-[#333]"
              >
                <td className="p-4">#{order.id}</td>
                <td className="p-4">{order.name || "N/A"}</td>
                <td className="p-4">
                  <select
                    className={`bg-[#1a1a1a] text-[#f5f5f5] border border-gray-500 p-2 rounded-lg focus:outline-none ${
                      order.order_status === "Ready"
                        ? "text-green-500"
                        : "text-yellow-500"
                    }`}
                    value={order.order_status}
                    onChange={(e) =>
                      handleStatusChange({
                        orderId: order.id,
                        orderStatus: e.target.value,
                      })
                    }
                  >
                    <option className="text-yellow-500" value="In Progress">
                      En Progreso
                    </option>
                    <option className="text-green-500" value="Ready">
                      Listo
                    </option>
                  </select>
                </td>
                <td className="p-4">
                  {order.order_date
                    ? formatDateAndTime(order.order_date)
                    : "N/A"}
                </td>
                <td className="p-4">{order.table_id || "N/A"}</td>
                <td className="p-4">
                  ${Number(order.total_with_tax).toFixed(2) || "0.00"}
                </td>
                <td className="p-4 text-center">
                  {order.payment_method || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;