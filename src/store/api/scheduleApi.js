import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const scheduleApi = createApi({
  reducerPath: 'scheduleApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/admin/schedule/' }),
  tagTypes: ['Schedule'],
  endpoints: (builder) => ({
    getCalendar: builder.query({
      query: (params = {}) => ({ url: 'calendar/', params }),
      providesTags: ['Schedule'],
    }),
  }),
});

export const { useGetCalendarQuery } = scheduleApi;


