import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const assigneesApi = createApi({
  reducerPath: 'assigneesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/users/' }),
  tagTypes: ['Assignee'],
  endpoints: (builder) => ({
    getAssignees: builder.query({
      query: (params = {}) => ({ url: '', params }),
      providesTags: ['Assignee'],
    }),
    createAssignee: builder.mutation({
      query: (payload) => ({ url: '', method: 'POST', data: payload }),
    }),
    updateAssignee: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `${id}/`, method: 'PATCH', data: payload }),
    }),
    deleteAssignee: builder.mutation({
      query: (id) => ({ url: `${id}/`, method: 'DELETE' }),
    }),
  }),
});

export const { useGetAssigneesQuery, useCreateAssigneeMutation, useUpdateAssigneeMutation, useDeleteAssigneeMutation } = assigneesApi;


