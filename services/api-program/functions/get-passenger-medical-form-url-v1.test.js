import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isAllowedPassengerUploadedKey,
  passengerListHasMedicalFormKey,
} from '../helpers/passenger-medical-form.js';

test('isAllowedPassengerUploadedKey accepts keys scoped to the requested program', () => {
  assert.equal(
    isAllowedPassengerUploadedKey('fichas-medicas/PRG#123/file.pdf', 'PRG#123'),
    true,
  );
});

test('isAllowedPassengerUploadedKey rejects keys scoped to another program', () => {
  assert.equal(
    isAllowedPassengerUploadedKey('fichas-medicas/PRG#999/file.pdf', 'PRG#123'),
    false,
  );
});

test('passengerListHasMedicalFormKey only accepts keys persisted in passengerList', () => {
  const passengerList = [
    { names: 'Ana', medicalForm: { s3Key: 'fichas-medicas/PRG#123/ana.pdf' } },
    { names: 'Luis', fichaMedicaS3Key: 'fichas-medicas/PRG#123/luis.png' },
  ];

  assert.equal(
    passengerListHasMedicalFormKey(passengerList, 'fichas-medicas/PRG#123/luis.png'),
    true,
  );
  assert.equal(
    passengerListHasMedicalFormKey(passengerList, 'fichas-medicas/PRG#123/otro.pdf'),
    false,
  );
});
