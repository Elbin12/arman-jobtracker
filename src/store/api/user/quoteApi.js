import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL, axiosInstance } from '../../axios/axios';

export const quoteApi = createApi({
  reducerPath: 'quoteApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/quote/' }),
  tagTypes: ['quote'],
  endpoints: (builder) => ({
    getInitialData: builder.query({
        query: ()=>({url:'initial-data/'}),
        providesTags: ['quote'],
    }),
    getServiceQuestions: builder.query({
        query: (id)=>({url:`services/${id}/questions/`}),
        providesTags: ['quote'],
    }),
    createSubmission: builder.mutation({
      query: (contactData) => ({
        url: 'create-submission/',
        method: 'POST',
        data: contactData,
      }),
      invalidatesTags: ['Submission'],
    }), 
    updateSubmission: builder.mutation({
      query: ({ id, ...contactData }) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: contactData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Submission', id }],
    }),
    createQuestionResponses: builder.mutation({
      query: ({submissionId, serviceId, payload}) => ({
        url: `${submissionId}/services/${serviceId}/responses/`,
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Quote', 'Submission'],
    }),
    createServiceToSubmission: builder.mutation({
      query: ({submissionId, payload}) => ({
        url: `${submissionId}/add-services/`,
        method: 'POST',
        data: payload,
      }),
    }),
    getQuoteDetails: builder.query({
        query: (id)=>({url:`${id}/`}),
        providesTags: ['quote', 'Details'],
    }),
    submitQuote: builder.mutation({
      query: ({ submissionId, payload }) => ({
        url: `${submissionId}/submit/`,
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Quote', 'Submission'],
    }),
    searchContacts: builder.query({
      query: (searchTerm) => ({
        url: `contacts/search/?search=${searchTerm}`,
        method: "GET",
      }),
    }),

    // 🔍 search addresses
    getAddressesByContact: builder.query({
      query: (id) => ({
        url: `address/by-contact/${id}/`,
        method: "GET",
      }),
    }),
    createCustomProduct: builder.mutation({
      query: (payload) => ({
        url: 'custom-services/',
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['services'],
    }), 
    updateCustomProduct: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `custom-services/${id}/`,
        method: 'PATCH',
        data: payload,
      }),
    }),
    deleteCustomProduct: builder.mutation({
      query: (id) => ({
        url: `custom-services/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Custom Product'],
    }),
    getServices: builder.query({
        query: (id)=>({url:`services/?submission_id=${id}`}),
        providesTags: ['services'],
    }),
    createSchedule: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `schedule/update/${id}/`,
        method: 'PUT',
        data: payload,
      }),
    }),
    deleteService: builder.mutation({
      query: ({id, serviceId}) => ({
        url: `submissions/${id}/remove-service/${serviceId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['quote'],
    }),
    getGlobalPrice: builder.query({
        query: ()=>({url:'global-base-price/'}),
    }),
    submitOnlyCustomProducts: builder.mutation({
      query: (submissionId) => ({
        url: `${submissionId}/customservices/responses/`,
        method: 'POST',
      }),
    }),
    rejectQuote: builder.mutation({
      query: ({ submissionId, payload }) => ({
        url: `${submissionId}/reject/`,
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['quote', 'Details'],
    }),
    updateAdditionalData: builder.mutation({
      query: ({ submissionId, payload }) => ({
        url: `${submissionId}/additional-data/`,
        method: 'PATCH',
        data: payload,
      }),
      invalidatesTags: ['quote', 'Details'],
    }),
    // Submission Images
    uploadSubmissionImage: builder.mutation({
      queryFn: async (formData) => {
        try {
          const result = await axiosInstance({
            url: '/quote/submission-images/',
            method: 'POST',
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          return { data: result.data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status,
              data: error.response?.data || error.message,
            },
          };
        }
      },
      invalidatesTags: ['quote', 'Details'],
    }),
    getSubmissionImages: builder.query({
      queryFn: async (submissionId) => {
        try {
          const result = await axiosInstance({
            url: `/quote/submission-images/?submission_id=${submissionId}`,
            method: 'GET',
          });
          return { data: result.data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status,
              data: error.response?.data || error.message,
            },
          };
        }
      },
      providesTags: ['quote', 'Details'],
    }),
    updateSubmissionImage: builder.mutation({
      queryFn: async ({ imageId, caption }) => {
        try {
          const result = await axiosInstance({
            url: `/quote/submission-images/${imageId}/`,
            method: 'PATCH',
            data: { caption },
          });
          return { data: result.data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status,
              data: error.response?.data || error.message,
            },
          };
        }
      },
      invalidatesTags: ['quote', 'Details'],
    }),
    replaceSubmissionImage: builder.mutation({
      queryFn: async ({ imageId, formData }) => {
        try {
          const result = await axiosInstance({
            url: `/quote/submission-images/${imageId}/`,
            method: 'PUT',
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          return { data: result.data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status,
              data: error.response?.data || error.message,
            },
          };
        }
      },
      invalidatesTags: ['quote', 'Details'],
    }),
    deleteSubmissionImage: builder.mutation({
      queryFn: async (imageId) => {
        try {
          const result = await axiosInstance({
            url: `/quote/submission-images/${imageId}/`,
            method: 'DELETE',
          });
          return { data: result.data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status,
              data: error.response?.data || error.message,
            },
          };
        }
      },
      invalidatesTags: ['quote', 'Details'],
    }),
  }),
});

export const { useGetInitialDataQuery, useGetServiceQuestionsQuery, useCreateSubmissionMutation, useUpdateSubmissionMutation, useCreateQuestionResponsesMutation,
  useCreateServiceToSubmissionMutation,   useGetQuoteDetailsQuery,useSubmitQuoteMutation, useGetAddressesByContactQuery, useSearchContactsQuery, useCreateCustomProductMutation,
  useUpdateCustomProductMutation, useDeleteCustomProductMutation, useGetServicesQuery, useCreateScheduleMutation, useDeleteServiceMutation, useGetGlobalPriceQuery,
  useSubmitOnlyCustomProductsMutation, useRejectQuoteMutation, useUpdateAdditionalDataMutation, useUploadSubmissionImageMutation, useGetSubmissionImagesQuery,
  useUpdateSubmissionImageMutation, useDeleteSubmissionImageMutation, useReplaceSubmissionImageMutation
 } = quoteApi;
