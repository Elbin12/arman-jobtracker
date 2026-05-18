/**
 * RTK Query API for `GHLLocationManagementViewSet`
 * (`GET/POST /accounts/location-management/locations/`, `DELETE` toggles `is_active`,
 * `POST .../onboard/`).
 *
 * List uses `?search=` (matches backend: name, address, city, email, id).
 * Paginated list shape: `{ count, next, previous, results: GHLLocation[] }`.
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

/** @typedef {Object} GHLLocation
 * @property {string} id
 * @property {string} company_id
 * @property {string} name
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string} country
 * @property {string} postal_code
 * @property {string|null} [website]
 * @property {string} timezone
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string} phone
 * @property {boolean} automatic_mobile_app_invite
 * @property {string} domain
 * @property {boolean} [is_active]
 */

/** Serializer-aligned payload keys (UI forms create-only uses POST). */
export const GHL_LOCATION_SERIALIZER_KEYS = [
  'id',
  'company_id',
  'name',
  'address',
  'city',
  'state',
  'country',
  'postal_code',
  'website',
  'timezone',
  'first_name',
  'last_name',
  'email',
  'phone',
  'automatic_mobile_app_invite',
  'date_added',
  'domain',
  'is_active',
];

export const ghlLocationsApi = createApi({
  reducerPath: 'ghlLocationsApi',
  baseQuery: axiosBaseQuery({
    baseUrl: `${BASE_URL}/accounts/location-management/locations/`,
  }),
  tagTypes: ['GHLLocation'],
  endpoints: (builder) => ({
    /** GET — optional `{ search }` query param (backend icontains on several fields). */
    listGHLLocations: builder.query({
      query: (arg = {}) => ({
        url: '',
        params:
          arg.search != null && String(arg.search).trim() !== ''
            ? { search: String(arg.search).trim() }
            : undefined,
      }),
      providesTags: [{ type: 'GHLLocation', id: 'LIST' }],
    }),

    /** GET `/:pk/` — pk is GHL location id string. */
    getGHLLocation: builder.query({
      query: (pk) => `${encodeURIComponent(pk)}/`,
      providesTags: (result, error, pk) => [{ type: 'GHLLocation', id: pk }],
    }),

    /** POST — body matches `GHLLocationManagementSerializer`; server may set `company_id` from JWT account. */
    createGHLLocation: builder.mutation({
      query: (body) => ({
        url: '',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'GHLLocation', id: 'LIST' }],
    }),

    /** PUT `/:pk/` — full replacement per DRF ModelViewSet. */
    updateGHLLocation: builder.mutation({
      query: ({ pk, ...body }) => ({
        url: `${encodeURIComponent(pk)}/`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: (result, error, { pk }) => [
        { type: 'GHLLocation', id: pk },
        { type: 'GHLLocation', id: 'LIST' },
      ],
    }),

    /** DELETE — toggles `is_active` (does not remove the DB row). */
    toggleGHLLocationActive: builder.mutation({
      query: (pk) => ({
        url: `${encodeURIComponent(pk)}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'GHLLocation', id: 'LIST' }],
    }),

    /** POST `onboard/` — `{ auth_url: string }` for GHL chooselocation OAuth. */
    postGHLLocationOnboard: builder.mutation({
      query: () => ({
        url: 'onboard/',
        method: 'POST',
        data: {},
      }),
    }),
  }),
});

export const {
  useListGHLLocationsQuery,
  useGetGHLLocationQuery,
  useCreateGHLLocationMutation,
  useUpdateGHLLocationMutation,
  useToggleGHLLocationActiveMutation,
  usePostGHLLocationOnboardMutation,
} = ghlLocationsApi;
