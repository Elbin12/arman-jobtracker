import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/dashboard/' }),
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getAnalytics: builder.query({
      query: (params = {}) => ({ url: 'invoices/analytics/', params }),
      providesTags: ['Dashboard'],
    }),
    getHeatMap: builder.query({
      query: (params = {}) => ({ url: 'technician-workload/', params }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetAnalyticsQuery, useGetHeatMapQuery } = dashboardApi;


