import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const onestepgpsApi = createApi({
  reducerPath: 'onestepgpsApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/onestepgps/' }),
  tagTypes: ['OneStepGPSSettings', 'OneStepGPSAlerts'],
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => ({ url: 'settings/' }),
      providesTags: ['OneStepGPSSettings'],
    }),
    updateSettings: builder.mutation({
      query: (data) => ({
        url: 'settings/',
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['OneStepGPSSettings'],
    }),
    testConnection: builder.mutation({
      query: (data = {}) => ({
        url: 'settings/test/',
        method: 'POST',
        data,
      }),
    }),
    getDevices: builder.query({
      query: () => ({ url: 'devices/' }),
      keepUnusedDataFor: 10,
    }),
    getRecentAlerts: builder.query({
      query: (params = {}) => ({ url: 'alerts/recent/', params }),
      providesTags: ['OneStepGPSAlerts'],
      keepUnusedDataFor: 15,
    }),
    getAlertCounts: builder.query({
      query: (params = {}) => ({ url: 'alerts/counts/', params }),
      providesTags: ['OneStepGPSAlerts'],
      keepUnusedDataFor: 15,
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useTestConnectionMutation,
  useGetDevicesQuery,
  useGetRecentAlertsQuery,
  useGetAlertCountsQuery,
} = onestepgpsApi;
