const LETTER_RANGE = 'A-Za-zÀ-ÖØ-öø-ÿ';

const PERSON_NAME_REGEX = new RegExp(`^[${LETTER_RANGE}]+(?:[ '.-][${LETTER_RANGE}]+)*$`, 'u');
const PLACE_NAME_REGEX = new RegExp(`^[${LETTER_RANGE}]+(?:[ '.-][${LETTER_RANGE}]+)*$`, 'u');
const ADDRESS_TEXT_REGEX = new RegExp(`^[${LETTER_RANGE}0-9#.,'()/& -]+$`, 'u');

const LIMITS = Object.freeze({
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
  productName: 100,
  productDescription: 2000,
  priceMax: 10000,
  stockMax: 500,
  shippingFeeMax: 500,
  shippingDaysMax: 30,
});

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const normalizeWhitespace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

const validateRequiredText = (value, fieldName) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    throw createValidationError(`${fieldName} is required`);
  }
  return normalized;
};

const validateLength = (value, maxLength, message) => {
  if (value.length > maxLength) {
    throw createValidationError(message);
  }
  return value;
};

const validatePersonName = (value, fieldName = 'Name') => {
  const normalized = validateRequiredText(value, fieldName);
  validateLength(normalized, LIMITS.personName, `${fieldName} cannot exceed ${LIMITS.personName} characters`);

  if (!PERSON_NAME_REGEX.test(normalized)) {
    throw createValidationError(`${fieldName} may only contain letters, spaces, apostrophes, periods, and hyphens`);
  }

  return normalized;
};

const validatePlaceName = (value, fieldName, maxLength = LIMITS.city) => {
  const normalized = validateRequiredText(value, fieldName);
  validateLength(normalized, maxLength, `${fieldName} cannot exceed ${maxLength} characters`);

  if (!PLACE_NAME_REGEX.test(normalized)) {
    throw createValidationError(`${fieldName} may only contain letters, spaces, apostrophes, periods, and hyphens`);
  }

  return normalized;
};

const validateAddressLine = (value, fieldName, maxLength) => {
  const normalized = validateRequiredText(value, fieldName);
  validateLength(normalized, maxLength, `${fieldName} cannot exceed ${maxLength} characters`);

  if (!ADDRESS_TEXT_REGEX.test(normalized)) {
    throw createValidationError(`${fieldName} contains unsupported characters`);
  }

  return normalized;
};

const validateOptionalAddressLine = (value, fieldName, maxLength) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return null;
  validateLength(normalized, maxLength, `${fieldName} cannot exceed ${maxLength} characters`);

  if (!ADDRESS_TEXT_REGEX.test(normalized)) {
    throw createValidationError(`${fieldName} contains unsupported characters`);
  }

  return normalized;
};

const validatePhilippineMobileNumber = (value, fieldName = 'Phone number', { required = true } = {}) => {
  const digits = digitsOnly(value);
  if (!digits) {
    if (required) {
      throw createValidationError(`${fieldName} is required`);
    }
    return null;
  }

  if (!/^09\d{9}$/.test(digits)) {
    throw createValidationError(`${fieldName} must be an 11-digit Philippine mobile number starting with 09`);
  }

  return digits;
};

const validatePostalCode = (value, { required = true } = {}) => {
  const digits = digitsOnly(value);
  if (!digits) {
    if (required) {
      throw createValidationError('Postal code is required');
    }
    return null;
  }

  if (!/^\d{4}$/.test(digits)) {
    throw createValidationError('Postal code must be exactly 4 digits');
  }

  return digits;
};

const validatePaymentReference = (value, fieldName = 'Payment reference number') => {
  const digits = digitsOnly(value);
  const refRegex = new RegExp(`^\\d{${LIMITS.paymentReferenceMin},${LIMITS.paymentReferenceMax}}$`);

  if (!refRegex.test(digits)) {
    throw createValidationError(
      `${fieldName} must be between ${LIMITS.paymentReferenceMin} and ${LIMITS.paymentReferenceMax} digits`
    );
  }

  return digits;
};

const parseOptionalCoordinate = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const validateAddressPayload = (payload = {}) => {
  const recipientName = validatePersonName(
    payload.recipientName ?? payload.name ?? payload.fullName,
    'Recipient name'
  );

  return {
    recipientName,
    name: recipientName,
    phone: validatePhilippineMobileNumber(payload.phone, 'Phone number'),
    houseNo: validateAddressLine(payload.houseNo, 'House number or landmark', LIMITS.houseNo),
    street: validateAddressLine(payload.street, 'Street', LIMITS.street),
    barangay: validateAddressLine(payload.barangay, 'Barangay', LIMITS.barangay),
    city: validatePlaceName(payload.city, 'City / Municipality', LIMITS.city),
    province: validatePlaceName(payload.province, 'Province', LIMITS.province),
    postalCode: validatePostalCode(payload.postalCode),
    latitude: parseOptionalCoordinate(payload.latitude),
    longitude: parseOptionalCoordinate(payload.longitude),
  };
};

module.exports = {
  LIMITS,
  digitsOnly,
  normalizeWhitespace,
  validateAddressPayload,
  validateAddressLine,
  validateOptionalAddressLine,
  validatePaymentReference,
  validatePersonName,
  validatePhilippineMobileNumber,
  validatePlaceName,
  validatePostalCode,
};
