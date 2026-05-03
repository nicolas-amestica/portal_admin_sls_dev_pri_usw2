import assert from 'node:assert/strict';
import test from 'node:test';

import {
  containsMedicalFormKey,
  isAllowedPassengerUploadedKey,
  passengerListReferencesKey,
} from './medical-form-access.js';

test('isAllowedPassengerUploadedKey only accepts passenger upload keys', () => {
  assert.equal(isAllowedPassengerUploadedKey('fichas-medicas/valid.pdf'), true);
  assert.equal(isAllowedPassengerUploadedKey(' fichas-medicas/valid.JPG '), true);
  assert.equal(isAllowedPassengerUploadedKey('fichas-medicas/formato-base/base.pdf'), false);
  assert.equal(isAllowedPassengerUploadedKey('assets/informative-media/client/file.pdf'), false);
  assert.equal(isAllowedPassengerUploadedKey('fichas-medicas/../secret.pdf'), false);
});

test('containsMedicalFormKey matches exact nested S3 key references', () => {
  const s3Key = 'fichas-medicas/form-1.pdf';
  const passenger = {
    names: 'Test',
    medicalForm: {
      s3Key,
      fileName: 'Ficha.pdf',
    },
  };

  assert.equal(containsMedicalFormKey(passenger, s3Key), true);
  assert.equal(containsMedicalFormKey(passenger, 'fichas-medicas/form-10.pdf'), false);
  assert.equal(containsMedicalFormKey({ notes: s3Key }, s3Key), false);
});

test('passengerListReferencesKey requires an associated passenger entry', () => {
  const s3Key = 'fichas-medicas/form-1.pdf';
  const passengers = [
    { names: 'One', medicalForm: { s3Key: 'fichas-medicas/other.pdf' } },
    { names: 'Two', documents: [{ type: 'medical', key: s3Key }] },
  ];

  assert.equal(passengerListReferencesKey(passengers, s3Key), true);
  assert.equal(passengerListReferencesKey(passengers, 'fichas-medicas/missing.pdf'), false);
  assert.equal(passengerListReferencesKey(null, s3Key), false);
});
