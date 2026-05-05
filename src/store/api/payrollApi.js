import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const payrollApi = createApi({
  reducerPath: 'payrollApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/payroll/' }),
  tagTypes: ['PayrollSettings', 'PayrollEmployee', 'Payout', 'TimeEntry', 'TimeOff'],
  endpoints: (builder) => ({
    // Settings
    getSettings: builder.query({
      query: () => ({ url: 'settings/' }),
      providesTags: ['PayrollSettings'],
    }),
    updateSettings: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `settings/${id}/`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['PayrollSettings'],
    }),

    // Employees
    getEmployees: builder.query({
      query: (params = {}) => ({ url: 'employees', params }),
      providesTags: ['PayrollEmployee'],
    }),
    createEmployee: builder.mutation({
      query: (data) => ({
        url: 'employees/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['PayrollEmployee'],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `employees/${id}/`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['PayrollEmployee'],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `employees/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PayrollEmployee'],
    }),

    // Payouts
    getPayouts: builder.query({
      query: (params = {}) => ({ url: 'payouts/', params }),
      providesTags: ['Payout'],
    }),
    createPayout: builder.mutation({
      query: (data) => ({
        url: 'calculator/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Payout'],
    }),
    updatePayout: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `payouts/${id}/`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['Payout'],
    }),
    deletePayout: builder.mutation({
      query: (id) => ({
        url: `payouts/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Payout'],
    }),

    // Time Entries
    getTimeEntries: builder.query({
      query: (params = {}) => ({ url: 'time-entries/', params }),
      providesTags: ['TimeEntry'],
    }),
    getTodayTimeEntries: builder.query({
      query: () => ({ url: 'time-entries/today/' }),
      providesTags: ['TimeEntry'],
    }),
    getActiveSession: builder.query({
      query: () => ({ url: 'time-entries/active-session/' }),
      providesTags: ['TimeEntry'],
    }),
    checkIn: builder.mutation({
      query: (data) => ({
        url: 'time-entries/check-in/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['TimeEntry'],
    }),
    checkOut: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `time-entries/${id}/check-out/`,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['TimeEntry'],
    }),
    createTimeEntry: builder.mutation({
      query: (data) => ({
        url: 'time-entries/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['TimeEntry'],
    }),
    updateTimeEntry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `time-entries/${id}/`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['TimeEntry'],
    }),
    deleteTimeEntry: builder.mutation({
      query: (id) => ({
        url: `time-entries/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TimeEntry'],
    }),

    // Time off (PTO / absence)
    getTimeOffList: builder.query({
      query: (params = {}) => ({ url: 'time-off/', params }),
      providesTags: ['TimeOff'],
    }),
    createTimeOff: builder.mutation({
      query: (data) => ({
        url: 'time-off/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['TimeOff'],
    }),
    updateTimeOff: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `time-off/${id}/`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['TimeOff'],
    }),
    getAvailableEmployeesForDate: builder.query({
      query: (date) => ({
        url: 'time-off/available-employees/',
        params: { date },
      }),
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetPayoutsQuery,
  useCreatePayoutMutation,
  useUpdatePayoutMutation,
  useDeletePayoutMutation,
  useGetTimeEntriesQuery,
  useGetTodayTimeEntriesQuery,
  useGetActiveSessionQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useCreateTimeEntryMutation,
  useUpdateTimeEntryMutation,
  useDeleteTimeEntryMutation,
  useGetTimeOffListQuery,
  useCreateTimeOffMutation,
  useUpdateTimeOffMutation,
  useGetAvailableEmployeesForDateQuery,
} = payrollApi;

