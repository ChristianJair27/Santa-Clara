import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUser, removeUser } from "../redux/slices/userSlice";
import { axiosWrapper } from "../https/axiosWrapper";

const useLoadData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const path = window.location.pathname;
    const t = localStorage.getItem("access_token");

    // ⛔ NO pedir /me si no hay token o si estoy en /profiles (login tipo Netflix)
    if (!t || path === "/profiles") {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axiosWrapper.get("/users/me"); // <- correcto
        const user = res?.data;
        if (!user) throw new Error("User data is undefined");
        const { id, name, email, phone, role } = user;
        dispatch(setUser({ id, name, email, phone, role }));
      } catch (error) {
        console.error("❌ Error loading user:", error.message);
        dispatch(removeUser());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  return isLoading;
};

export default useLoadData;
