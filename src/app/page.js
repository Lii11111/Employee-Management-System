'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export default function EmployeeManagementSystem() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    status: 'active'
  });

  // Sample departments
  const departments = ['Information Technology', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];

  // Load employees from Firestore (only show non-deleted employees)
  useEffect(() => {
    const employeesRef = collection(db, 'employees');
    
    const unsubscribe = onSnapshot(employeesRef, (snapshot) => {
      const employeesArray = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(emp => !emp.deleted); // Only show employees that are not deleted
      setEmployees(employeesArray);
      setLoading(false);
    }, (error) => {
      console.error('Error loading employees:', error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // CREATE - Add a new employee to Firestore
  const addEmployee = async () => {
    if (newEmployee.name.trim() !== '' && newEmployee.position.trim() !== '') {
      try {
        const employeesRef = collection(db, 'employees');
        
        const employee = {
          ...newEmployee,
          hireDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          deleted: false // Mark as not deleted by default
        };
        
        await addDoc(employeesRef, employee);
        
        setNewEmployee({
          name: '',
          position: '',
          department: '',
          email: '',
          phone: '',
          status: 'active'
        });
        setShowAddForm(false);
      } catch (error) {
        console.error('Error adding employee:', error);
        alert('Error adding employee. Please try again.');
      }
    }
  };

  // UPDATE - Start editing an employee
  const startEditing = (employee) => {
    setEditingId(employee.id);
    setEditingEmployee({ ...employee });
  };

  // UPDATE - Save edited employee to Firestore
  const saveEdit = async () => {
    if (editingEmployee.name.trim() !== '' && editingEmployee.position.trim() !== '') {
      try {
        const employeeRef = doc(db, 'employees', editingId);
        const { id, ...employeeData } = editingEmployee; // Remove id from update data
        await updateDoc(employeeRef, employeeData);
        
        setEditingId(null);
        setEditingEmployee({
          name: '',
          position: '',
          department: '',
          email: '',
          phone: ''
        });
      } catch (error) {
        console.error('Error updating employee:', error);
        alert('Error updating employee. Please try again.');
      }
    }
  };

  // UPDATE - Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditingEmployee({
      name: '',
      position: '',
      department: '',
      email: '',
      phone: ''
    });
  };

  // DELETE - Soft delete (mark as deleted but keep in Firestore)
  const deleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const employeeRef = doc(db, 'employees', id);
        // Instead of deleting, mark as deleted and add timestamp
        await updateDoc(employeeRef, { 
          deleted: true,
          deletedAt: new Date().toISOString()
        });
        console.log('Employee marked as deleted (data remains in Firestore):', id);
        // Data will be automatically hidden from UI due to filter in useEffect
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert(`Error deleting employee: ${error.message}`);
      }
    }
  };

  // UPDATE - Toggle employee status in Firestore
  const toggleStatus = async (id, currentStatus) => {
    try {
      const employeeRef = doc(db, 'employees', id);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(employeeRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating employee status:', error);
      alert('Error updating employee status. Please try again.');
    }
  };

  // Filter employees based on status
  const [filter, setFilter] = useState('all');
  const filteredEmployees = employees.filter(emp => {
    if (filter === 'active') return emp.status === 'active';
    if (filter === 'inactive') return emp.status === 'inactive';
    if (filter === 'on-leave') return emp.status === 'on-leave';
    return true;
  });

  // Handle input changes for new employee form
  const handleNewEmployeeChange = (field, value) => {
    setNewEmployee({
      ...newEmployee,
      [field]: value
    });
  };

  // Handle input changes for editing employee
  const handleEditChange = (field, value) => {
    setEditingEmployee({
      ...editingEmployee,
      [field]: value
    });
  };

  // Stats calculations
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const inactiveEmployees = employees.filter(emp => emp.status === 'inactive').length;
  const onLeaveEmployees = employees.filter(emp => emp.status === 'on-leave').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-6 text-lg font-semibold text-gray-700 dark:text-gray-300">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10 pt-4">
          <div className="inline-block mb-4">
            <span className="text-5xl sm:text-6xl">👥</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Employee Management System
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Manage your team efficiently with real-time updates powered by Firebase Firestore
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Employees</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{employees.length}</p>
              </div>
              <div className="text-3xl sm:text-4xl">📊</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-6 border border-green-100 dark:border-green-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Active</h3>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{activeEmployees}</p>
              </div>
              <div className="text-3xl sm:text-4xl">✅</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-6 border border-red-100 dark:border-red-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Inactive</h3>
                <p className="text-2xl sm:text-3xl font-bold text-red-600">{inactiveEmployees}</p>
              </div>
              <div className="text-3xl sm:text-4xl">⛔</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-6 border border-yellow-100 dark:border-yellow-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">On Leave</h3>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{onLeaveEmployees}</p>
              </div>
              <div className="text-3xl sm:text-4xl">🏖️</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'inactive', 'on-leave'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium focus:outline-none transition-all duration-200 text-sm sm:text-base ${
                    filter === filterType
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg focus:outline-none shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <span className="text-xl">➕</span>
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Add Employee Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all animate-slideUp border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span>👤</span>
                  <span>Add New Employee</span>
                </h2>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => handleNewEmployeeChange('name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Position *</label>
                  <input
                    type="text"
                    value={newEmployee.position}
                    onChange={(e) => handleNewEmployeeChange('position', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Department</label>
                  <select
                    value={newEmployee.department}
                    onChange={(e) => handleNewEmployeeChange('department', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => handleNewEmployeeChange('email', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input
                    type="text"
                    value={newEmployee.phone}
                    onChange={(e) => handleNewEmployeeChange('phone', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={newEmployee.status}
                    onChange={(e) => handleNewEmployeeChange('status', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addEmployee}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg focus:outline-none shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  Add Employee
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {filter === 'all' 
                  ? "No Employees Yet" 
                  : `No ${filter} Employees`}
              </p>
              <p className="text-gray-500 dark:text-gray-500">
                {filter === 'all' 
                  ? "Click 'Add Employee' button to get started!" 
                  : `No employees with ${filter} status.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Position</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Department</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">Contact</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-4 sm:px-6 py-4">
                        {editingId === employee.id ? (
                          <input
                            type="text"
                            value={editingEmployee.name}
                            onChange={(e) => handleEditChange('name', e.target.value)}
                            className="w-full px-3 py-1.5 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-white text-sm"
                          />
                        ) : (
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{employee.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden mt-1">
                              {employee.position}
                              {employee.department && ` • ${employee.department}`}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                        {editingId === employee.id ? (
                          <input
                            type="text"
                            value={editingEmployee.position}
                            onChange={(e) => handleEditChange('position', e.target.value)}
                            className="w-full px-3 py-1.5 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-white text-sm"
                          />
                        ) : (
                          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{employee.position}</div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                        {editingId === employee.id ? (
                          <select
                            value={editingEmployee.department}
                            onChange={(e) => handleEditChange('department', e.target.value)}
                            className="w-full px-3 py-1.5 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-white text-sm"
                          >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-md text-xs font-medium">
                              {employee.department || 'N/A'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden xl:table-cell">
                        {editingId === employee.id ? (
                          <div className="space-y-2">
                            <input
                              type="email"
                              value={editingEmployee.email}
                              onChange={(e) => handleEditChange('email', e.target.value)}
                              className="w-full px-3 py-1.5 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-white text-sm"
                              placeholder="Email"
                            />
                            <input
                              type="text"
                              value={editingEmployee.phone}
                              onChange={(e) => handleEditChange('phone', e.target.value)}
                              className="w-full px-3 py-1.5 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-white text-sm"
                              placeholder="Phone"
                            />
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div className="text-gray-700 dark:text-gray-300 truncate max-w-xs">{employee.email}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">{employee.phone}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {editingId === employee.id ? (
                          <select
                            value={editingEmployee.status}
                            onChange={(e) => handleEditChange('status', e.target.value)}
                            className="w-full px-3 py-1.5 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-white text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="on-leave">On Leave</option>
                          </select>
                        ) : (
                          <span 
                            className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full cursor-pointer transition-all hover:scale-105 ${
                              employee.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 hover:bg-green-200' 
                                : employee.status === 'on-leave'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 hover:bg-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 hover:bg-red-200'
                            }`}
                            onClick={() => toggleStatus(employee.id, employee.status)}
                          >
                            {employee.status === 'active' ? '✅ Active' : employee.status === 'on-leave' ? '🏖️ On Leave' : '⛔ Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                        {editingId === employee.id ? (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={saveEdit}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all font-semibold text-xs"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition-all font-semibold text-xs"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => startEditing(employee)}
                              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all font-semibold text-xs"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => deleteEmployee(employee.id)}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-semibold text-xs"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}