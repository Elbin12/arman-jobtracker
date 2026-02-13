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
      query: (formData) => ({
        url: 'submission-images/',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
      // Don't transform response - return as-is to preserve structure
      invalidatesTags: ['quote', 'Details'],
    }),
    
    getSubmissionImages: builder.query({
      query: (submissionId) => ({
        url: `submission-images/?submission_id=${submissionId}`,
        method: 'GET',
      }),
      providesTags: ['quote', 'Details'],
    }),
    
    updateSubmissionImage: builder.mutation({
      query: ({ imageId, caption }) => ({
        url: `submission-images/${imageId}/`,
        method: 'PATCH',
        data: { caption },
      }),
      invalidatesTags: ['quote', 'Details'],
    }),
    
    replaceSubmissionImage: builder.mutation({
      query: ({ imageId, formData }) => ({
        url: `submission-images/${imageId}/`,
        method: 'PUT',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
      transformResponse: (response) => response ?? { success: true },
      invalidatesTags: ['quote', 'Details'],
    }),
    
    deleteSubmissionImage: builder.mutation({
      query: (imageId) => ({
        url: `submission-images/${imageId}/`,
        method: 'DELETE',
      }),
      // Handle empty responses (204 No Content) - return success object
      transformResponse: (response, meta) => {
        // If response is empty (204), return success indicator
        if (!response && meta?.response?.status === 204) {
          return { success: true }
        }
        return response ?? { success: true }
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
