export const NATIONAL_ID_REGEX = /^1\d*$/;

export const isValidNationalId = (value: string | null | undefined): boolean => {
  if (!value) {
    return false;
  }
  return NATIONAL_ID_REGEX.test(value.trim());
};

export const getNationalIdError = () => 'National ID must start with 1 and contain only digits.';
