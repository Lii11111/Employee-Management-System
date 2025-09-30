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
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'success', // 'success', 'error', 'confirm'
    title: '',
    message: '',
    onConfirm: null
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  // Sample departments
  const departments = ['Information Technology', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  
  // Show modal helper
  const showNotification = (type, title, message) => {
    setModalConfig({ type, title, message, onConfirm: null });
    setShowModal(true);
    if (type === 'success') {
      setTimeout(() => setShowModal(false), 2000);
    }
  };

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
        showNotification('success', 'Success!', 'Employee added successfully!');
      } catch (error) {
        console.error('Error adding employee:', error);
        showNotification('error', 'Error', 'Failed to add employee. Please try again.');
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
        showNotification('success', 'Updated!', 'Employee updated successfully!');
      } catch (error) {
        console.error('Error updating employee:', error);
        showNotification('error', 'Error', 'Failed to update employee. Please try again.');
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
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    try {
      const employeeRef = doc(db, 'employees', deleteConfirm.id);
      // Instead of deleting, mark as deleted and add timestamp
      await updateDoc(employeeRef, { 
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      console.log('Employee marked as deleted (data remains in Firestore):', deleteConfirm.id);
      setDeleteConfirm({ show: false, id: null });
      showNotification('success', 'Deleted!', 'Employee removed successfully!');
    } catch (error) {
      console.error('Error deleting employee:', error);
      setDeleteConfirm({ show: false, id: null });
      showNotification('error', 'Error', 'Failed to delete employee. Please try again.');
    }
  };

  // UPDATE - Toggle employee status in Firestore
  const toggleStatus = async (id, currentStatus) => {
    try {
      const employeeRef = doc(db, 'employees', id);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(employeeRef, { status: newStatus });
      showNotification('success', 'Status Updated!', `Employee status changed to ${newStatus}`);
    } catch (error) {
      console.error('Error updating employee status:', error);
      showNotification('error', 'Error', 'Failed to update status. Please try again.');
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-700 dark:text-gray-300 animate-pulse">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10 pt-4">
          <div className="inline-block mb-4 transform hover:scale-110 transition-transform duration-300">
            <span className="text-5xl sm:text-6xl md:text-7xl">👥</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 px-4">
            Employee Management System
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Manage your team efficiently with real-time updates powered by Firebase
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 border-2 border-transparent hover:border-indigo-300 dark:hover:border-indigo-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total</h3>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{employees.length}</p>
              </div>
              <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-300">📊</div>
            </div>
          </div>
          <div className="group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 border-2 border-transparent hover:border-green-300 dark:hover:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Active</h3>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">{activeEmployees}</p>
              </div>
              <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-300">✅</div>
            </div>
          </div>
          <div className="group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 border-2 border-transparent hover:border-red-300 dark:hover:border-red-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Inactive</h3>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">{inactiveEmployees}</p>
              </div>
              <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-300">⛔</div>
            </div>
          </div>
          <div className="group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 border-2 border-transparent hover:border-yellow-300 dark:hover:border-yellow-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">On Leave</h3>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-600">{onLeaveEmployees}</p>
              </div>
              <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-300">🏖️</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All', emoji: '📋' },
                { value: 'active', label: 'Active', emoji: '✅' },
                { value: 'inactive', label: 'Inactive', emoji: '⛔' },
                { value: 'on-leave', label: 'On Leave', emoji: '🏖️' }
              ].map((filterType) => (
                <button
                  key={filterType.value}
                  onClick={() => setFilter(filterType.value)}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base focus:outline-none transform transition-all duration-200 ${
                    filter === filterType.value
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                  }`}
                >
                  <span className="hidden sm:inline mr-2">{filterType.emoji}</span>
                  {filterType.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-lg sm:rounded-xl focus:outline-none shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <span className="text-xl sm:text-2xl">➕</span>
              <span>Add New Employee</span>
            </button>
          </div>
        </div>

        {/* Add Employee Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all animate-slideUp border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="text-3xl">👤</span>
                  <span>Add New Employee</span>
                </h2>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl transform hover:rotate-90 transition-transform duration-200"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-5">
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span>📝</span> Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => handleNewEmployeeChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span>💼</span> Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.position}
                    onChange={(e) => handleNewEmployeeChange('position', e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span>🏢</span> Department
                  </label>
                  <select
                    value={newEmployee.department}
                    onChange={(e) => handleNewEmployeeChange('department', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span>📧</span> Email
                  </label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => handleNewEmployeeChange('email', e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span>📱</span> Phone
                  </label>
                  <input
                    type="text"
                    value={newEmployee.phone}
                    onChange={(e) => handleNewEmployeeChange('phone', e.target.value)}
                    placeholder="+63 XXX XXX XXXX"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span>🔄</span> Status
                  </label>
                  <select
                    value={newEmployee.status}
                    onChange={(e) => handleNewEmployeeChange('status', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  >
                    <option value="active">✅ Active</option>
                    <option value="inactive">⛔ Inactive</option>
                    <option value="on-leave">🏖️ On Leave</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl focus:outline-none font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={addEmployee}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl focus:outline-none font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  ✨ Add Employee
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
          {filteredEmployees.length === 0 ? (
            <div className="p-12 sm:p-16 text-center">
              <div className="text-6xl sm:text-8xl mb-6 animate-bounce">📭</div>
              <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                {filter === 'all' 
                  ? "No Employees Yet" 
                  : `No ${filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')} Employees`}
              </p>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500">
                {filter === 'all' 
                  ? "Click the 'Add New Employee' button to get started!" 
                  : `No employees with ${filter} status found.`}
              </p>
        </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <span className="hidden sm:inline">👤 </span>Employee
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      <span className="hidden sm:inline">💼 </span>Position
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      <span className="hidden sm:inline">🏢 </span>Department
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                      <span className="hidden sm:inline">📞 </span>Contact
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <span className="hidden sm:inline">🔄 </span>Status
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <span className="hidden sm:inline">⚡ </span>Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEmployees.map((employee, index) => (
                    <tr 
                      key={employee.id} 
                      className="hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-[1.01]"
                      style={{animationDelay: `${index * 50}ms`}}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        {editingId === employee.id ? (
                          <input
                            type="text"
                            value={editingEmployee.name}
                            onChange={(e) => handleEditChange('name', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-gray-600 dark:text-white text-sm"
                          />
                        ) : (
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{employee.name}</div>
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
                            className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-gray-600 dark:text-white text-sm"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{employee.position}</div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                        {editingId === employee.id ? (
                          <select
                            value={editingEmployee.department}
                            onChange={(e) => handleEditChange('department', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-gray-600 dark:text-white text-sm"
                          >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm">
                            <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-bold">
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
                              placeholder="Email"
                              className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-gray-600 dark:text-white text-sm"
                            />
                            <input
                              type="text"
                              value={editingEmployee.phone}
                              onChange={(e) => handleEditChange('phone', e.target.value)}
                              placeholder="Phone"
                              className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-gray-600 dark:text-white text-sm"
                            />
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px]">
                              📧 {employee.email}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                              📱 {employee.phone}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {editingId === employee.id ? (
                          <select
                            value={editingEmployee.status}
                            onChange={(e) => handleEditChange('status', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-gray-600 dark:text-white text-sm"
                          >
                            <option value="active">✅ Active</option>
                            <option value="inactive">⛔ Inactive</option>
                            <option value="on-leave">🏖️ On Leave</option>
                          </select>
                        ) : (
                          <span 
                            className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full cursor-pointer transform hover:scale-110 transition-all duration-200 ${
                              employee.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 hover:bg-green-200 hover:shadow-lg' 
                                : employee.status === 'on-leave'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 hover:bg-yellow-200 hover:shadow-lg'
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 hover:bg-red-200 hover:shadow-lg'
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
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transform hover:scale-110 transition-all duration-200 font-semibold text-xs shadow-md"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transform hover:scale-110 transition-all duration-200 font-semibold text-xs shadow-md"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => startEditing(employee)}
                              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transform hover:scale-110 transition-all duration-200 font-semibold text-xs shadow-md"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => deleteEmployee(employee.id)}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transform hover:scale-110 transition-all duration-200 font-semibold text-xs shadow-md"
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

        {/* Notification Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all animate-slideUp border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                {modalConfig.type === 'success' && (
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                    <span className="text-4xl">✅</span>
                  </div>
                )}
                {modalConfig.type === 'error' && (
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                    <span className="text-4xl">❌</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {modalConfig.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {modalConfig.message}
                </p>
                {modalConfig.type === 'error' && (
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl focus:outline-none shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all animate-slideUp border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Confirm Delete
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to delete this employee? The data will remain in the database but hidden from view.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm({ show: false, id: null })}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl focus:outline-none transform hover:scale-105 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl focus:outline-none shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}