const LETTER_RANGE = "A-Za-zÀ-ÖØ-öø-ÿ";

const PERSON_NAME_REGEX = new RegExp(`^[${LETTER_RANGE}]+(?:[ '.-][${LETTER_RANGE}]+)*$`, "u");
const PLACE_NAME_REGEX = new RegExp(`^[${LETTER_RANGE}]+(?:[ '.-][${LETTER_RANGE}]+)*$`, "u");
const ADDRESS_TEXT_REGEX = new RegExp(`^[${LETTER_RANGE}0-9#.,'()/& -]+$`, "u");

export const INPUT_LIMITS = Object.freeze({
  personName: 50,
  email: 100,
  passwordMin: 6,
  passwordMax: 32,
  houseNo: 40,
  street: 100,
  barangay: 50,
  city: 50,
  province: 50,
  postalCode: 4,
  mobileNumber: 11,
  paymentReferenceMin: 8,
  paymentReferenceMax: 16,
});

const sanitizeByRegex = (value, regex, maxLength) =>
  String(value ?? "")
    .replace(regex, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, maxLength);

export const sanitizePersonNameInput = (value) =>
  sanitizeByRegex(value, new RegExp(`[^${LETTER_RANGE}'. -]`, "gu"), INPUT_LIMITS.personName);

export const sanitizePlaceNameInput = (value, maxLength = INPUT_LIMITS.city) =>
  sanitizeByRegex(value, new RegExp(`[^${LETTER_RANGE}'. -]`, "gu"), maxLength);

export const sanitizeAddressLineInput = (value, maxLength) =>
  sanitizeByRegex(value, new RegExp(`[^${LETTER_RANGE}0-9#.,'()/& -]`, "gu"), maxLength);

export const sanitizePhoneInput = (value) =>
  String(value ?? "").replace(/\D/g, "").slice(0, INPUT_LIMITS.mobileNumber);

export const sanitizePostalCodeInput = (value) =>
  String(value ?? "").replace(/\D/g, "").slice(0, INPUT_LIMITS.postalCode);

export const sanitizePaymentReferenceInput = (value) =>
  String(value ?? "").replace(/\D/g, "").slice(0, INPUT_LIMITS.paymentReferenceMax);

export const normalizeWhitespace = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

export const validatePersonName = (value, fieldName = "Name") => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  if (normalized.length > INPUT_LIMITS.personName) {
    throw new Error(`${fieldName} cannot exceed ${INPUT_LIMITS.personName} characters.`);
  }
  if (!PERSON_NAME_REGEX.test(normalized)) {
    throw new Error(`${fieldName} may only contain letters, spaces, apostrophes, periods, and hyphens.`);
  }
  return normalized;
};

export const validatePlaceName = (value, fieldName, maxLength = INPUT_LIMITS.city) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} cannot exceed ${maxLength} characters.`);
  }
  if (!PLACE_NAME_REGEX.test(normalized)) {
    throw new Error(`${fieldName} may only contain letters, spaces, apostrophes, periods, and hyphens.`);
  }
  return normalized;
};

export const validateAddressLine = (value, fieldName, maxLength) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} cannot exceed ${maxLength} characters.`);
  }
  if (!ADDRESS_TEXT_REGEX.test(normalized)) {
    throw new Error(`${fieldName} contains unsupported characters.`);
  }
  return normalized;
};

export const validatePhilippineMobileNumber = (value, fieldName = "Phone number", { required = true } = {}) => {
  const digits = sanitizePhoneInput(value);
  if (!digits) {
    if (required) {
      throw new Error(`${fieldName} is required.`);
    }
    return "";
  }
  if (!/^09\d{9}$/.test(digits)) {
    throw new Error(`${fieldName} must be an 11-digit Philippine mobile number starting with 09.`);
  }
  return digits;
};

export const validatePostalCode = (value, { required = true } = {}) => {
  const digits = sanitizePostalCodeInput(value);
  if (!digits) {
    if (required) {
      throw new Error("Postal code is required.");
    }
    return "";
  }
  if (!/^\d{4}$/.test(digits)) {
    throw new Error("Postal code must be exactly 4 digits.");
  }
  return digits;
};

export const validatePaymentReference = (value, fieldName = "Payment reference number") => {
  const digits = sanitizePaymentReferenceInput(value);
  const refRegex = new RegExp(`^\\d{${INPUT_LIMITS.paymentReferenceMin},${INPUT_LIMITS.paymentReferenceMax}}$`);
  if (!refRegex.test(digits)) {
    throw new Error(
      `${fieldName} must be between ${INPUT_LIMITS.paymentReferenceMin} and ${INPUT_LIMITS.paymentReferenceMax} digits.`
    );
  }
  return digits;
};

export const normalizeAddressPayload = (payload = {}) => {
  const recipientName = validatePersonName(payload.recipientName ?? payload.name ?? payload.fullName, "Recipient name");
  return {
    recipientName,
    name: recipientName,
    phone: validatePhilippineMobileNumber(payload.phone, "Phone number"),
    houseNo: validateAddressLine(payload.houseNo, "House number or landmark", INPUT_LIMITS.houseNo),
    street: validateAddressLine(payload.street, "Street", INPUT_LIMITS.street),
    barangay: validateAddressLine(payload.barangay, "Barangay", INPUT_LIMITS.barangay),
    city: validatePlaceName(payload.city, "City / Municipality", INPUT_LIMITS.city),
    province: validatePlaceName(payload.province, "Province", INPUT_LIMITS.province),
    postalCode: validatePostalCode(payload.postalCode),
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
  };
};
