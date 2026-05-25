/** DynamoDB PK/SK helpers for herramienta PDF→Word (partition en tabla mantenedor). */

export const PDF_TO_WORD_JOB_PK = 'TOOLS#PDF_TO_WORD';

/**
 * @description Sort key estable para el job.
 * @param {string} jobId
 * @returns {string}
 */
export const pdfToWordJobSk = (jobId) => `JOB#${jobId}`;
