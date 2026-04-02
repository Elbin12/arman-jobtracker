import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  Phone, 
  Edit2, 
  Trash2, 
  Plus,
  X
} from 'lucide-react';
import {
  assigneesApi,
  useCreateAssigneeMutation,
  useDeleteAssigneeMutation,
  useGetAssigneesQuery,
  useUnassignFutureJobsMutation,
  useUpdateAssigneeMutation,
} from '../../store/api/assigneesApi';
import { Pagination } from '@mui/material';
import { useDispatch } from 'react-redux';
import { USER_PASSWORD } from '../../store/axios/axios';
import { TeamMemberCardSkeleton } from '../../components/ui/skeletons';
import { useToast } from '@/hooks/use-toast';

const TeamManagement = () => {
  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [unassignTargetMember, setUnassignTargetMember] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'worker'
  });

  const dispatch = useDispatch();
  const { toast } = useToast();

  const itemsPerPage = 20;

  const { data: teamData, isLoading } = useGetAssigneesQuery({ page, limit: itemsPerPage });
  const totalPages = Math.ceil(teamData?.results?.length / itemsPerPage);
  const totalCount = teamData?.count || 0;
  
  const [createAssignee] = useCreateAssigneeMutation();
  const [updateAssignee] = useUpdateAssigneeMutation();
  const [deleteAssignee] = useDeleteAssigneeMutation();
  const [unassignFutureJobs, { isLoading: isUnassigningJobs }] = useUnassignFutureJobsMutation();

  const handleAddMember = () => {
    setSelectedMember(null);
    setFormData({
      full_name: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'worker'
    });
    setShowDialog(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setFormData({
      full_name: `${member.first_name} ${member.last_name}`,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || '',
      role: member.role
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try{
      if (selectedMember) {
        const updated = await updateAssignee({
          id: selectedMember.id,
          ...formData
        }).unwrap();
        dispatch(
          assigneesApi.util.updateQueryData('getAssignees', { page, limit: itemsPerPage }, (draft) => {
            const index = draft.results.findIndex((m) => m.id === updated.id);
            if (index !== -1) draft.results[index] = updated;
          })
        );
      } else {
        const created = await createAssignee({
          username: formData.email, // Generate username from email
          password: USER_PASSWORD,
          ...formData
        }).unwrap();
        dispatch(
          assigneesApi.util.updateQueryData('getAssignees', { page, limit: itemsPerPage }, (draft) => {
            draft.results.unshift(created);
          })
        );
      }
      setShowDialog(false);
    }catch (error) {
      // Error handled by toast notification
    }
  };

  const handleDelete = (member) => {
    setSelectedMember(member);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAssignee(selectedMember.id).unwrap();
      dispatch(
        assigneesApi.util.updateQueryData('getAssignees', { page, limit: itemsPerPage }, (draft) => {
          draft.results = draft.results.filter((m) => m.id !== selectedMember.id);
        })
      );
      setShowDeleteDialog(false);
    } catch (error) {
      // Error handled by toast notification
    }
  };

  const toggleActive = async (member) => {
    try {
      const newActiveStatus = !member.is_active;
      const updated = await updateAssignee({
        id: member?.id,
        is_active: newActiveStatus
      }).unwrap();
      dispatch(
        assigneesApi.util.updateQueryData('getAssignees', { page, limit: itemsPerPage }, (draft) => {
          const existing = draft.results.find((m) => m.id === member.id);
          if (existing) {
            existing.is_active = updated?.is_active ?? newActiveStatus;
          }
        })
      );
      if (!newActiveStatus) {
        setUnassignTargetMember(member);
        setShowUnassignDialog(true);
      }
    } catch (error) {
      // Error handled by toast notification
    }
  };

  const handleOpenUnassignDialog = (member) => {
    setUnassignTargetMember(member);
    setShowUnassignDialog(true);
  };

  const handleClearFutureJobs = async () => {
    if (!unassignTargetMember?.id) return;
    try {
      const response = await unassignFutureJobs(unassignTargetMember.id).unwrap();
      const jobsAffected = response?.future_jobs_affected ?? response?.assignments_removed ?? 0;
      toast({
        title: 'Future jobs unassigned',
        description: response?.detail || `${jobsAffected} future jobs were unassigned successfully.`,
      });
      setShowUnassignDialog(false);
      setUnassignTargetMember(null);
    } catch (error) {
      toast({
        title: 'Failed to clear jobs',
        description: error?.data?.detail || 'Could not unassign future jobs. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      manager: 'bg-red-100 text-red-700',
      supervisor: 'bg-amber-100 text-amber-700',
      worker: 'bg-gray-100 text-gray-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Team Management</h1>
          <p className="text-gray-600">Manage your team members and their job assignments</p>
        </div>
        <button
          onClick={handleAddMember}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add Team Member
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <TeamMemberCardSkeleton count={8} />
      ) : (
        <>
          {/* Team Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
        {teamData?.results.map((member) => (
          <div 
            key={member.id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(member.first_name, member.last_name)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {member.first_name} {member.last_name}
                  </h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleBadgeColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={member.is_active}
                    onChange={() => toggleActive(member)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
                <button
                  onClick={() => handleEditMember(member)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(member)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} />
                <span className="truncate">{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} />
                  <span>{member.phone}</span>
                </div>
              )}
              {/* <div className="flex items-center gap-2 text-sm text-gray-600">
                <Briefcase size={14} />
                <span>{member.total_assignments} total assignments</span>
              </div> */}
            </div>

            {!member.is_active && (
              <div className="pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenUnassignDialog(member)}
                  className="w-full px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  Clear All Jobs
                </button>
              </div>
            )}

            {/* Active Jobs */}
            {/* <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">Active Jobs:</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                {member.active_jobs}
              </span>
            </div> */}
          </div>
        ))}
      </div>
        </>
      )}

      {/* Pagination */}
      {totalCount > itemsPerPage && (
        <div className="flex justify-center mt-8">
          <Pagination 
            count={Math.ceil(totalCount / itemsPerPage)} 
            page={page} 
            onChange={(event, value) => setPage(value)}
            size="large"
            variant="outlined" 
            shape="rounded"
          />
        </div>
      )}

      {/* Add/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedMember ? 'Edit Team Member' : 'Add New Team Member'}
              </h2>
              <button onClick={() => setShowDialog(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {selectedMember ? 'Update team member information' : 'Create a new team member account'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.full_name || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Update the raw full name so typing works naturally
                      setFormData((prev) => ({
                        ...prev,
                        full_name: value,
                        first_name: value.split(" ")[0] || "",
                        last_name: value.split(" ").slice(1).join(" ").trim(),
                      }));
                    }}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="worker">Worker</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {selectedMember ? 'Update' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedMember?.first_name} {selectedMember?.last_name}? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Future Jobs Dialog */}
      {showUnassignDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Clear Future Jobs</h2>
              <button
                onClick={() => {
                  setShowUnassignDialog(false);
                  setUnassignTargetMember(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              {unassignTargetMember?.first_name} {unassignTargetMember?.last_name} is inactive.
              Do you want to unassign all future jobs from this team member?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUnassignDialog(false);
                  setUnassignTargetMember(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearFutureJobs}
                disabled={isUnassigningJobs}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUnassigningJobs ? 'Clearing...' : 'Clear All Jobs'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;