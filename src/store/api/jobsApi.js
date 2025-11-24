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

    //Calendar jobs
    getCalendarJobs: builder.query({
      query: (params = {}) => ({ url: 'jobs/', params }),
      providesTags: ['Job'],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useGetJobsByLocationQuery,
  useGetLocationsQuery,

  useGetCalendarJobsQuery
} = jobsApi;


