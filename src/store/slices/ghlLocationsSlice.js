/**
 * UI state for Subaccount / GHL locations admin page.
 * `formData` keys mirror `GHLLocationManagementSerializer` / `accounts.Location`.
 */

import { createSlice } from '@reduxjs/toolkit';

/** Default empty form matching serializer fields (string ids & dates as form strings). */
export function emptyGHLLocationForm() {
  return {
    id: '',
    company_id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    website: '',
    timezone: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    automatic_mobile_app_invite: false,
    date_added: '',
    domain: '',
  };
}

const initialState = {
  dialogOpen: false,
  editingLocation: null,
  formData: emptyGHLLocationForm(),
};

const ghlLocationsSlice = createSlice({
  name: 'ghlLocations',
  initialState,
  reducers: {
    setGHLLocationDialogOpen: (state, action) => {
      state.dialogOpen = action.payload;
    },
    setEditingGHLLocation: (state, action) => {
      state.editingLocation = action.payload;
    },
    setGHLLocationFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    resetGHLLocationForm: (state) => {
      state.formData = emptyGHLLocationForm();
    },
  },
});

export const {
  setGHLLocationDialogOpen,
  setEditingGHLLocation,
  setGHLLocationFormData,
  resetGHLLocationForm,
} = ghlLocationsSlice.actions;

export default ghlLocationsSlice.reducer;
