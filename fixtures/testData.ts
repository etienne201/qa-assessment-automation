export const VALID = {
  firstName:       'John',
  lastName:        'Smith',
  email:           'john.smith@example.com',
  password:        'P@ssw0rd',
  confirmPassword: 'P@ssw0rd',
  gender:          'male',
  dateOfBirth:     '1990-01-01',
  phoneNumber:     '1234567890',
  address:         '123 Main St, Apt 1',
  linkedinUrl:     'https://www.linkedin.com/in/johnsmith',
  githubUrl:       'https://github.com/johnsmith',
};

export const INVALID = {
  // First / Last name
  nameWithDigits:   '123John',
  nameWithSymbols:  'John@!',
  emptyString:      '',
  whitespaceOnly:   '   ',
  veryLong:         'A'.repeat(300),

  // Email
  emailMissingAt:   'johnexample.com',
  emailMissingDomain: 'john@',
  emailNoTLD:       'john@example',

  // Password
  passwordMismatch: 'Different1!',

  // Phone
  phone11Digits:    '12345678901',   // over 10
  phoneWithLetters: '123abc4567',
  phoneWithSymbols: '123-456-789',

  // URLs
  notLinkedIn:      'https://www.twitter.com/johnsmith',
  notGitHub:        'https://www.gitlab.com/johnsmith',
  malformedUrl:     'not-a-url',

  // Date
  dateFuture:       '2999-12-31',
  dateInvalidFormat: '01-01-1990',   // wrong format (DD-MM-YYYY)
  dateNonExistent:  '1990-02-30',
};

export const BOUNDARY = {
  phone10Digits:    '1234567890',    // exact max — valid
  phone9Digits:     '123456789',     // one below max
  phone11Digits:    '12345678901',   // one above max — invalid
  nameSingleChar:   'A',
  nameMaxLength:    'A'.repeat(255),
};