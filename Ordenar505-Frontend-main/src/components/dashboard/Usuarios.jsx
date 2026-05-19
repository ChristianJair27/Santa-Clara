// import React, { useEffect, useState } from "react";
// import { axiosWrapper } from "../../https/axiosWrapper";
// import AddUserModal from "./AddUserModal";

// const Usuarios = () => {
//   const [users, setUsers] = useState([]);
//   const [isAddUserOpen, setIsAddUserOpen] = useState(false);
//   const [editingUser, setEditingUser] = useState(null);
//   const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "" });
//   const token = localStorage.getItem("token"); // o desde cookies si lo manejas así

//   const fetchUsers = async () => {
//     try {
//       const res = await axiosWrapper.get("/api/user"); // ya tiene baseURL
//       const userList = res.data?.data || res.data || []; // soporte para backend sin `.data`
//       setUsers(userList);
//     } catch (err) {
//       console.error("Error al cargar usuarios:", err);
//       setUsers([]);
//     }
//   };

//   const handleDelete = async (id) => {
//     try {
//       await axiosWrapper.delete(`/api/user/${id}`);
//       fetchUsers();
//     } catch (err) {
//       console.error("Error al eliminar usuario:", err);
//     }
//   };

//   const handleEditClick = (user) => {
//     setEditingUser(user);
//     setFormData({
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       role: user.role,
//     });
//   };

//   const handleEditSubmit = async (e) => {
//   e.preventDefault();

//   try {
//     const token = localStorage.getItem("token");
//     await axiosWrapper.put(`/api/user/${editingUser.id}`, formData, {
//       headers: {
//         Authorization: `Bearer ${token}`
//       },
//       withCredentials: true
//     });
//     fetchUsers();
//     setEditingUser(null);
//   } catch (err) {
//     console.error("Error al editar usuario:", err);
//   }
// };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   return (
//     <div className="text-white p-6">
//       <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
//       <div className="flex justify-end mb-4">
//         <button onClick={() => setIsAddUserOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded">
//           Agregar Usuario
//         </button>
//       </div>

//       <table className="w-full text-left border border-gray-600">
//         <thead>
//           <tr className="bg-[#2a2a2a]">
//             <th className="p-2 border border-gray-600">Nombre</th>
//             <th className="p-2 border border-gray-600">Correo</th>
//             <th className="p-2 border border-gray-600">Rol</th>
//             <th className="p-2 border border-gray-600">Acciones</th>
//           </tr>
//         </thead>
//         <tbody>
//           {users.map((user) => (
//             <tr key={user.id} className="hover:bg-[#333]">
//               <td className="p-2 border border-gray-600">{user.name}</td>
//               <td className="p-2 border border-gray-600">{user.email}</td>
//               <td className="p-2 border border-gray-600">{user.role}</td>
//               <td className="p-2 border border-gray-600">
//                 <button
//                   onClick={() => handleEditClick(user)}
//                   className="bg-yellow-500 px-2 py-1 rounded text-black mr-2"
//                 >
//                   Editar
//                 </button>
//                 <button
//                   onClick={() => handleDelete(user.id)}
//                   className="bg-red-500 px-2 py-1 rounded text-white"
//                 >
//                   Eliminar
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {isAddUserOpen && (
//         <AddUserModal setIsOpen={setIsAddUserOpen} onUserAdded={fetchUsers} />
//       )}

//       {editingUser && (
//         <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
//           <div className="bg-white p-6 rounded text-black">
//             <h2 className="text-xl mb-4">Editar Usuario</h2>
//             <input
//               type="text"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               className="mb-2 p-2 border w-full"
//               placeholder="Nombre"
//             />
//             <input
//               type="email"
//               value={formData.email}
//               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//               className="mb-2 p-2 border w-full"
//               placeholder="Correo"
//             />
//             <input
//               type="text"
//               value={formData.phone}
//               onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//               className="mb-2 p-2 border w-full"
//               placeholder="Teléfono"
//             />
//             <input
//               type="text"
//               value={formData.role}
//               onChange={(e) => setFormData({ ...formData, role: e.target.value })}
//               className="mb-2 p-2 border w-full"
//               placeholder="Rol"
//             />
//             <div className="flex gap-4">
//               <button
//                 onClick={handleEditSubmit}
//                 className="bg-green-600 text-white px-4 py-2 rounded"
//               >
//                 Guardar
//               </button>
//               <button
//                 onClick={() => setEditingUser(null)}
//                 className="bg-gray-400 text-white px-4 py-2 rounded"
//               >
//                 Cancelar
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Usuarios;






import React, { useEffect, useState } from "react";
import { axiosWrapper } from "../../https/axiosWrapper";
import AddUserModal from "./AddUserModal";

const Usuarios = () => {
  const [users, setUsers] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    role: "" 
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosWrapper.get("/api/user");
      const userList = res.data?.data || res.data || [];
      setUsers(userList);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    
    try {
      await axiosWrapper.delete(`/api/user/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosWrapper.put(`/api/user/${editingUser.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
      fetchUsers();
      setEditingUser(null);
    } catch (err) {
      console.error("Error al editar usuario:", err);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-1">Administra los usuarios del sistema</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm px-4 py-2">
            <span className="text-gray-500 text-sm">Total de usuarios</span>
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-1/2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <button 
              onClick={() => setIsAddUserOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Usuario
            </button>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.phone || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <AddUserModal setIsOpen={setIsAddUserOpen} onUserAdded={fetchUsers} />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Editar Usuario</h3>
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar rol</option>
                      <option value="admin">Administrador</option>
                      <option value="Waiter">Mesero</option>
                      
                    </select>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    >
                      Guardar cambios
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;