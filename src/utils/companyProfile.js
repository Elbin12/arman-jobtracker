import { axiosInstance, BASE_URL } from '../store/axios/axios';

const DEFAULT_LOGO =
  'https://storage.googleapis.com/msgsndr/b8qvo7VooP3JD3dIZU42/media/683efc8fd5817643ff8194f0.jpeg';

const pickAccountField = (accountInfo, keys) => {
  for (const key of keys) {
    const value = accountInfo?.[key];
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const formatWebsite = (website) => {
  if (!website) return '';
  let value = website.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) {
    return value.replace(/^https?:\/\//i, '');
  }
  return value;
};

export function getDefaultCompanyProfile() {
  return {
    name: import.meta.env.VITE_COMPANY_NAME || 'TruShine Window Cleaning',
    tagline: import.meta.env.VITE_COMPANY_TAGLINE || 'Professional Cleaning Services',
    logoUrl: import.meta.env.VITE_COMPANY_LOGO_URL || DEFAULT_LOGO,
    website: import.meta.env.VITE_COMPANY_WEBSITE || 'www.trushinewindowcleaning.com',
    address: import.meta.env.VITE_COMPANY_ADDRESS || '3525 Murdock St, Houston, TX 77047',
    phone: import.meta.env.VITE_COMPANY_PHONE || '832-713-3545',
    email: import.meta.env.VITE_COMPANY_EMAIL || 'trushinehouston@gmail.com',
    locationName: null,
    domain: null,
    fromAccountInfo: false,
  };
}

export function mapAccountInfoToCompanyProfile(accountInfo) {
  const defaults = getDefaultCompanyProfile();
  if (!accountInfo) return defaults;

  const name =
    pickAccountField(accountInfo, ['account_name', 'location_name', 'company_name']) ||
    defaults.name;

  const locationName = pickAccountField(accountInfo, ['location_name']) || null;
  const tagline =
    locationName && locationName !== name ? locationName : defaults.tagline || '';

  const website = formatWebsite(
    pickAccountField(accountInfo, ['website', 'company_website']) ||
      pickAccountField(accountInfo, ['domain'])
  );

  const address = pickAccountField(accountInfo, [
    'address',
    'business_address',
    'company_address',
    'street_address',
    'full_address',
    'location_address',
  ]);

  const phone = pickAccountField(accountInfo, [
    'phone',
    'business_phone',
    'company_phone',
    'phone_number',
    'contact_phone',
  ]);

  const email = pickAccountField(accountInfo, [
    'email',
    'business_email',
    'company_email',
    'contact_email',
  ]);

  return {
    name,
    tagline,
    logoUrl: pickAccountField(accountInfo, ['logo_url', 'logo']) || defaults.logoUrl,
    website,
    address,
    phone,
    email,
    locationName,
    domain: pickAccountField(accountInfo, ['domain']) || null,
    locationId: accountInfo.location_id || null,
    fromAccountInfo: true,
  };
}

export async function fetchCompanyProfileByLocationId(locationId) {
  if (!locationId) return getDefaultCompanyProfile();

  const { data } = await axiosInstance.get(`${BASE_URL}/quote/account-info/`, {
    params: { location_id: locationId },
    headers: { 'X-Location-Id': locationId },
  });

  return mapAccountInfoToCompanyProfile(data);
}

/** Lines to show on quote PDF cover (address, phone, email, website). */
export function getCompanyContactLines(profile) {
  if (!profile) return [];
  return [profile.address, profile.phone, profile.email, profile.website].filter(Boolean);
}

/** Replace legacy TruShine legal branding with the active account/location name. */
export function applyCompanyNameToTermsText(text, companyName) {
  if (!text || !companyName) return text;

  return text
    .replaceAll('TruShine Window Cleaning', companyName)
    .replaceAll("TruShine's", `${companyName}'s`)
    .replaceAll('TruShine', companyName);
}

export function getLoadingCompanyProfile() {
  return {
    name: '',
    tagline: '',
    logoUrl: null,
    website: '',
    address: '',
    phone: '',
    email: '',
    locationName: null,
    domain: null,
    isPlaceholder: true,
    fromAccountInfo: false,
  };
}
