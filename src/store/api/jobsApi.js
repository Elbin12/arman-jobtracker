import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const jobsApi = createApi({
  reducerPath: 'jobsApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/job/' }),
  tagTypes: ['Job', 'Assignment', 'Schedule'],
  endpoints: (builder) => ({
    getJobs: builder.query({
      query: (params = {}) => ({ url: 'jobs/', params }),
      providesTags: ['Job'],
    }),
    getJobById: builder.query({
      query: (id) => ({ url: `${id}/` }),
      providesTags: (r, e, id) => [{ type: 'Job', id }],
    }),
    createJob: builder.mutation({
      query: ({apiEndpoint, payload}) => ({ url: `${apiEndpoint}/`, method: 'POST', data: payload }),
      invalidatesTags: ['Job'],
    }),
    updateJob: builder.mutation({
      query: ({ id, filter, ...payload }) => ({ url: `jobs/${id}/?${filter}`, method: 'PATCH', data: payload, }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Job', id }],
    }),
    getJobsByLocation: builder.query({
      query: (params) => ({ url: 'locations/jobs/', method: 'GET', params}),
    }),
    getLocations: builder.query({
      query: (params) => ({ url: 'locations/', method: 'GET', params}),
    }),
    deleteJob: builder.mutation({
      query: (id) => ({ url: `${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Job'],
    }),

    //Calendar jobs - uses occurrences endpoint for flattened calendar events
    getCalendarJobs: builder.query({
      query: (params = {}) => {
        // Build query params for occurrences API
        const queryParams = {};
        if (params.start) queryParams.start = params.start;
        if (params.end) queryParams.end = params.end;
        if (params.status) queryParams.status = params.status;
        if (params.job_ids) queryParams.job_ids = params.job_ids;
        if (params.assignee_ids) queryParams.assignee_ids = params.assignee_ids;
        if (params.search) queryParams.search = params.search;
        return { url: 'occurrences/', params: queryParams };
      },
      providesTags: ['Job'],
    }),

    // Get full job details by job_id (used when clicking on calendar event)
    getJobDetails: builder.query({
      query: (jobId) => ({ url: `jobs/${jobId}/` }),
      providesTags: (r, e, jobId) => [{ type: 'Job', id: jobId }],
    }),

    // Appointments
    getAppointmentsCalendar: builder.query({
      query: (params = {}) => {
        // Build query params for appointments API
        const queryParams = {};
        if (params.start) queryParams.start = params.start;
        if (params.end) queryParams.end = params.end;
        if (params.status) queryParams.status = params.status;
        if (params.assigned_user_ids) queryParams.assigned_user_ids = params.assigned_user_ids;
        if (params.search) queryParams.search = params.search;
        return { url: 'appointments-calendar/', params: queryParams };
      },
      providesTags: ['Appointment'],
    }),
    createAppointment: builder.mutation({
      query: (payload) => ({ url: 'appointments/', method: 'POST', data: payload }),
      invalidatesTags: ['Appointment'],
    }),
    updateAppointment: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `appointments/${id}/`, method: 'PATCH', data: payload }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Appointment', id }],
    }),
    deleteAppointment: builder.mutation({
      query: (id) => ({ url: `appointments/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Appointment'],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobByIdQuery,
  useGetJobDetailsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useGetJobsByLocationQuery,
  useGetLocationsQuery,

  useGetCalendarJobsQuery,
  useGetAppointmentsCalendarQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
} = jobsApi;


